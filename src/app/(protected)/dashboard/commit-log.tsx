'use client'

import useProject from '@/hooks/use-project'
import React, { useState } from 'react'
import { api } from '@/trpc/react'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const CommitLog = () => {
    const {projectId, project} = useProject()
    const {data: commits, refetch} = api.project.getCommits.useQuery({projectId})
    const [isPolling, setIsPolling] = useState(false)
    
    const pollCommits = api.project.pollCommits.useMutation({
        onSuccess: (data) => {
            toast.success(`Successfully processed ${data.count} new commits`)
            refetch() // Refresh the commits list
            setIsPolling(false)
        },
        onError: (error) => {
            toast.error(`Error processing commits: ${error.message}`)
            setIsPolling(false)
        }
    })
    
    const handlePollCommits = () => {
        if (!projectId) {
            toast.error("No project selected")
            return
        }
        
        setIsPolling(true)
        pollCommits.mutate({projectId})
    }
    
  return (
   <>
   <div className="flex justify-between items-center mb-4">
     <h2 className="text-xl font-semibold">Commit History</h2>
     <Button 
       onClick={handlePollCommits}
       disabled={isPolling || !projectId}
       size="sm"
       variant="outline"
     >
       {isPolling ? (
         <>
           <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
           Updating...
         </>
       ) : (
         <>
           <RefreshCw className="mr-2 h-4 w-4" />
           Refresh Commits
         </>
       )}
     </Button>
   </div>
   
   {commits?.length === 0 && (
     <div className="text-center py-8 text-muted-foreground">
       No commits found. Click refresh to fetch commits.
     </div>
   )}
   
   <ul className='space-y-6'>
    {commits?.map((commit,commitIdx)=>{
        return <li key={`commit-${commit.id}`} className='relative flex gap-x-2'>
            <div className={cn(
                commitIdx === commits.length - 1 ? 'h-6' : '-bottom-6',
                'absolute left-0 top-0 flex w-6 justify-center' 
            )}>
            <div className='w-px translate-x-1 bg-gray-200' ></div>

            </div>

            <>
            <img src={commit.commitAuthorAvatar} alt='commit avatar' className='relative mt-4 size-8 flex-none rounded-full bg-gray-50'/>
            <div className='flex-auto rounded-md bg-white p-3 ring-1 ring-gray-200'>
                <div className='flex justify-between gap-x-4'>
                <Link target='_blank' href={`${project?.githubUrl}/commit/${commit.commitHash}`} className='py-0.5 text-xs leading-5 text-gray-500'>
                <span className='font-medium text-gray-900'>
                    {commit.commitAuthorName}
                </span>{" "}
                <span className='inline-flex items-center '>
                  committed
                  <ExternalLink className='ml-1 size-4'/>
                </span>
                </Link>
                </div>
                <span className="font-semibold text-gray-900">
                {commit.commitmessage}
            </span>
            <pre className='mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-500'>
                {commit.summary}
            </pre>
            </div>
           
            </>
        </li>
    })}
    </ul>
    </>
  )
}

export default CommitLog