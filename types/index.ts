export interface Client {
  id: string;
  email: string;
  business_name: string;
  phone_number: string;
  language: "French" | "English" | "Bilingual";
  tone: "Friendly" | "Formal" | "Local/Pidgin";
  working_hours_start: string;
  working_hours_end: string;
  out_of_hours_message: string;
  is_bot_active: boolean;
  location: string;
  business_description: string;
  created_at: string;
}

export interface Product {
  id: string;
  client_id: string;
  name: string;
  price: number;
  description: string;
  stock: number;
  available: boolean;
}

export interface Message {
  role: "customer" | "agent";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  client_id: string;
  customer_phone: string;
  messages: Message[];
  status: "active" | "escalated" | "resolved";
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  client_id: string;
  customer_phone: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "confirmed" | "delivered" | "cancelled";
  delivery_address: string;
  created_at: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  timestamp: string;
  type: string;
  text?: {
    body: string;
  };
}

export interface WhatsAppWebhookEntry {
  id: string;
  changes: {
    value: {
      messaging_product: string;
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: { profile: { name: string }; wa_id: string }[];
      messages?: WhatsAppMessage[];
    };
    field: string;
  }[];
}
