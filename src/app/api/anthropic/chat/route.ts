import { NextResponse } from 'next/server';

export const runtime = "edge";

export async function POST(req: Request) {
  return NextResponse.json({
    message: "Anthropic API is currently unavailable. Please use the OpenAI endpoint instead."
  });
}
