import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MessageCircle, Zap, ShoppingBag, BarChart3, Users, Shield,
  ArrowRight, Check, ChevronDown, Menu, X
} from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" } }),
};

const stagger = { visible: { transition: { staggerChildren: 0.1 } } };

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-[#09090b]/80 backdrop-blur-xl border-b border-zinc-800/50" : "bg-transparent"
      }`}
      data-testid="navbar"
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2" data-testid="nav-logo">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <MessageCircle size={18} className="text-black" />
          </div>
          <span className="text-lg font-bold text-white">AutoChat</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors" data-testid="nav-features">Features</a>
          <a href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors" data-testid="nav-how-it-works">How It Works</a>
          <a href="#pricing" className="text-sm text-zinc-400 hover:text-white transition-colors" data-testid="nav-pricing">Pricing</a>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <Link to="/login" className="text-sm text-zinc-400 hover:text-white px-4 py-2 transition-colors" data-testid="nav-login-btn">Log in</Link>
          <Link
            to="/onboarding"
            className="text-sm font-semibold bg-primary text-black px-5 py-2 rounded-full hover:bg-primary-600 transition-all shadow-[0_0_20px_-5px_rgba(37,211,102,0.4)]"
            data-testid="nav-cta-btn"
          >
            Start Free
          </Link>
        </div>

        <button className="md:hidden text-zinc-400" onClick={() => setMobileOpen(!mobileOpen)} data-testid="nav-mobile-toggle">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-zinc-900/95 backdrop-blur-xl border-b border-zinc-800 px-6 py-4 space-y-3">
          <a href="#features" className="block text-sm text-zinc-300 py-2" onClick={() => setMobileOpen(false)}>Features</a>
          <a href="#how-it-works" className="block text-sm text-zinc-300 py-2" onClick={() => setMobileOpen(false)}>How It Works</a>
          <a href="#pricing" className="block text-sm text-zinc-300 py-2" onClick={() => setMobileOpen(false)}>Pricing</a>
          <div className="pt-2 flex flex-col gap-2">
            <Link to="/login" className="text-sm text-zinc-300 py-2" data-testid="nav-mobile-login">Log in</Link>
            <Link to="/onboarding" className="text-sm font-semibold bg-primary text-black px-5 py-2.5 rounded-full text-center" data-testid="nav-mobile-cta">Start Free</Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
}

function PhoneMockup() {
  return (
    <div className="relative animate-float">
      <div className="relative w-[280px] h-[560px] bg-zinc-900 rounded-[3rem] border-2 border-zinc-700 shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#09090b] rounded-b-2xl z-20" />
        <div className="h-full flex flex-col bg-[#0b141a]">
          <div className="flex items-center gap-3 px-4 pt-8 pb-3 bg-zinc-900/80 border-b border-zinc-800">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
              <MessageCircle size={16} className="text-black" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">AutoChat AI</p>
              <p className="text-[10px] text-primary">Online</p>
            </div>
          </div>
          <div className="flex-1 p-3 space-y-2.5 overflow-hidden">
            <div className="flex justify-start"><div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-3.5 py-2 max-w-[85%] border border-zinc-700"><p className="text-xs text-zinc-200">Bonjour! Comment puis-je vous aider?</p><p className="text-[9px] text-zinc-500 mt-1">09:01</p></div></div>
            <div className="flex justify-end"><div className="bg-primary rounded-2xl rounded-tr-sm px-3.5 py-2 max-w-[85%]"><p className="text-xs text-black font-medium">Quel est le prix du pack premium?</p><p className="text-[9px] text-black/50 mt-1">09:02</p></div></div>
            <div className="flex justify-start"><div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-3.5 py-2 max-w-[85%] border border-zinc-700"><p className="text-xs text-zinc-200">Le Pack Premium est a 15,000 XAF. Il inclut la livraison gratuite!</p><p className="text-[9px] text-zinc-500 mt-1">09:02</p></div></div>
            <div className="flex justify-end"><div className="bg-primary rounded-2xl rounded-tr-sm px-3.5 py-2 max-w-[85%]"><p className="text-xs text-black font-medium">Je veux commander 2</p><p className="text-[9px] text-black/50 mt-1">09:03</p></div></div>
            <div className="flex justify-start"><div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-3.5 py-2 max-w-[85%] border border-zinc-700"><p className="text-xs text-zinc-200">Total: 30,000 XAF. Envoyez via MTN MoMo au 6XXXXXXXX</p><p className="text-[9px] text-zinc-500 mt-1">09:03</p></div></div>
          </div>
          <div className="px-3 pb-4 pt-2">
            <div className="flex items-center gap-2 bg-zinc-800 rounded-full px-4 py-2.5 border border-zinc-700">
              <span className="text-xs text-zinc-500 flex-1">Message...</span>
              <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center"><ArrowRight size={14} className="text-black" /></div>
            </div>
          </div>
        </div>
      </div>
      <div className="absolute -inset-8 bg-primary/10 rounded-full blur-3xl -z-10" />
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/20 rounded-full blur-2xl" />
    </div>
  );
}

function StatCounter({ value, label }) {
  const [count, setCount] = useState(0);
  const numericValue = parseInt(value.replace(/[^0-9]/g, ""));

  useEffect(() => {
    let start = 0;
    const end = numericValue;
    const duration = 2000;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [numericValue]);

  const suffix = value.includes("K") ? "K+" : value.includes("M") ? "M+" : value.includes("%") ? "%" : "+";

  return (
    <div className="text-center" data-testid={`stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <div className="text-3xl md:text-4xl font-bold text-primary">{count.toLocaleString()}{suffix}</div>
      <div className="text-sm text-zinc-500 mt-1">{label}</div>
    </div>
  );
}

const features = [
  { icon: MessageCircle, title: "24/7 Auto-Replies", desc: "AI responds to every customer message instantly, even while you sleep.", size: "col-span-2 row-span-2" },
  { icon: ShoppingBag, title: "Smart Order Taking", desc: "Automatically collects orders, quantities, and delivery details.", size: "col-span-1 row-span-1" },
  { icon: Zap, title: "Instant Setup", desc: "Connect your WhatsApp in under 5 minutes.", size: "col-span-1 row-span-1" },
  { icon: BarChart3, title: "Live Analytics", desc: "Track conversations, orders, and revenue in real-time.", size: "col-span-2 row-span-1" },
  { icon: Users, title: "Human Takeover", desc: "Jump into any conversation when your AI needs help.", size: "col-span-1 row-span-1" },
  { icon: Shield, title: "Secure Payments", desc: "MTN MoMo and Orange Money integration built in.", size: "col-span-1 row-span-1" },
];

const plans = [
  { name: "Starter", price: "5,000", popular: false, features: ["1 WhatsApp number", "Auto-replies & FAQs", "Up to 500 messages/month", "Basic analytics"] },
  { name: "Growth", price: "15,000", popular: true, features: ["Everything in Starter", "Order taking & tracking", "Unlimited messages", "Product catalog", "Priority support"] },
  { name: "Pro", price: "35,000", popular: false, features: ["Everything in Growth", "Custom AI personality", "Advanced analytics", "Multiple WhatsApp numbers", "API access"] },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16" data-testid="hero-section">
        <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 70% 30%, rgba(37,211,102,0.08) 0%, rgba(9,9,11,0) 60%)" }} />
        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center py-20">
          <motion.div initial="hidden" animate="visible" variants={stagger} className="space-y-8">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-full px-4 py-1.5">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-xs text-zinc-400">Powering 10,000+ African businesses</span>
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1]">
              Your WhatsApp.
              <br />
              <span className="text-primary">On Autopilot.</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-lg">
              AI handles your customer messages, orders and follow-ups 24/7 — so you never miss a sale.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-4 pt-2 relative z-10">
              <Link
                to="/onboarding"
                className="inline-flex items-center justify-center gap-2 bg-primary text-black font-semibold px-8 py-3.5 rounded-full hover:bg-primary-600 transition-all shadow-[0_0_30px_-5px_rgba(37,211,102,0.4)] hover:shadow-[0_0_40px_-5px_rgba(37,211,102,0.6)]"
                data-testid="hero-cta-btn"
              >
                Start Free <ArrowRight size={18} />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 border border-zinc-700 text-zinc-300 font-medium px-8 py-3.5 rounded-full hover:bg-zinc-800/50 hover:border-zinc-600 transition-all relative z-10"
                data-testid="hero-secondary-btn"
              >
                See How It Works <ChevronDown size={18} />
              </a>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }} className="hidden lg:flex justify-center">
            <PhoneMockup />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 pointer-events-none"
        >
          <div className="flex gap-12 md:gap-20 pointer-events-auto">
            <StatCounter value="10K" label="Active Users" />
            <StatCounter value="50M" label="Messages Handled" />
            <StatCounter value="99" label="Uptime %" />
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 md:py-32 px-6 relative" data-testid="how-it-works-section">
        <div className="absolute inset-0 bg-zinc-950/50" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="text-center mb-20">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight">How It Works</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-zinc-400 mt-4">Get up and running in 3 simple steps</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: "01", title: "Connect Your WhatsApp", desc: "Link your WhatsApp Business number. We handle all the technical setup for you." },
              { num: "02", title: "Add Products & Info", desc: "Upload your catalog, set your language, tone, and business preferences." },
              { num: "03", title: "AI Takes Over", desc: "Our AI instantly responds to customers, takes orders, and handles follow-ups." },
            ].map((step, idx) => (
              <motion.div
                key={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={idx}
                className="relative glass-card rounded-2xl p-8 text-center group hover:border-primary/20 transition-all duration-300"
                data-testid={`step-${idx + 1}`}
              >
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 md:py-32 px-6" data-testid="features-section">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={stagger} className="text-center mb-20">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight">Powerful Features</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-zinc-400 mt-4">Everything you need to automate your WhatsApp business</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[180px]">
            {features.map((feat, idx) => (
              <motion.div
                key={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={idx * 0.5}
                className={`glass-card rounded-2xl p-6 flex flex-col justify-between group hover:border-primary/20 transition-all duration-300 ${feat.size}`}
                data-testid={`feature-${idx}`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feat.icon size={22} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">{feat.title}</h3>
                  <p className="text-sm text-zinc-400">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 md:py-32 px-6 relative" data-testid="pricing-section">
        <div className="absolute inset-0 bg-zinc-950/50" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger} className="text-center mb-20">
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight">Simple Pricing</motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-zinc-400 mt-4">Choose the plan that fits your business</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan, idx) => (
              <motion.div
                key={idx}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={idx}
                className={`relative rounded-2xl p-8 transition-all duration-300 ${
                  plan.popular
                    ? "glass-card border-primary/30 shadow-[0_0_30px_-10px_rgba(37,211,102,0.3)] scale-[1.02]"
                    : "glass-card hover:border-zinc-700"
                }`}
                data-testid={`pricing-${plan.name.toLowerCase()}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-black text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</span>
                  </div>
                )}
                <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                <div className="mt-4 mb-6">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-zinc-500 ml-2">XAF/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                      <Check size={16} className="text-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/onboarding"
                  className={`block w-full py-3 rounded-full font-semibold text-center transition-all ${
                    plan.popular
                      ? "bg-primary text-black hover:bg-primary-600 shadow-[0_0_20px_-5px_rgba(37,211,102,0.4)]"
                      : "bg-zinc-800 text-white hover:bg-zinc-700"
                  }`}
                  data-testid={`pricing-cta-${plan.name.toLowerCase()}`}
                >
                  Get Started
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6" data-testid="cta-section">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}>
            <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-bold tracking-tight">
              Ready to automate your<br /><span className="text-primary">WhatsApp business?</span>
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-lg text-zinc-400 mt-6 max-w-2xl mx-auto">
              Join thousands of African entrepreneurs who are growing their business with AI-powered WhatsApp automation.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="mt-10">
              <Link
                to="/onboarding"
                className="inline-flex items-center gap-2 bg-primary text-black font-semibold px-10 py-4 rounded-full hover:bg-primary-600 transition-all shadow-[0_0_40px_-5px_rgba(37,211,102,0.4)] text-lg"
                data-testid="bottom-cta-btn"
              >
                Start Free Today <ArrowRight size={20} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 py-12 px-6" data-testid="footer">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <MessageCircle size={14} className="text-black" />
            </div>
            <span className="font-bold text-white">AutoChat</span>
            <span className="text-zinc-600 text-sm ml-2">Built for African businesses</span>
          </div>
          <p className="text-zinc-600 text-sm">
            Contact: <a href="mailto:hello@autochat.ai" className="text-primary hover:underline">hello@autochat.ai</a>
          </p>
          <p className="text-zinc-600 text-sm">&copy; 2026 AutoChat. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
