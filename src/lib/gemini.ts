import { GoogleGenerativeAI } from "@google/generative-ai";
import { Document } from "@langchain/core/documents";

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAi.getGenerativeModel({
    model: 'gemini-1.5-flash',
})

export const aiSummariseCommit = async (diff: string) => {
    //https://github.com/kshitij-Devda/First_Project/commit/<commithash>.diff
const response = await model.generateContent([
    `
    Summarise the following git diff:
    ${diff}
    `
])
return response.response.text()
}

export const summariseCode = async (docs: Document): Promise<string> => {
    console.log("getting summary for",docs.metadata)

    try{

        const code = docs.pageContent.slice(0, 10000)
        const response = await model.generateContent([
            `
            Summarise the following code:
            ${docs.metadata.source }
            ${code}
            `
        ]);
        return response.response.text()
    }catch(error){
        return ''
    }

   
}

export const generateEmbeddings = async (summary: string): Promise<number[]> => {
    const model = genAi.getGenerativeModel({
        model:"text-embedding-004",
    })
    const result = await model.embedContent(summary)
    const embedding = result.embedding
    return embedding.values
}