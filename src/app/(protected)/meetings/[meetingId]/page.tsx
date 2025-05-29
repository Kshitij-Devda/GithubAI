import React from 'react'
import IssueList from './issue-list'

type props = {
    params: Promise<{ meetingId: string }>
}

const MeetingDetailsPage = async({ params }: props) => {
    const { meetingId } = await params
    
  return (
    <IssueList meetingId={meetingId} />
  )
}

export default MeetingDetailsPage