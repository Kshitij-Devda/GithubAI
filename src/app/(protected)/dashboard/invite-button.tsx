'use client'

import React, { useState } from 'react'
import useProject from '@/hooks/use-project'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { api } from "@/trpc/react"
import { TRPCClientError } from '@trpc/client'

const InviteButton = () => {
    const {project} = useProject()
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState("")

    const { mutate: inviteUser } = api.project.inviteUser.useMutation({
        onSuccess: () => {
            toast.success("Invitation sent successfully")
            setOpen(false)
            setEmail("")
        },
        onError: (error) => {
            if (error instanceof TRPCClientError) {
                toast.error(error.message)
            } else {
                toast.error("Failed to send invitation")
            }
        }
    })

    const handleInvite = () => {
        if (!email) {
            toast.error("Please enter an email address")
            return
        }
        
        if (!project?.id) {
            toast.error("No project selected")
            return
        }
        
        inviteUser({ projectId: project.id, email })
    }

    return (
        <>
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Invite User</DialogTitle>
                    <DialogDescription>
                        Enter the email address of the user you want to invite to this project.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2">
                    <Input
                        type="email"
                        placeholder="Enter email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <Button onClick={handleInvite}>Send Invite</Button>
                </div>
            </DialogContent>
        </Dialog>
        <Button size='sm' onClick={() => setOpen(true)}>Invite members</Button>
        </>
    )
}

export default InviteButton