import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: NextRequest) {
  try {
    // Authenticate the user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if AssemblyAI API key is configured
    const apiKey = process.env.ASSEMBLYAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'AssemblyAI API key is not configured',
          configured: false
        }, 
        { status: 200 }
      );
    }
    
    if (apiKey === 'your_api_key_here') {
      return NextResponse.json(
        { 
          success: false, 
          message: 'AssemblyAI API key is using the default placeholder value',
          configured: false
        }, 
        { status: 200 }
      );
    }
    
    // API key is configured
    return NextResponse.json(
      { 
        success: true, 
        message: 'AssemblyAI API key is configured',
        configured: true
      }, 
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Error checking API key:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Error checking API key configuration',
        error: error instanceof Error ? error.message : String(error),
        configured: false
      }, 
      { status: 500 }
    );
  }
} 