'use client'

import { SidebarContent,Sidebar, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar"
import { CreditCard, Presentation, Bot, LayoutDashboard, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import path from "path"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import useProject from "@/hooks/use-project"



const items = [
    {
        title: "DashBoard",
        url:'/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: "Q&A",
        url:'/qa',
        icon: Bot,
    },
    {
        title: "Meetings",
        url:'/meetings',
        icon: Presentation,
    },
    {
        title: "Credits",
        url:'/credits',
        icon: CreditCard,
    },
]


export function AppSidebar(){
    const pathname = usePathname()
    const { open }= useSidebar()
    const {projects, projectId, setProjectId} = useProject()
    return(
      <Sidebar collapsible="icon"  variant="floating">
        <SidebarHeader>
                <div className="flex items-center gap-2">
                    <Image src='/github.png' alt="logo" width={40} height={40}/>
                    {open && (
                        <h1 className="text-x1 font-bold text-primary/80">
                             AI Github Supporter</h1>
                    )}
                
               
                </div>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>
                        Application
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                        {items.map(item => {
                            return(
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                    <Link href={item.url} className={cn({
                                        '!bg-primary !text-white': pathname === item.url
                                        },'list-none')}>
                                            <item.icon/>
                                            <span>{item.title}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            )
                        })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                <SidebarGroup>
                    <SidebarGroupLabel>
                         Your Projects
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {projects?.map(project =>{
                                return(
                                    <SidebarMenuItem key={project.id}>
                                        <SidebarMenuButton asChild>
                                            <div onClick={()=>{
                                                setProjectId?.(project.id)
                                            }}>
                                                <div className={cn('rounded-sm border size-6 flex items-center justify-center text-sm bg-white text-primary',
                                                    {
                                                        'bg-primary text-white' : project.id === projectId
                                                    }
                                                )}>
                                                    {project.name[0]}

                                                </div>
                                                <span>{project.name}</span>
                                            </div>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        
                            <div className="h-2"></div>
                            {open && (
                          <SidebarMenuItem>
                            <Link href='/create'>
                          <Button size="sm" variant={'outline'} className="w-fit">
                            <Plus />
                                Create Project
                            </Button>
                            </Link>
                          </SidebarMenuItem>
                        )}
                           
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>


        </Sidebar>
    )
}