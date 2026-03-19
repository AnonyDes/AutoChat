import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import supabase from "@/lib/supabase";
import type { Message, Client, Product } from "@/types";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-3.5-sonnet";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export async function POST(request: NextRequest) {
  try {
    const { clientId, customerPhone, message, conversationHistory } = await request.json();

    if (!message || !clientId) {
      return NextResponse.json(
        { reply: "Sorry, I'm having trouble right now. Please try again shortly." }
      );
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      console.error("Client not found:", clientError);
      return NextResponse.json(
        { reply: "Sorry, I'm having trouble right now. Please try again shortly." }
      );
    }

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("client_id", clientId)
      .eq("available", true);

    if (productsError) {
      console.error("Products fetch error:", productsError);
    }

    const formattedProducts = (products || [])
      .map(
        (p: Product) =>
          `- ${p.name}: ${p.price} XAF — ${p.description} (Stock: ${p.stock})`
      )
      .join("\n");

    const formattedHistory = (conversationHistory || [])
      .map(
        (m: Message) =>
          `${m.role === "customer" ? "Customer" : "Agent"}: ${m.content}`
      )
      .join("\n");

    const systemPrompt = `You are the AI sales assistant for ${client.business_name}.

BUSINESS:
- Name: ${client.business_name}
- Description: ${client.business_description}
- Location: ${client.location}

LANGUAGE: Always reply in ${client.language}.
TONE: Be ${client.tone}.

PRODUCTS:
${formattedProducts || "No products available at the moment."}

RULES:
1. Help customers find and buy products
2. Always mention the price when discussing a product
3. If a product has stock 0, say it is currently unavailable
4. To place an order, collect: product name, quantity, delivery address
5. For payment say: 'Please send [total] XAF to MTN MoMo: XXXXXXXXXX then send your payment screenshot'
6. If you cannot answer, say 'Let me check and get back to you' then on a new line write: ESCALATE: true
7. Keep all replies under 3 sentences
8. Never reveal you are an AI unless directly asked

CONVERSATION HISTORY:
${formattedHistory || "No previous conversation."}

CUSTOMER MESSAGE:
${message}

Reply naturally. If placing an order, end your reply with:
ORDER: {"items": [], "total": 0, "address": ""}
If escalating, end with:
ESCALATE: true`;

    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: OPENROUTER_MODEL,
        messages: [{ role: "user", content: systemPrompt }],
        max_tokens: 500,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": APP_URL,
          "X-Title": "AutoChat",
        },
      }
    );

    let reply = response.data.choices[0].message.content;

    if (reply.includes("ORDER:")) {
      try {
        const orderMatch = reply.match(/ORDER:\s*(\{[\s\S]*\})/);
        if (orderMatch) {
          const orderData = JSON.parse(orderMatch[1]);

          const { error: orderError } = await supabase.from("orders").insert({
            client_id: clientId,
            customer_phone: customerPhone,
            items: orderData.items,
            total: orderData.total,
            delivery_address: orderData.address,
            status: "pending",
          });

          if (orderError) {
            console.error("Order insert error:", orderError);
          } else {
            for (const item of orderData.items) {
              const product = products?.find(
                (p: Product) => p.name.toLowerCase() === item.product_name.toLowerCase()
              );
              if (product) {
                await supabase
                  .from("products")
                  .update({ stock: product.stock - item.quantity })
                  .eq("id", product.id);
              }
            }
          }
        }
      } catch (orderParseError) {
        console.error("Order parsing error:", orderParseError);
      }

      reply = reply.replace(/ORDER:\s*\{[\s\S]*\}/, "").trim();
    }

    if (reply.includes("ESCALATE: true")) {
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("client_id", clientId)
        .eq("customer_phone", customerPhone)
        .eq("status", "active")
        .single();

      if (conversation) {
        await supabase
          .from("conversations")
          .update({ status: "escalated" })
          .eq("id", conversation.id);
      }

      reply = reply.replace(/ESCALATE:\s*true/gi, "").trim();
    }

    return NextResponse.json({ response: reply });
  } catch (error) {
    console.error("Claude API error:", error);
    return NextResponse.json({
      reply: "Sorry, I'm having trouble right now. Please try again shortly.",
    });
  }
}
