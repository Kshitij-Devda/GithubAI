import { processMeeting } from "@/lib/assembly";
import { db } from "@/server/db";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

type ExtendedPrismaClient = PrismaClient & {
    Meeting: {
        update: any;
    }
}

const bodyparser = z.object({
    meetingUrl: z.string().url(),
    projectId: z.string(),
    meetingId: z.string(),
})

export const maxDuration = 600 // Increased from 300 to 600 for larger files

export async function POST(req:NextRequest) {
   try {
       // Authenticate the user
       const {userId} = await auth()
       if(!userId) {
           return NextResponse.json({error: 'Unauthorized'}, {status: 401})
       }

       // Parse the request body
       const body = await req.json()
       let parseResult;
       try {
           parseResult = bodyparser.parse(body)
       } catch (parseError) {
           console.error("Invalid request data:", parseError)
           return NextResponse.json({
               error: 'Invalid request data',
               details: parseError instanceof Error ? parseError.message : String(parseError)
           }, {status: 400})
       }

       const {meetingUrl, projectId, meetingId} = parseResult
       
       console.log(`Processing meeting ${meetingId} for project ${projectId}`)
       console.log(`Meeting URL type: ${meetingUrl.substring(0, 30)}...`)
       console.log(`AssemblyAI API Key defined:`, Boolean(process.env.ASSEMBLYAI_API_KEY))
       
       try {
           // Process the meeting audio
           const processResult = await processMeeting(meetingUrl)
           
           if (!processResult || !processResult.summaries || processResult.summaries.length === 0) {
               console.error("No summaries generated from meeting")
               
               // Create a placeholder issue instead of failing
               await (db as unknown as ExtendedPrismaClient).Meeting.update({
                   where: { id: meetingId },
                   data: { 
                     status: "COMPLETED",
                     issues: {
                       createMany: {
                         data: [{
                           start: "00:00",
                           end: "00:00",
                           gist: "Processing Error",
                           headline: "No summaries generated",
                           summary: "The system could not generate summaries from this audio file. This could be due to audio quality or format issues."
                         }]
                       }
                     }
                   }
               })
               
               return NextResponse.json({
                   success: true, 
                   message: 'Meeting processed with warnings',
                   warnings: ['No summaries generated from meeting']
               }, {status: 200})
           }
           
           const { summaries } = processResult
           
           console.log(`Generated ${summaries.length} summary points`)
           
           // Update the meeting in the database
           await (db as unknown as ExtendedPrismaClient).Meeting.update({
             where: { id: meetingId },
             data: { 
               status: "COMPLETED",
               issues: {
                 createMany: {
                   data: summaries.map(summary => ({
                     start: summary.start,
                     end: summary.end,
                     gist: summary.gist,
                     headline: summary.headline,
                     summary: summary.summary
                   }))
                 }
               },
               name: summaries.length > 0 && summaries[0]?.headline ? summaries[0].headline : "Processed Meeting"
             }
           })
           
           console.log(`Meeting ${meetingId} processed successfully`)
           return NextResponse.json({ 
             success: true, 
             message: 'Meeting processed successfully',
             summaryCount: summaries.length
           }, { status: 200 })
       } catch (processingError) {
           console.error("Error in processing meeting:", processingError)
           console.error("Stack trace:", processingError instanceof Error ? processingError.stack : "No stack trace")
           
           // Even with an error, mark the meeting as COMPLETED and add an error issue
           await (db as unknown as ExtendedPrismaClient).Meeting.update({
               where: { id: meetingId },
               data: { 
                 status: "COMPLETED",
                 issues: {
                   createMany: {
                     data: [{
                       start: "00:00",
                       end: "00:00",
                       gist: "Processing Error",
                       headline: "Error Processing Meeting",
                       summary: `An error occurred during processing: ${processingError instanceof Error ? processingError.message : String(processingError)}`
                     }]
                   }
                 }
               }
           })
           
           return NextResponse.json({
               success: true,
               message: 'Meeting processed with errors',
               error: processingError instanceof Error ? processingError.message : String(processingError)
           }, { status: 200 })
       }
   }
   catch(error){
       // Provide detailed error information
       console.error("Error processing meeting:", error)
       const errorMessage = error instanceof Error ? error.message : String(error)
       
       try {
           // Try to update the meeting as COMPLETED with an error message
           const { meetingId } = await req.json()
           if (meetingId) {
               await (db as unknown as ExtendedPrismaClient).Meeting.update({
                   where: { id: meetingId },
                   data: { 
                     status: "COMPLETED",
                     issues: {
                       createMany: {
                         data: [{
                           start: "00:00",
                           end: "00:00",
                           gist: "System Error",
                           headline: "System Processing Error",
                           summary: `A system error occurred: ${errorMessage}`
                         }]
                       }
                     }
                   }
               })
           }
       } catch (dbError) {
           console.error("Failed to update meeting with error status:", dbError)
       }
       
       return NextResponse.json({
           error: 'Failed to process meeting', 
           details: errorMessage
       }, {status: 500})
   }
}