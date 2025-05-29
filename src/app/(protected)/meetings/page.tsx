'use client'

import React from 'react'
import { api } from '@/trpc/react'
import useProject from '@/hooks/use-project'
import MeetingCard from '../dashboard/meeting-card'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// Define a type for Meeting
interface Meeting {
  id: string;
  name: string;
  meetingUrl: string;
  status: string;
  createdAt: string | Date;
  issues: any[] | null;
  projectId: string;
}

const MeetingsPage = () => {
    const { project } = useProject()
    const { data: meetings, isLoading, refetch: refetchMeetings } = api.project.getMeeting.useQuery(
        { projectId: project?.id || '' },
        {
            enabled: !!project?.id,
            refetchInterval: 4000,
        }
    )

    const deleteMeeting = api.project.deleteMeeting.useMutation({
        onSuccess: () => {
            toast.success('Meeting deleted successfully')
            refetchMeetings()
        },
        onError: (error) => {
            toast.error(`Error deleting meeting: ${error.message}`)
        }
    })
    
    // Handle delete meeting
    const handleDeleteMeeting = (meetingId: string) => {
        if (confirm('Are you sure you want to delete this meeting?')) {
            deleteMeeting.mutate({ meetingId })
        }
    }

    // Helper function to safely format the date
    const formatDate = (dateStr: string | Date | null | undefined) => {
        if (!dateStr) return 'N/A';
        try {
            return new Date(dateStr).toLocaleDateString();
        } catch (e) {
            console.error('Error formatting date:', dateStr, e);
            return 'Invalid Date';
        }
    }

    // Helper function to safely get issues count
    const getIssuesCount = (meeting: Meeting) => {
        if (!meeting.issues) return 0;
        return Array.isArray(meeting.issues) ? meeting.issues.length : 0;
    }

    return (
        <>
            <MeetingCard />
            <div className="h-6"></div>
            <h1 className='text-xl font-semibold'>Meetings</h1>
            
            {isLoading && (
                <div className="text-center py-8 flex flex-col items-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                    <p>Loading meetings...</p>
                </div>
            )}
            
            {!isLoading && (!meetings || meetings.length === 0) && (
                <div className="text-center py-4">No meetings found</div>
            )}
            
            {meetings && meetings.length > 0 && (
                <ul className='divide-y divide-gray-200'>
                    {meetings.map((meeting: Meeting) => (
                        <li key={meeting.id} className='flex items-center justify-between py-5 gap-x-6'>
                            <div>
                                <div className='min-w-0'>
                                    <div className='flex items-center gap-2'>
                                        <Link href={`/meetings/${meeting.id}`} className='text-sm font-semibold'>
                                            {meeting.name}
                                        </Link>
                                        {meeting.status === 'PROCESSING' && (
                                            <Badge className='bg-yellow-500 text-white flex items-center gap-1'>
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                Processing...
                                            </Badge>
                                        )}
                                        {meeting.status === 'COMPLETED' && getIssuesCount(meeting) === 0 && (
                                            <Badge variant="outline" className='text-red-500 border-red-200'>
                                                No Transcript
                                            </Badge>
                                        )}
                                        {meeting.status === 'COMPLETED' && getIssuesCount(meeting) > 0 && (
                                            <Badge variant="outline" className='text-green-500 border-green-200'>
                                                Completed
                                            </Badge>
                                        )}
                                    </div>
                                </div>

                                <div className='flex items-center text-xs text-gray-500 gap-x-2'>
                                    <p className='whitespace-nowrap'>
                                        {formatDate(meeting.createdAt)}
                                    </p>
                                    <p className='truncate'>
                                        {getIssuesCount(meeting)} issues
                                    </p>
                                </div>
                            </div>
                            <div className='flex items-center flex-none gap-x-4'>
                                <Link href={`/meetings/${meeting.id}`}>
                                    <Button size='sm' variant='outline'>
                                        View Meeting
                                    </Button>
                                </Link>
                                <Button disabled={deleteMeeting.isPending} size='sm' variant="destructive" onClick={() => handleDeleteMeeting(meeting.id)}>Delete Meeting</Button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </>
    )
}

export default MeetingsPage