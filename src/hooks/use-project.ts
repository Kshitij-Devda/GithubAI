import { api } from '@/trpc/react'
import React, { useEffect } from 'react'
import { useLocalStorage } from 'usehooks-ts'
import { toast } from 'sonner'

const useProject = () => {
  const {data: projects = [], isError, error} = api.project.getProjects.useQuery(undefined, {
    retry: 1
  });
  
  useEffect(() => {
    if (isError) {
      toast.error("Failed to fetch projects: " + error?.message);
    }
  }, [isError, error]);

  const [projectId, setProjectId] = useLocalStorage<string | null>('AI-Github', null)
  const project = projects?.find((project: { id: string }) => project.id === projectId)

  return {
    projects,
    project,
    projectId,
    setProjectId
  }
}

export default useProject