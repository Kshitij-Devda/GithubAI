'use client'

import useProject from '@/hooks/use-project';
import { ExternalLink, Github } from 'lucide-react';
import React from 'react'
import { useUser } from '@clerk/nextjs';
import Link from 'next/link';
import CommitLog from './commit-log';
import AskQuestionCard from './ask-question-card';
import MeetingCard from './meeting-card';
import ArchiveButton from './archive-button';
import { useQueryClient } from '@tanstack/react-query';
import InviteButton from './invite-button';
import TeamMembers from './team-member';



const DashBoardPage= () => {
    
    const {project} = useProject()
    const queryClient = useQueryClient()
  return (
    <div>
     
      <div className='flex items-center justify-between flex-wrap gap-y-4'>
        {/*github Link*/} 
        <div className='w-fit rounded-md bg-primary px-4 py-3'>
          {/* <div className='flex items-center'> */}
        <Github className='size:5 text-white'/>
        <div className="ml-2">
          <p className='text-sm font-medium text-white'>
            This is Linked to {' '}
            <Link href={project?.githubUrl ?? ""} className="inline-flex items-center text-white/80 hover:underline">
            {project?.githubUrl}
            <ExternalLink className='ml-1 size-4'/>
            </Link>
          </p>
        </div>
        {/* </div> */}
        </div>
        <div className="h-4"></div>
        <div className="flex items-center gap-4">
          <TeamMembers />
          <InviteButton />
          <ArchiveButton />
        </div>
      </div>

      <div className="mt-4">
        <div className="grid grid-clos-1 gap-4 sm:grid-clos-5">
          <AskQuestionCard />
          <MeetingCard />
        </div>
      </div>
      <div className="mt-8"></div>
      <CommitLog />
    </div>

  )
}

export default DashBoardPage