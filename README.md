# AutoChat — WhatsApp AI Automation SaaS

AutoChat is a powerful WhatsApp Business automation platform that uses AI to handle customer messages, take orders, and manage conversations 24/7. Built for African businesses, it supports multiple languages and payment methods.

## Features

- **24/7 AI Responses** — Claude AI automatically replies to customer messages
- **Smart Order Taking** — Collect product orders with delivery addresses and payment tracking
- **Product Catalog** — Manage your products with pricing, stock, and descriptions
- **Multi-language Support** — French, English, or Bilingual responses
- **Working Hours** — Set business hours with automatic out-of-hours messages
- **Conversation Dashboard** — View and manage all customer conversations
- **Human Takeover** — Escalate conversations to human agents anytime
- **Payment Integration** — MTN MoMo and Orange Money payment guidance

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- OpenRouter API key
- Meta WhatsApp Business account
- Vercel account (for deployment)

### Local Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd autochat
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   Fill in all values in `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL` — Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anon key
   - `OPENROUTER_API_KEY` — Your OpenRouter API key
   - `OPENROUTER_MODEL` — Claude model (default: anthropic/claude-sonnet-4-5)
   - `WHATSAPP_TOKEN` — Your WhatsApp Business API token
   - `WHATSAPP_PHONE_NUMBER_ID` — Your WhatsApp phone number ID
   - `WHATSAPP_VERIFY_TOKEN` — A random string for webhook verification
   - `NEXT_PUBLIC_APP_URL` — Your app URL (http://localhost:3000 for local)

4. **Set up Supabase**
   - Create a new Supabase project
   - Run the SQL schema in your Supabase SQL editor (see `schema.sql`)
   - This creates tables: `clients`, `products`, `conversations`, `orders`

5. **Run locally**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Deployment

### Deploy to Vercel

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Deploy with Vercel**
   ```bash
   vercel --prod
   ```
   Or connect your GitHub repo to Vercel dashboard for auto-deployments

3. **Set environment variables in Vercel**
   - Go to Project Settings → Environment Variables
   - Add all variables from `.env.local.example`

4. **Configure WhatsApp Webhook**
   - Go to Meta Developer Portal → Your App → WhatsApp → Configuration
   - Set Webhook URL to: `https://yourapp.vercel.app/api/webhook`
   - Set Verify Token to match your `WHATSAPP_VERIFY_TOKEN`
   - Subscribe to `messages` webhook field

## Database Schema

The app uses 4 main tables:

### clients
- `id` (uuid, primary key)
- `email` (text)
- `business_name` (text)
- `phone_number` (text) — WhatsApp phone number ID
- `language` (text) — French, English, or Bilingual
- `tone` (text) — Friendly, Formal, or Local/Pidgin
- `working_hours_start` (time)
- `working_hours_end` (time)
- `out_of_hours_message` (text)
- `is_bot_active` (boolean)
- `location` (text)
- `business_description` (text)
- `created_at` (timestamp)

### products
- `id` (uuid, primary key)
- `client_id` (uuid, foreign key)
- `name` (text)
- `price` (numeric)
- `description` (text)
- `stock` (integer)
- `available` (boolean)

### conversations
- `id` (uuid, primary key)
- `client_id` (uuid, foreign key)
- `customer_phone` (text)
- `messages` (jsonb) — Array of {role, content, timestamp}
- `status` (text) — active, escalated, resolved
- `created_at` (timestamp)
- `updated_at` (timestamp)

### orders
- `id` (uuid, primary key)
- `client_id` (uuid, foreign key)
- `customer_phone` (text)
- `items` (jsonb) — Array of {product_name, quantity, price}
- `total` (numeric)
- `status` (text) — pending, confirmed, delivered, cancelled
- `delivery_address` (text)
- `created_at` (timestamp)

## API Routes

### POST /api/webhook
Receives incoming WhatsApp messages from Meta. Verifies webhook, processes messages, generates AI responses, and sends replies.

### POST /api/claude
Generates AI responses using OpenRouter Claude API. Takes client context, products, and conversation history into account.

### POST /api/send-message
Sends WhatsApp messages via Meta Cloud API.

## Tech Stack

- **Framework** — Next.js 14 (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS
- **Database** — Supabase (PostgreSQL)
- **AI** — OpenRouter (Claude)
- **WhatsApp API** — Meta Cloud API
- **Hosting** — Vercel

## Project Structure

```
autochat/
├── app/
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles
│   ├── dashboard/
│   │   └── page.tsx          # Dashboard with 5 tabs
│   ├── onboarding/
│   │   └── page.tsx          # 4-step onboarding form
│   └── api/
│       ├── webhook/route.ts  # WhatsApp webhook
│       ├── claude/route.ts   # AI response generation
│       └── send-message/route.ts
├── lib/
│   ├── supabase.ts           # Supabase client
│   ├── claude.ts             # Claude integration (deprecated)
│   └── whatsapp.ts           # WhatsApp API wrapper
├── types/
│   └── index.ts              # TypeScript interfaces
├── components/
│   └── ui/                   # UI components (placeholder)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
├── vercel.json
└── .env.local.example
```

## Environment Variables

See `.env.local.example` for all required variables.

**Important:** Never commit `.env.local` to version control. Use `.env.local.example` as a template.

## Troubleshooting

### Webhook not receiving messages
- Verify webhook URL is correct in Meta Developer Portal
- Check that `WHATSAPP_VERIFY_TOKEN` matches in both code and Meta settings
- Ensure Supabase tables are created with correct schema

### AI responses not generating
- Verify `OPENROUTER_API_KEY` is valid
- Check that `OPENROUTER_MODEL` is a valid Claude model
- Ensure client and products exist in Supabase

### Messages not sending
- Verify `WHATSAPP_TOKEN` is valid
- Check that `WHATSAPP_PHONE_NUMBER_ID` is correct
- Ensure recipient phone number is in correct format

## Support

For issues or questions, contact: hello@autochat.ai

## License

Built for African businesses. © 2026 AutoChat.
