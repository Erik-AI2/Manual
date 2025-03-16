import { StreamingTextResponse } from 'ai';

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  // Import Anthropic directly from the package
  const { Anthropic } = await import('@anthropic-ai/sdk');
  
  // Create a new Anthropic client
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  });
  
  // Convert messages to Anthropic format
  const anthropicMessages = messages.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));
  
  // Create a stream
  const stream = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    messages: anthropicMessages,
    system: "You are a helpful AI assistant",
    stream: true,
  });
  
  // Return a streaming response
  return new StreamingTextResponse(stream);
}
