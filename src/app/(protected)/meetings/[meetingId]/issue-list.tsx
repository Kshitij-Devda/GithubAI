'use client'

import { api, RouterOutputs } from '@/trpc/react'
import { VideoIcon, AlertTriangleIcon, RefreshCcw } from 'lucide-react'
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type props = {
    meetingId: string
}

// Define issue interface
interface Issue {
    id: string;
    headline: string;
    summary: string;
    start: string;
    end: string;
    gist: string;
    createdAt: string | Date;
    updatedAt: string | Date;
    meetingId: string;
}

const IssueList = ({ meetingId }: props) => {
  
    const { data: meeting, isLoading, refetch } = api.project.getMeetingById.useQuery({ meetingId }, {
        refetchInterval: 4000,
        enabled: !!meetingId
    })

    // Handle manual refresh
    const handleRefresh = () => {
        refetch();
    }

    // Format date safely
    const formatDate = (dateStr: string | Date | null | undefined) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString();
        } catch (e) {
            console.error('Error formatting date:', dateStr, e);
            return 'Invalid Date';
        }
    }

    if (isLoading) {
        return <div className="p-8 text-center">Loading...</div>
    }

    if (!meeting) {
        return <div className="p-8 text-center">Meeting not found</div>
    }
    
    return (
        <>
        <div className='p-8'>
            <div className='mx-auto flex max-w-2xl items-center justify-between gap-x-8 border-b pb-6 lg:max-0 lg:max-w-none'>
                <div className='flex items-center gap-x-6'>
                    <div className='rounded-full border bg-white p-3'>
                        <VideoIcon className='h-6 w-6' />
                    </div>
                    <h1>
                        <div className='text-sm leading-6 text-gray-600'>
                            Meeting on {formatDate(meeting.createdAt)}
                        </div>
                        <div className='mt-1 text-base font-semibold leading-6 text-gray-900'>
                            {meeting.name}
                        </div>
                    </h1>
                </div>
                <Button 
                    onClick={handleRefresh} 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center gap-1"
                >
                    <RefreshCcw className="h-3 w-3" />
                    Refresh
                </Button>
            </div>
            <div className="h-4"></div>
            {!meeting.issues || meeting.issues.length === 0 ? (
                <div className="flex flex-col gap-4 py-4">
                    <Alert variant="destructive">
                        <AlertTriangleIcon className="h-4 w-4" />
                        <AlertTitle>No transcript available</AlertTitle>
                        <AlertDescription>
                            <p>The meeting transcript could not be processed. This could be due to one of the following reasons:</p>
                            <ul className="list-disc pl-5 mt-2">
                                <li>Missing or invalid AssemblyAI API key in your environment variables</li>
                                <li>Invalid audio file format (only .mp3, .wav, and .m4a are supported)</li>
                                <li>Audio file is too large (max 50MB)</li>
                                <li>Processing is still in progress</li>
                                <li>The audio file is empty or corrupted</li>
                                <li>Problem with the file hosting service (try a different audio file)</li>
                            </ul>
                            <div className="mt-4">
                                <p>To fix this issue:</p>
                                <ol className="list-decimal pl-5 mt-2">
                                    <li>Add a valid AssemblyAI API key to the .env file (get one from assemblyai.com)</li>
                                    <li>Try uploading a smaller, cleaner audio file</li>
                                    <li>Wait a few minutes and click the Refresh button above</li>
                                </ol>
                            </div>
                            <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                <p className="text-sm text-yellow-800">
                                    <strong>Note:</strong> If you added an API key, you'll need to restart the application for it to take effect.
                                </p>
                            </div>
                        </AlertDescription>
                    </Alert>
                </div>
            ) : (
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                    {meeting.issues.map((issue: any) => (
                        <IssueCard key={issue.id} issue={issue as Issue} />
                    ))}
                </div>
            )}
        </div>
        </>
    )
}

function IssueCard({ issue }: { issue: Issue }) {
    const [open, setOpen] = React.useState(false)
    return (
        <>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{issue.gist}</DialogTitle>
                    <DialogDescription>
                        <span className="text-xs text-gray-500 block">
                            {typeof issue.createdAt === 'string' ? new Date(issue.createdAt).toLocaleDateString() : issue.createdAt.toLocaleDateString()}
                        </span>
                    </DialogDescription>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{issue.start} - {issue.end}</Badge>
                    </div>
                </DialogHeader>
                
                <div className="mt-4">
                    <h3 className="font-medium text-gray-800 mb-2">{issue.headline}</h3>
                    <blockquote className="border-l-4 border-gray-300 bg-gray-50 p-4 my-2">
                        <p className="font-medium italic leading-relaxed text-gray-900">{issue.summary}</p>
                    </blockquote>
                </div>
            </DialogContent>
        </Dialog> 
        <Card className="hover:shadow-md transition-shadow duration-200 cursor-pointer" onClick={() => setOpen(true)}>
            <CardHeader>
                <CardTitle className="text-lg line-clamp-1">{issue.gist}</CardTitle>
                <div className="border-b my-2"></div>
                <CardDescription className="line-clamp-2">
                    {issue.headline}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
                <Badge variant="outline">{issue.start} - {issue.end}</Badge>
                <Button size="sm" onClick={(e) => {
                    e.stopPropagation(); // Prevent card click from triggering
                    setOpen(true);
                }}>
                    Details
                </Button>
            </CardContent>
        </Card>
        </>
    )
}

export default IssueList