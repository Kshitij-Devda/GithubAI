'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { createFakeUploadUrl, uploadFileDirectly } from '@/lib/upload-helper'
import { Presentation, Upload, InfoIcon } from 'lucide-react'
import React, { useState } from 'react'
import {useDropzone} from 'react-dropzone'
import {CircularProgressbar, buildStyles} from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'
import { api } from '@/trpc/react'
import { toast } from 'sonner'
import useProject from '@/hooks/use-project'
import { useRouter } from 'next/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Define a helper function outside of the component
const processApi = async (meetingUrl: string, projectId: string, meetingId: string) => {
    try {
        console.log("Calling process-meeting API...");
        const response = await fetch('/api/process-meeting', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                meetingUrl,
                projectId,
                meetingId
            })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            console.error('Failed to process meeting:', result);
            return { 
                success: false, 
                error: result.details || result.error || 'Unknown error processing meeting'
            };
        }
        
        return result;
    } catch (error) {
        console.error('Error processing meeting:', error);
        return { 
            success: false, 
            error: error instanceof Error ? error.message : 'An unexpected error occurred'
        };
    }
};

const MeetingCard = () => {
    const { project } = useProject()
    const router = useRouter()
    const [isUploading, setIsUploading] = useState(false)
    const [progress, setProgress] = useState(0)
    const [errorMessage, setErrorMessage] = useState<string | null>(null)
    
    const uploadMeeting = api.project.uploadMeeting.useMutation({
       onSuccess: () => {
           console.log('Meeting saved to database')
       },
       onError: (error) => {
           toast.error(`Error creating meeting: ${error.message}`)
       }
    })
    
    const handleDrop = async (acceptedFiles: File[]) => {
        setErrorMessage(null)
        setProgress(0)
        
        if (!project?.id) {
            toast.error('No project selected')
            return
        }
        
        if (acceptedFiles.length === 0) {
            toast.error('No file selected')
            return
        }
        
        const file = acceptedFiles[0]
        if (!file) {
            toast.error('Invalid file')
            return
        }
        
        // Validate file size
        if (file.size > 20 * 1024 * 1024) { // 20MB max
            toast.error('File too large. Please upload audio files smaller than 20MB.')
            setErrorMessage('File size exceeds the 20MB limit. Please compress your audio file or use a shorter recording.')
            return
        }
        
        // Start upload
        setIsUploading(true)
        
        try {
            console.log("Starting upload for file:", file.name)
            
            // First check if we have a valid AssemblyAI API key - this avoids wasting time on uploads if the key is missing
            let hasValidApiKey = false;
            try {
                // Ping the process-meeting endpoint to check if API key is configured
                const response = await fetch('/api/check-api-key', { method: 'GET' }).catch(() => null);
                if (response && response.ok) {
                    hasValidApiKey = true;
                }
            } catch (error) {
                console.warn("Could not verify API key, proceeding anyway");
            }
            
            if (!hasValidApiKey) {
                console.warn("No valid AssemblyAI API key found, but proceeding with upload");
            }
            
            // Use the helper function to get a URL for the uploaded file
            const downloadUrl = await uploadFileDirectly(file, setProgress)
            
            console.log("Upload succeeded, URL type:", downloadUrl.substring(0, 20))
            
            // Save to database
            console.log("Saving to database...")
            const meeting = await uploadMeeting.mutateAsync({
                projectId: project.id,
                meetingUrl: downloadUrl,
                name: file.name
            })
            
            // Process the meeting
            console.log("Processing meeting...");
            toast.loading('Processing your meeting... This may take a minute.')
            
            const result = await processApi(downloadUrl, project.id, meeting.id);
            
            if (!result.success) {
                toast.dismiss()
                toast.error(`Processing error: ${result.error}`)
                console.error("Meeting processing error:", result.error);
                // We'll still navigate to meetings since the meeting was created
                router.push('/meetings')
                return
            }
            
            toast.dismiss()
            toast.success('Meeting processed successfully!')
            router.push('/meetings')
            
        } catch (error) {
            toast.dismiss()
            console.error("Error during upload or processing:", error)
            const message = error instanceof Error ? error.message : 'Unknown error during upload or processing'
            setErrorMessage(message + ". Please try again with a smaller, cleaner audio file.")
            toast.error(message)
        } finally {
            setIsUploading(false)
        }
    }
    
    const {getRootProps, getInputProps} = useDropzone({
        accept: {
            'audio/*': ['.mp3','.wav','.m4a']
        },
        multiple: false,
        maxSize: 50_000_000,
        onDrop: handleDrop
    })

    // Handle retry 
    const handleRetry = () => {
        setErrorMessage(null)
    }

    return (
        <Card className='col-span-2 flex flex-col items-center justify-center p-10' {...getRootProps()}>
            {!isUploading && !errorMessage && (
                <>
                    <Presentation className='h-10 w-10 animate-bounce' />
                    <h3 className='mt-2 text-sm font-semibold text-gray-900 flex items-center gap-2'>
                        Create a new meeting
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <InfoIcon className="h-4 w-4 text-gray-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">To process meeting transcripts, you must add an AssemblyAI API key to your .env file. Get one at assemblyai.com</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </h3>
                    <p className='mt-1 text-center text-sm text-gray-500'>
                        Analyze your meeting notes with AI
                        <br/>
                        Powered by AI
                    </p>
                    <div className="mt-6">
                        <Button>
                            <Upload className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true"/>
                            Upload a meeting
                            <input className='hidden' {...getInputProps()} />
                        </Button>
                    </div>
                </>
            )}
            
            {errorMessage && !isUploading && (
                <div className="text-center">
                    <div className="text-red-500 mb-4">
                        <h3 className="text-sm font-semibold">Upload Error</h3>
                        <p className="text-xs mt-1">{errorMessage}</p>
                    </div>
                    <Button onClick={handleRetry} variant="outline" size="sm">
                        Try Again
                    </Button>
                </div>
            )}
            
            {isUploading && (
                <div className='text-center'>
                    <div className="w-20 h-20 mx-auto">
                        <CircularProgressbar 
                            value={progress} 
                            text={`${progress}%`} 
                            styles={buildStyles({
                                pathColor: '#2563eb',
                                textColor: '#2563eb',
                            })}
                        />
                    </div>
                    <p className='text-sm text-gray-500 text-center mt-2'>
                        Uploading your meeting...
                    </p>
                </div>
            )}
        </Card>
    )
}

export default MeetingCard