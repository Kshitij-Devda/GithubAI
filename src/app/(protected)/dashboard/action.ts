'use server'
import { streamText } from 'ai'
import { createStreamableValue } from 'ai/rsc'
import {createGoogleGenerativeAI} from '@ai-sdk/google'
import { generateEmbeddings } from '@/lib/gemini'
import { db } from '@/server/db'



const goole =createGoogleGenerativeAI({
    apiKey : process.env.GOOGLE_API_KEY,

})

export async function askQuestion(question: string, projectId: string) {
const stream = createStreamableValue()


const queryvector = await generateEmbeddings(question)
const vectorQuery = `[${queryvector},join(',')]`

const result = await db.$queryRaw`
SELECT "fileName", "sourceCode", "summary"
1 - ("summaryEmbedding" <=> ${vectorQuery}) :: vector AS similarity
FROM "SourceCodeEmbedding"
WHERE 1 - ("summaryEmbedding" <=> ${vectorQuery}) :: vector > .5
AND "projectId" = ${projectId}
ORDER BY similarity DESC
LIMIT 10
` as {
    fileName: string
    sourceCode: string
    summary: string
    similarity: number
    }[]

    let context = ''

    for (const docs of result) {
        context += `
        source: ${docs.fileName}\ncode 
        content: ${docs.sourceCode}\n
        summary of file: ${docs.summary}\n\n
        `
    }
    (async () => {
        const { textStream } = await streamText({
            model: goole('gemini-1.5-pro'),
            prompt: `
            You are a helpful assistant that helps developers understand their codebase.
            Answer the following question based on the context provided:
            

            Context:
            ${context}

            Question: ${question}
            
            
            
            Provide a detailed and accurate response based on the context.`,
        });
        
        for await (const delta of textStream) {
            stream.update(delta)
        }

        stream.done()
        
    })()

    return {
        output :stream.value,
        fileReference: result
    }
}
