"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="bg-gray-950 text-white overflow-hidden">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 pt-20 pb-20 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#25D366]/10 via-gray-950 to-gray-950 pointer-events-none" />
        <div className="absolute top-20 right-10 w-96 h-96 bg-[#25D366]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                Your WhatsApp.
                <br />
                <span className="text-[#25D366]">On Autopilot.</span>
              </h1>
              <p className="text-xl text-gray-400 leading-relaxed max-w-lg">
                AI handles your customer messages, orders and follow-ups 24/7 — so you never miss a sale.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/onboarding"
                className="px-8 py-4 bg-[#25D366] text-gray-950 font-bold rounded-lg hover:bg-[#20BD5A] transition-all duration-300 shadow-lg shadow-[#25D366]/20 hover:shadow-[#25D366]/40 text-center"
              >
                Start Free →
              </Link>
              <button
                onClick={() => {
                  document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-8 py-4 border-2 border-[#25D366] text-[#25D366] font-bold rounded-lg hover:bg-[#25D366]/10 transition-all duration-300"
              >
                See How It Works
              </button>
            </div>

            <div className="flex gap-8 pt-8 text-sm text-gray-400">
              <div>
                <div className="text-2xl font-bold text-[#25D366]">10K+</div>
                <div>Active Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#25D366]">50M+</div>
                <div>Messages Handled</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-[#25D366]">99.9%</div>
                <div>Uptime</div>
              </div>
            </div>
          </div>

          {/* Right Phone Mockup */}
          <div className="relative h-96 sm:h-[500px] lg:h-[600px] flex items-center justify-center">
            <div className="relative w-72 h-96 sm:w-80 sm:h-[500px] bg-gradient-to-b from-gray-800 to-gray-900 rounded-3xl shadow-2xl border border-gray-700 overflow-hidden">
              {/* Phone notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gray-950 rounded-b-2xl z-20" />

              {/* Chat content */}
              <div className="p-4 pt-8 h-full flex flex-col space-y-4 bg-gray-900">
                {/* Chat header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-700">
                  <div>
                    <h3 className="font-bold text-sm">AutoChat Support</h3>
                    <p className="text-xs text-gray-400">Online</p>
                  </div>
                  <div className="w-8 h-8 bg-[#25D366] rounded-full" />
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  <div className="flex justify-start">
                    <div className="bg-gray-700 rounded-lg rounded-tl-none px-3 py-2 max-w-xs text-xs">
                      Hi! How can I help?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-[#25D366] text-gray-950 rounded-lg rounded-tr-none px-3 py-2 max-w-xs text-xs font-medium">
                      What's your best product?
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-gray-700 rounded-lg rounded-tl-none px-3 py-2 max-w-xs text-xs">
                      Our Premium Package - 15,000 XAF
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-gray-700 rounded-lg rounded-tl-none px-3 py-2 max-w-xs text-xs">
                      Would you like to order?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-[#25D366] text-gray-950 rounded-lg rounded-tr-none px-3 py-2 max-w-xs text-xs font-medium">
                      Yes! Send details
                    </div>
                  </div>
                </div>

                {/* Input */}
                <div className="flex gap-2 pt-2 border-t border-gray-700">
                  <input
                    type="text"
                    placeholder="Message..."
                    className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-xs text-white placeholder-gray-500 outline-none"
                    disabled
                  />
                  <button className="bg-[#25D366] text-gray-950 rounded-full p-2 font-bold text-xs">
                    ➤
                  </button>
                </div>
              </div>
            </div>

            {/* Glow effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#25D366]/20 to-transparent rounded-3xl blur-2xl -z-10" />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-400">Get up and running in 3 simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                number: "1",
                title: "Connect Your WhatsApp Number",
                description: "Link your WhatsApp Business account in seconds. We handle all the technical setup.",
              },
              {
                number: "2",
                title: "Add Your Products & Business Info",
                description: "Upload your product catalog and set your business preferences, language, and tone.",
              },
              {
                number: "3",
                title: "AI Replies Automatically",
                description: "Our AI instantly responds to customer messages, takes orders, and handles follow-ups.",
              },
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#25D366] to-[#20BD5A] flex items-center justify-center text-4xl font-bold text-gray-950 shadow-lg shadow-[#25D366]/30">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-bold">{step.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{step.description}</p>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-10 -right-4 w-8 h-0.5 bg-gradient-to-r from-[#25D366] to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#25D366]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-400">Everything you need to automate your WhatsApp business</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { title: "24/7 Auto-replies", icon: "🤖" },
              { title: "Smart Order Taking", icon: "📦" },
              { title: "Product Catalog", icon: "🛍️" },
              { title: "MTN/Orange Money", icon: "💰" },
              { title: "Human Takeover", icon: "👤" },
              { title: "Conversation Dashboard", icon: "📊" },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 hover:border-[#25D366]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#25D366]/10"
              >
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold">{feature.title}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-gray-400">Choose the plan that fits your business</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "Starter",
                price: "5,000",
                popular: false,
                features: [
                  "1 WhatsApp number",
                  "Auto-replies and FAQs",
                  "Up to 500 messages/month",
                ],
              },
              {
                name: "Growth",
                price: "15,000",
                popular: true,
                features: [
                  "Everything in Starter",
                  "Order taking and tracking",
                  "Unlimited messages",
                  "Product catalog",
                ],
              },
              {
                name: "Pro",
                price: "35,000",
                popular: false,
                features: [
                  "Everything in Growth",
                  "Priority support",
                  "Custom AI personality",
                  "Advanced analytics",
                ],
              },
            ].map((plan, idx) => (
              <div
                key={idx}
                className={`relative rounded-2xl p-8 transition-all duration-300 ${
                  plan.popular
                    ? "bg-gradient-to-br from-[#25D366]/20 to-gray-900 border-2 border-[#25D366] shadow-lg shadow-[#25D366]/20 transform scale-105"
                    : "bg-gray-800 border border-gray-700 hover:border-gray-600"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#25D366] text-gray-950 px-4 py-1 rounded-full text-sm font-bold">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#25D366]">{plan.price}</span>
                  <span className="text-gray-400 ml-2">XAF/month</span>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3 text-gray-300">
                      <span className="text-[#25D366]">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/onboarding"
                  className={`block w-full py-3 rounded-lg font-bold text-center transition-all duration-300 ${
                    plan.popular
                      ? "bg-[#25D366] text-gray-950 hover:bg-[#20BD5A]"
                      : "bg-gray-700 text-white hover:bg-gray-600"
                  }`}
                >
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-center sm:text-left">
            <h3 className="text-xl font-bold text-[#25D366]">AutoChat</h3>
            <p className="text-gray-400 text-sm mt-1">Built for African businesses</p>
          </div>
          <div className="text-center text-gray-400 text-sm">
            <p>
              Contact:{" "}
              <a href="mailto:hello@autochat.ai" className="text-[#25D366] hover:underline">
                hello@autochat.ai
              </a>
            </p>
          </div>
          <div className="text-gray-400 text-sm">
            © 2026 AutoChat. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
