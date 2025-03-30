import React from 'react'
import { Octokit} from 'octokit'
import { db } from '@/server/db';
import axios from 'axios';
import { aiSummariseCommit } from './gemini';

export interface CommitData {
    commitHash: string;
    commitMessage: string;
    commitAuthorName: string;
    commitAuthorAvatar: string;
    commitDate: string;
}

export const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
})

const githubUrl = 'https://github.com/kshitij-Devda/First_Project'
export const getCommitsHashes = async(githubUrl: string): Promise<CommitData[]> => {
    const [owner, repo] = githubUrl.split('/').slice(-2)
    if(!owner || !repo){
        
        throw new Error("Invalid github url")
    }
    const {data} = await octokit.rest.repos.listCommits({
        owner ,
        repo
    })
    const sortedCommits = data.sort((a:any,b:any)=>new Date(b.commit.author.date).getTime() - new Date(a.commit.author.date).getTime()) as any[]
    return sortedCommits.slice(0,15).map((commit:any)=>({
        commitHash: commit.sha,
        commitMessage: commit.commit.message ?? "",
        commitAuthorName: commit.commit?.author?.name ?? "",
        commitAuthorAvatar: commit.author?.avatar_url ?? "",
        commitDate: commit.commit?.author?.date ?? ""
    }))
}

export const pollCommits = async(projectId : string) =>{
    try {
        if (!projectId) {
            console.error("Invalid projectId provided to pollCommits");
            return [];
        }
        
        const { githubUrl } = await fetchProjectGithubUrl(projectId);
        const commitHashes = await getCommitsHashes(githubUrl);
        const unprocessedCommits = await filterUnprocessedCommits(projectId, commitHashes)
        
        if (unprocessedCommits.length === 0) {
            console.log("No new commits to process");
            return [];
        }
        
        console.log(`Processing ${unprocessedCommits.length} new commits`);
        
        const summaryresponses = await Promise.allSettled(unprocessedCommits.map(commit=>{
            return summarizeCommits(githubUrl, commit.commitHash)
        }))

        const summaries = summaryresponses.map((response)=>{
            if(response.status === "fulfilled"){
                return response.value as string
            }
            return ""
        })
        
        const commits = await db.commit.createMany({
            data: summaries.map((summary, index) => {
                console.log(`Processing commit ${index}`);
                return {
                    projectId: projectId,
                    commitHash: unprocessedCommits[index]!.commitHash,
                    commitmessage: unprocessedCommits[index]!.commitMessage,
                    commitAuthorName: unprocessedCommits[index]!.commitAuthorName,
                    commitAuthorAvatar: unprocessedCommits[index]!.commitAuthorAvatar,
                    commitDate: new Date(unprocessedCommits[index]!.commitDate),
                    summary
                }
            })
        })
        
        console.log(`Successfully created ${commits.count} commits in database`);
        return unprocessedCommits;
    } catch (error) {
        console.error("Error in pollCommits:", error);
        return [];
    }
}

async function summarizeCommits(githuburl: string, commitHash: string) {
  const { data } = await axios.get(`${githuburl}/commit/${commitHash}.diff`, {
    headers: {
      Accept: 'application/vnd.github.v3.diff'
    }
  });
  return await aiSummariseCommit(data) || ""

}

async function fetchProjectGithubUrl(projectId: string) {
    try {
        const project = await db.project.findUnique({
            where: { id: projectId },
            select: {
                githubUrl: true
            }
        });
        
        if (!project?.githubUrl) {
            throw new Error("Project has no GitHub URL");
        }
        
        return { githubUrl: project.githubUrl };
    } catch (error) {
        console.error("Error fetching project GitHub URL:", error);
        throw error;
    }
}

async function filterUnprocessedCommits(projectId : string, commitHashes : CommitData[]){
    const processedCommits = await db.commit.findMany({
        where : {projectId}
    })
    const unprocessedCommits = commitHashes.filter((commit: CommitData)=> !processedCommits.some((processedCommit)=>processedCommit.commitHash === commit.commitHash))
    return unprocessedCommits;
}

// Remove or comment out the direct call with empty string
// pollCommits("")