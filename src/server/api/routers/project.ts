import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { pollCommits } from "@/lib/github";
import { indexGithubRepo } from "@/lib/github-loader";

export const projectRouter = createTRPCRouter({
    createProject : protectedProcedure.input(
        z.object({
            name: z.string(),
            githubUrl : z.string(),
            githubToken: z.string().optional()
        })
    ).mutation(async({ctx,input})=>{
        const project = await ctx.db.project.create({
            data:{
                githubUrl:input.githubUrl,
                name :input.name,
                userToProjects:{
                    create:{
                        userId : ctx.user.userId!,
                    }
                }
            }
            
        })
        await indexGithubRepo(project.id, input.githubUrl, input.githubToken)
        await pollCommits(project.id)
        return project
    }),
    getProjects:protectedProcedure.query(async({ctx})=>{
        return await ctx.db.project.findMany({
            where:{
                userToProjects:{
                    some:{
                        userId: ctx.user.userId!
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
    pollCommits: protectedProcedure.input(z.object({
        projectId: z.string()
    })).mutation(async ({ctx, input}) => {
        // Check if the user has access to this project
        const project = await ctx.db.project.findFirst({
            where: {
                id: input.projectId,
                userToProjects: {
                    some: {
                        userId: ctx.user.userId!
                    }
                }
            }
        });
        
        if (!project) {
            throw new Error("Project not found or you don't have access");
        }
        
        const commits = await pollCommits(input.projectId);
        return { success: true, count: commits.length };
    })
})