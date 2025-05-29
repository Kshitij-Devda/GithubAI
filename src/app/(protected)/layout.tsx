'use client'

import { SidebarProvider } from '@/components/ui/sidebar'
import dynamic from 'next/dynamic'
import React from 'react'
import { AppSidebar } from './app-sidebar'

// Use dynamic import with SSR disabled for client-only components
const UserButton = dynamic(
  () => import('@clerk/nextjs').then((mod) => mod.UserButton),
  { ssr: false }
)

type Props = {
    children:React.ReactNode
}

const SidebarLayout = ({children}:Props) => {
    return (
       <SidebarProvider>
        <AppSidebar />
        <main className='w-full m-2'>
            <div className='flex items-centre gap-2 border-sidebar-border bg-sidebar border shadow rounded-md p-2 px-4'>
                <div className='ml-auto'></div>
                <UserButton />
            </div>
            <div className='h-4'></div>
            <div className='border-sidebar-border bg-sidebar border shadow rounded-md overflow-y-scroll h-[calc(100vh-6rem)] p-4'>
                {children}
            </div>
        </main>
       </SidebarProvider>
    )
}
export default SidebarLayout