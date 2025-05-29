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
if (!Array.isArray(queryvector)) {
    throw new Error("Failed to generate embeddings - not an array");
}

// For debugging
console.log("Generated embeddings of length:", queryvector.length);

try {
    // First get all embeddings for the project
    const result = await db.$queryRaw`
    SELECT "id", "fileName", "sourceCode", "summary", "summaryEmbedding"
    FROM "SourceCodeEmbedding"
    WHERE "projectId" = ${projectId}
    ` as {
        id: string
        fileName: string
        sourceCode: string
        summary: string
        summaryEmbedding: string | null
    }[]

    // Calculate similarity manually for each result (simplified version)
    const resultsWithSimilarity = result
        .map(item => {
            let similarity = 0;
            if (item.summaryEmbedding) {
                try {
                    const embeddings = JSON.parse(item.summaryEmbedding);
                    // Simple dot product similarity (not as good as cosine but works for demo)
                    similarity = calculateSimilarity(queryvector, embeddings);
                } catch (e) {
                    console.error("Error parsing embeddings:", e);
                }
            }
            return { ...item, similarity };
        })
        .sort((a, b) => b.similarity - a.similarity) // Sort by similarity desc
        .slice(0, 10); // Take top 10

    let context = ''

    for (const docs of resultsWithSimilarity) {
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
        output: stream.value,
        fileReference: resultsWithSimilarity.map(({ id, summaryEmbedding, ...rest }) => rest) // Remove embeddings from response
    }
} catch (error) {
    console.error("Error fetching context:", error);
    throw error;
}
}

// Simple dot product similarity function
function calculateSimilarity(vec1: number[], vec2: number[]): number {
    // Validate inputs
    if (!vec1 || !vec2 || vec1.length !== vec2.length) return 0;
    
    let dotProduct = 0;
    const length = Math.min(vec1.length, vec2.length);
    
    for (let i = 0; i < length; i++) {
        // Using nullish coalescing to handle undefined values
        const v1 = vec1[i] ?? 0;
        const v2 = vec2[i] ?? 0;
        dotProduct += v1 * v2;
    }
    
    return dotProduct;
}
