import { NextRequest, NextResponse } from "next/server";
import supabase from "@/lib/supabase";
import { sendWhatsAppMessage } from "@/lib/whatsapp";
import type { Conversation, Message } from "@/types";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const phoneNumberId = body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id;
    const messages = body?.entry?.[0]?.changes?.[0]?.value?.messages;
    const senderPhone = messages?.[0]?.from;
    const messageText = messages?.[0]?.text?.body;

    if (!messages || !messages.length) {
      return new NextResponse("OK", { status: 200 });
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("phone_number", phoneNumberId)
      .limit(1)
      .single();

    if (clientError || !client) {
      console.log("No client found for phone number:", phoneNumberId);
      return new NextResponse("OK", { status: 200 });
    }

    if (!client.is_bot_active) {
      console.log("Bot is inactive for client:", client.id);
      return new NextResponse("OK", { status: 200 });
    }

    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);

    if (
      currentTime < client.working_hours_start ||
      currentTime > client.working_hours_end
    ) {
      await sendWhatsAppMessage(
        senderPhone,
        client.out_of_hours_message,
        phoneNumberId
      );
      return new NextResponse("OK", { status: 200 });
    }

    const { data: existingConversation, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("client_id", client.id)
      .eq("customer_phone", senderPhone)
      .eq("status", "active")
      .limit(1)
      .single();

    let conversation: Conversation;

    if (convError || !existingConversation) {
      const { data: newConversation, error: insertError } = await supabase
        .from("conversations")
        .insert({
          client_id: client.id,
          customer_phone: senderPhone,
          messages: [],
          status: "active",
        })
        .select()
        .single();

      if (insertError || !newConversation) {
        console.error("Failed to create conversation:", insertError);
        return new NextResponse("OK", { status: 200 });
      }

      conversation = newConversation;
    } else {
      conversation = existingConversation;
    }

    const customerMessage: Message = {
      role: "customer",
      content: messageText,
      timestamp: now.toISOString(),
    };

    const updatedMessages = [...(conversation.messages || []), customerMessage];

    const claudeResponse = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/claude`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: client.id,
          customerPhone: senderPhone,
          message: messageText,
          conversationHistory: conversation.messages || [],
        }),
      }
    );

    if (!claudeResponse.ok) {
      console.error("Claude API failed:", await claudeResponse.text());
      return new NextResponse("OK", { status: 200 });
    }

    const { response: aiReply } = await claudeResponse.json();

    const agentMessage: Message = {
      role: "agent",
      content: aiReply,
      timestamp: new Date().toISOString(),
    };

    const finalMessages = [...updatedMessages, agentMessage];

    const { error: updateError } = await supabase
      .from("conversations")
      .update({
        messages: finalMessages,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversation.id);

    if (updateError) {
      console.error("Failed to update conversation:", updateError);
    }

    await sendWhatsAppMessage(senderPhone, aiReply, phoneNumberId);

    return new NextResponse("OK", { status: 200 });
  } catch (error) {
    console.error("Webhook error:", error);
    return new NextResponse("OK", { status: 200 });
  }
}
