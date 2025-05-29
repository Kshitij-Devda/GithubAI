import { AssemblyAI } from 'assemblyai'
const client = new AssemblyAI({apiKey: process.env.ASSEMBLYAI_API_KEY || ''})

// Convert milliseconds to a formatted time string (MM:SS)
function msToTime(ms: number) {
    // Convert ms to seconds
    const totalSeconds = Math.floor(ms / 1000)
    // Calculate minutes and remaining seconds
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    // Format as MM:SS with leading zeros
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Check if a URL is a data URL
function isDataUrl(url: string): boolean {
    return url.startsWith('data:');
}

// Generate a dummy transcript for testing when API key is missing
function generateDummyTranscript(url: string) {
    // Extract filename from URL if possible, or use a placeholder
    let filename = "audio-file";
    if (!isDataUrl(url)) {
        const urlParts = url.split('/');
        if (urlParts.length > 0) {
            const lastPart = urlParts[urlParts.length - 1];
            if (lastPart) {
                filename = lastPart;
            }
        }
    }
    
    return {
        summaries: [
            {
                start: "00:00",
                end: "01:30",
                gist: "Introduction",
                headline: "Meeting starts with introductions",
                summary: `This is a test transcript for ${filename}. The real transcript will appear when you add a valid AssemblyAI API key.`
            },
            {
                start: "01:30",
                end: "03:45",
                gist: "Project Overview",
                headline: "Discussion of project goals",
                summary: "Project goals were discussed including timelines and resources. The team agreed on next steps."
            },
            {
                start: "03:45",
                end: "05:20",
                gist: "Action Items",
                headline: "Team assigned action items",
                summary: "Various tasks were assigned to team members with deadlines for the next meeting."
            }
        ]
    };
}

export const processMeeting = async (meetingUrl: string) => {
    try {
        // Log the URL we're processing (first 30 chars only to avoid logging large data URLs)
        console.log("Processing meeting URL (first 30 chars):", meetingUrl.substring(0, 30))
        
        // Check for API key
        if (!process.env.ASSEMBLYAI_API_KEY) {
            console.error("Missing AssemblyAI API key - please add ASSEMBLYAI_API_KEY to your .env file")
            
            // Return dummy transcript data for testing
            console.log("Returning dummy transcript data for testing");
            return generateDummyTranscript(meetingUrl);
        }
        
        if (process.env.ASSEMBLYAI_API_KEY === 'your_api_key_here') {
            console.error("Invalid AssemblyAI API key - you need to replace the placeholder with your actual API key")
            return {
                summaries: [{
                    start: "00:00",
                    end: "00:30",
                    gist: "API Key Error",
                    headline: "Invalid AssemblyAI API Key",
                    summary: "You need to replace 'your_api_key_here' with your actual AssemblyAI API key in the .env file."
                }]
            }
        }
        
        // Call the AssemblyAI API to transcribe the audio
        console.log("Calling AssemblyAI API...")
        
        let transcript;
        
        // AssemblyAI can handle data URLs directly
        transcript = await client.transcripts.transcribe({
            audio: meetingUrl,
            auto_chapters: true,
        });
        
        console.log("Transcript response received:", 
            JSON.stringify({
                status: transcript.status,
                hasText: Boolean(transcript.text),
                textLength: transcript.text?.length || 0,
                chaptersCount: transcript.chapters?.length || 0
            })
        )
        
        // Check if we have any chapters
        if (!transcript.chapters || transcript.chapters.length === 0) {
            console.log("No chapters found in transcript, using full text as fallback")
            // Create a default summary with proper time estimate
            const textLength = transcript.text?.length || 0;
            const approximateMinutes = Math.max(1, Math.round(textLength / 150)); // Rough estimate: 150 chars per minute
            
            return {
                summaries: [{
                    start: "00:00",
                    end: `${approximateMinutes.toString().padStart(2, '0')}:00`,
                    gist: "Full Transcript",
                    headline: "Meeting Transcript",
                    summary: transcript.text || "No transcript text available"
                }]
            }
        }
        
        // Map the chapters to our summary format
        const summaries = transcript.chapters.map(chapter => ({
            start: msToTime(chapter.start),
            end: msToTime(chapter.end),
            gist: chapter.gist || "Discussion Point",
            headline: chapter.headline || "Discussion Point",
            summary: chapter.summary || "No summary available",
        }))
        
        console.log(`Successfully processed ${summaries.length} summary points`)
        
        // Return the summaries
        return { summaries }
    } catch (error) {
        // Log the error
        console.error("Error in processMeeting:", error)
        // Return an error summary instead of throwing to prevent process failure
        return {
            summaries: [{
                start: "00:00",
                end: "01:00",
                gist: "Processing Error",
                headline: "Error Processing Meeting",
                summary: `There was an error processing the meeting: ${error instanceof Error ? error.message : String(error)}`
            }]
        }
    }
}





