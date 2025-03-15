import { openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText } from "ai";

export const runtime = "edge";

export async function POST(req: Request) {
  const { messages } = await req.json();
  const result = await streamText({
    model: openai("gpt-4o"),
    messages: convertToCoreMessages(messages),
    system: "You are an Offer AI Assistant specialized in helping users create effective offers based on Alex Hormozi's framework. Your goal is to assist with offer ideation, structure, pricing, and delivery methods. Provide actionable advice that helps users create high-value, irresistible offers. Draw from offer creation best practices and the principles of value creation, pricing psychology, and urgency/scarcity when appropriate.",
  });

  return result.toDataStreamResponse({
    getErrorMessage: (error) => {
      if (error instanceof Error) {
        return error.message;
      }
      return String(error);
    }
  });
}
