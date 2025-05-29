import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pollCommits } from "@/lib/github";
import { indexGithubRepo } from "@/lib/github-loader";
import { PrismaClient } from "@prisma/client";
import { CarTaxiFront } from "lucide-react";


// Add type declaration for db with Question model
type ExtendedPrismaClient = PrismaClient & {
    Question: {
        findMany: any;
        create: (params: { data: any }) => Promise<any>;
    }
    Meeting: {
        findMany: any;
        create: (params: { data: any }) => Promise<any>;
        delete: (params: { where: { id: string } }) => Promise<any>;
        update: (params: { 
            where: { id: string }, 
            data: any 
        }) => Promise<any>;
        findFirst: (params: { 
            where: any;
            include?: { 
                issues?: boolean 
            } 
        }) => Promise<any>;
    }
}


export const projectRouter = createTRPCRouter({
    createProject : protectedProcedure.input(
        z.object({
            name: z.string(),
            githubUrl : z.string(),
            githubToken: z.string().optional()
        })
    ).mutation(async({ctx,input})=>{
        try {
            // First check if the user exists
            let user = await ctx.db.user.findUnique({
                where: { id: ctx.userId }
            });

            // If user doesn't exist in our database but has a valid auth userId,
            // create the user record first
            if (!user && ctx.userId) {
                console.log("Creating new user record for:", ctx.userId);
                
                try {
                    // Create a basic user record
                    user = await ctx.db.user.create({
                        data: {
                            id: ctx.userId,
                            emailAddress: `user-${ctx.userId}@example.com`, // Temporary email
                            credit: 150 // Default credits
                        }
                    });
                    console.log("User created successfully");
                } catch (userCreationError) {
                    console.error("Failed to create user:", userCreationError);
                    throw new Error("Failed to create user record. Please contact support.");
                }
            }
            
            if (!user) {
                throw new Error("User not found or you are not authenticated. Please sign in again.");
            }
            
            console.log("Creating project for user:", user.id);
            
            // Create the project
            const project = await ctx.db.project.create({       
                data:{
                    githubUrl: input.githubUrl,
                    name: input.name
                }
            });
            
            console.log("Project created:", project.id);
            
            // Then create the user-project relation separately
            await ctx.db.userToProject.create({
                data: {
                    userId: ctx.userId,
                    projectId: project.id
                }
            });
            
            console.log("User-project relation created");
            
            // Then process the repo
            await indexGithubRepo(project.id, input.githubUrl, input.githubToken)
            await pollCommits(project.id)
            
            return project;
        } catch (error) {
            console.error("Error creating project:", error);
            throw error;
        }
    }),
    getProjects:protectedProcedure.query(async({ctx})=>{
        return await ctx.db.project.findMany({
            where:{
                userToProjects:{
                    some:{
                        userId: ctx.userId
                    }
                },
                deletedAt:null
            }
        })
    }),
    getCommits : protectedProcedure.input(z.object({
        projectId : z.string()
    })).query(async({ctx,input})=>{
        const commits = await pollCommits(input.projectId).then().catch(console.error)
        return await ctx.db.commit.findMany({
            where : {
                projectId : input.projectId
            },
            orderBy: {
                commitDate: 'desc'
            }
        })
    }),
    saveAnswer: protectedProcedure.input(z.object({
        projectId: z.string(),
        question: z.string(),
        answer:z.string(),
        fileReference: z.any()
            
    })).mutation(async({ctx,input})=>{
        // Use type assertion to access the Question model
        return await (ctx.db as unknown as ExtendedPrismaClient).Question.create({
            data:{
                answer: input.answer,
                fileReference: input.fileReference,
                projectId: input.projectId,
                question: input.question,
                userId: ctx.userId
            }
        })
    }),
    getQuestions: protectedProcedure
        .input(z.object({
            projectId: z.string()
        }))
        .query(async ({ ctx, input }) => {
            try {
                const questions = await (ctx.db as unknown as ExtendedPrismaClient).Question.findMany({
                    where: {
                        projectid: input.projectId
                    },
                    include: {
                        user: true
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }   
                });
                
                return questions;
                
            } catch (error) {
                console.error('Error fetching questions:', error);
                throw new Error('Failed to fetch questions');
            }
        }),

        uploadMeeting: protectedProcedure.input(z.object({
            projectId: z.string(),
            meetingUrl: z.string(),
            name: z.string()
        })).mutation(async({ctx,input})=>{
            const meeting = await (ctx.db as unknown as ExtendedPrismaClient).Meeting.create({
                data:{
                    meetingUrl: input.meetingUrl,
                    projectId: input.projectId,
                    name: input.name,
                    status: "PROCESSING"
                }
            })
            return meeting
        }),
        getMeeting: protectedProcedure.input(z.object({
            projectId: z.string()
        })).query(async({ctx,input})=>{
            return await (ctx.db as unknown as ExtendedPrismaClient).Meeting.findMany({
                where: {projectId: input.projectId},
                include: {
                    issues: true  // Include the issues relation
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        }),
        deleteMeeting: protectedProcedure.input(z.object({meetingId: z.string()})).mutation(async({ctx,input})=>{
            try {
                // First delete all issues related to the meeting
                await ctx.db.issue.deleteMany({
                    where: {
                        meetingId: input.meetingId
                    }
                });
                
                // Then delete the meeting
                return await ctx.db.meeting.delete({ 
                    where: { id: input.meetingId } 
                });
            } catch (error) {
                console.error("Error deleting meeting:", error);
                throw new Error(`Failed to delete meeting: ${error instanceof Error ? error.message : String(error)}`);
            }
        }),
        getMeetingById: protectedProcedure.input(z.object({meetingId: z.string()})).query(async({ctx,input})=>{
            return await (ctx.db as unknown as ExtendedPrismaClient).Meeting.findFirst({ 
                where: { id: input.meetingId },
                include: {
                    issues: true
                }
            });
        }),

        archiveProject: protectedProcedure.input(z.object({
            projectId: z.string()
        })).mutation(async({ctx,input})=>{
            return await (ctx.db as unknown as ExtendedPrismaClient).project.update({
                where: {id: input.projectId},
                data: {
                    deletedAt: new Date()
                }
            })
        }),
        getTeamMembers: protectedProcedure.input(z.object({
            projectId: z.string()
        })).query(async({ctx,input})=>{
            return await (ctx.db as unknown as ExtendedPrismaClient).userToProject.findMany({
                where: {projectId: input.projectId},
                include: {
                    user: true
                }
            })
        }),
        getMyCredits: protectedProcedure.query(async({ctx}) =>{
            return await ctx.db.user.findUnique({where :{ id: ctx.userId}, select : {credit : true}})
        }),

        pollCommits: protectedProcedure.input(z.object({
        projectId: z.string()
    })).mutation(async ({ctx, input}) => {
        const project = await ctx.db.project.findFirst({
            where: {
                id: input.projectId,
                userToProjects: {
                    some: {
                        userId: ctx.userId
                    }
                }
            }
        });
        
        if (!project) {
            throw new Error("Project not found or you don't have access");
        }
        
        const commits = await pollCommits(input.projectId);
        return { success: true, count: commits.length };
    }),

    inviteUser: protectedProcedure.input(z.object({
        projectId: z.string(),
        email: z.string().email()
    })).mutation(async ({ctx, input}) => {
        const project = await ctx.db.project.findFirst({
            where: {
                id: input.projectId,
                userToProjects: {
                    some: {
                        userId: ctx.userId
                    }
                }
            }
        });
        
        if (!project) {
            throw new Error("Project not found or you don't have access");
        }

        // Check if user exists
        const userToInvite = await ctx.db.user.findUnique({
            where: {
                emailAddress: input.email
            }
        });

        if (!userToInvite) {
            throw new Error("User not found. They need to sign up first.");
        }

        // Check if user is already a member of the project
        const existingMember = await ctx.db.userToProject.findUnique({
            where: {
                userId_projectId: {
                    userId: userToInvite.id,
                    projectId: input.projectId
                }
            }
        });

        if (existingMember) {
            throw new Error("User is already a member of this project");
        }

        // Add user to project
        await ctx.db.userToProject.create({
            data: {
                userId: userToInvite.id,
                projectId: input.projectId
            }
        });

        return { success: true, message: "User invited successfully" };
    })
})