import axios from "axios";
import type { ChatMessage } from "@/types";

const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY!;
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

export async function getChatCompletion(
  message: string,
  conversationHistory: ChatMessage[] = []
): Promise<string> {
  const messages = [
    ...conversationHistory.map((msg) => ({
      role: msg.role,
      content: msg.content,
    })),
    { role: "user" as const, content: message },
  ];

  const response = await axios.post(
    CLAUDE_API_URL,
    {
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system:
        "You are AutoChat, a helpful WhatsApp Business assistant. Be concise and professional.",
      messages,
    },
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
      },
    }
  );

  return response.data.content[0].text;
}
