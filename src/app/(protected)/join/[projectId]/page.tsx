import { db } from '@/server/db'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import React from 'react'

type Props = {
  params : Promise<{projectid: string}>
}


const JoinHandler = async (props : Props) => {
  const {projectid} = await props.params
 const {userId} = await auth()
 const dbuser = await db.user.findUnique({
  where : {
    id : userId ?? undefined
  }
 })

 const client = await clerkClient()
 const user = await client.users.getUser(userId ?? "")
 if(!dbuser){
  await db.user.create({
    data : {
      id : userId ?? "",
      emailAddress : user.emailAddresses[0]!.emailAddress,
      imageUrl : user.imageUrl,
      firstName : user.firstName,
      lastName : user.lastName
    }
  })
 }

 const project = await db.project.findUnique({
  where : {
    id : projectid
  }
 })
 if(!project) return redirect("/dashboard")
 try{
  await  db.userToProject.create({
    data:{
      userId: userId ?? "",
      projectId: projectid
    }
  })
} catch(error){
  console.error("User already in  project:")
}

return redirect(`/dashboard`)
}


export default JoinHandler