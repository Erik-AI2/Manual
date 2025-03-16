import { NextResponse } from 'next/server';

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Simple placeholder response
    return NextResponse.json({
      message: "This is a placeholder response from the Anthropic API route. The actual Anthropic integration will be implemented soon.",
      receivedMessages: messages
    });
  } catch (error) {
    console.error('Error in Anthropic chat API:', error);
    return NextResponse.json(
      { error: 'An error occurred during the API call' },
      { status: 500 }
    );
  }
}
