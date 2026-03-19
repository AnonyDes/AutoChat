import { NextRequest, NextResponse } from "next/server";
import { sendWhatsAppMessage } from "@/lib/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const { to, message, phoneNumberId } = await request.json();

    if (!to || !message || !phoneNumberId) {
      return NextResponse.json(
        { error: "Recipient, message, and phoneNumberId are required" },
        { status: 400 }
      );
    }

    const result = await sendWhatsAppMessage(to, message, phoneNumberId);

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
