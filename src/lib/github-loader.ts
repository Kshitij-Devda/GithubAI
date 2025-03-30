import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { Document } from "@langchain/core/documents";
import { summariseCode, generateEmbeddings as getEmbedding } from "./gemini";
import { db } from "@/server/db";

export const loadGithubRepo = async (githubrl : string, githubToken :string)=>{
    const loader = new GithubRepoLoader(githubrl, {
        accessToken: githubToken || '',
        branch: 'main',
        ignoreFiles: ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'],
        recursive: true,
        unknown: 'warn',
        maxConcurrency: 5,
    })
    const docs = await loader.load()
    return docs
}

export const indexGithubRepo = async (project: string, githubUrl: string, githubToken?: string) => {
    const docs = await loadGithubRepo(githubUrl, githubToken || '');
    const allEmbeddings = await processDocsWithEmbeddings(docs)

    await Promise.allSettled(allEmbeddings.map(async (embedding, index) => {
        console.log(`processing ${index} of ${allEmbeddings.length}`)
        if(!embedding) return

        const sourceCodeEmbedding = await db.sourceCodeEmbedding.create({
            data: {
                summary: embedding.summary,
                sourceCode: embedding.sourceCode,
                fileName: embedding.fileName,
                projectId: project,
            }
        })
        await db.$executeRaw
        `UPDATE SourceCodeEmbedding SET summaryEmbedding = ${embedding.embedding}::vector
            WHERE id = ${sourceCodeEmbedding.id}
        `
    }))
}

const processDocsWithEmbeddings = async (docs: Document[]): Promise<Array<{summary: string, embedding: number[], sourceCode: string, fileName: string}>> => {
    return await Promise.all(docs.map(async doc => {
        const summary = await summariseCode(doc);
        const embedding = await getEmbedding(summary);
        return {
            summary,
            embedding,
            sourceCode: JSON.parse(JSON.stringify(doc.pageContent)),
            fileName: doc.metadata.source
        }
    }))
}

// ... existing code ...

// ... existing code ...