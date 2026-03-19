from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
import os

load_dotenv(Path(__file__).parent / '.env')

from emergentintegrations.llm.chat import LlmChat, UserMessage

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")


@app.get("/api/health")
async def health():
    return {"status": "ok"}


@app.post("/api/chat")
async def chat_endpoint(request: Request):
    try:
        body = await request.json()
        client_id = body.get("clientId", "")
        customer_phone = body.get("customerPhone", "")
        message = body.get("message", "")
        conversation_history = body.get("conversationHistory", [])
        client_info = body.get("clientInfo", {})
        products_info = body.get("productsInfo", "")

        if not message:
            return {"response": "Sorry, I didn't receive your message. Please try again."}

        business_name = client_info.get("business_name", "AutoChat Business")
        business_desc = client_info.get("business_description", "")
        location = client_info.get("location", "")
        language = client_info.get("language", "French")
        tone = client_info.get("tone", "Friendly")

        system_prompt = f"""You are the AI sales assistant for {business_name}.

BUSINESS:
- Name: {business_name}
- Description: {business_desc}
- Location: {location}

LANGUAGE: Always reply in {language}.
TONE: Be {tone}.

PRODUCTS:
{products_info or "No products available at the moment."}

RULES:
1. Help customers find and buy products
2. Always mention the price when discussing a product
3. If a product has stock 0, say it is currently unavailable
4. To place an order, collect: product name, quantity, delivery address
5. For payment say: 'Please send [total] XAF to MTN MoMo: XXXXXXXXXX then send your payment screenshot'
6. If you cannot answer, say 'Let me check and get back to you' then on a new line write: ESCALATE: true
7. Keep all replies under 3 sentences
8. Never reveal you are an AI unless directly asked"""

        formatted_history = ""
        for msg in conversation_history:
            role_label = "Customer" if msg.get("role") == "customer" else "Agent"
            formatted_history += f"{role_label}: {msg.get('content', '')}\n"

        user_text = f"CONVERSATION HISTORY:\n{formatted_history}\n\nCUSTOMER MESSAGE:\n{message}\n\nReply naturally."

        session_id = f"autochat-{client_id}-{customer_phone}"

        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=system_prompt,
        )
        chat.with_model("anthropic", "claude-sonnet-4-5-20250929")

        user_message = UserMessage(text=user_text)
        response_text = await chat.send_message(user_message)

        # Clean up response
        clean_response = response_text
        if "ESCALATE: true" in clean_response:
            clean_response = clean_response.replace("ESCALATE: true", "").strip()
        if "ORDER:" in clean_response:
            import re
            clean_response = re.sub(r'ORDER:\s*\{.*?\}', '', clean_response, flags=re.DOTALL).strip()

        return {
            "response": clean_response,
            "escalated": "ESCALATE: true" in response_text,
            "raw_response": response_text,
        }
    except Exception as e:
        print(f"Chat API error: {e}")
        return {"response": "Sorry, I'm having trouble right now. Please try again shortly."}
