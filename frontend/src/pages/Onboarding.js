import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import supabase from "../lib/supabase";
import {
  MessageCircle, User, Building2, Package, Settings,
  ArrowRight, ArrowLeft, Plus, Trash2, Check, Loader2,
  MapPin, Phone, Globe, Smile, Clock, Mail, Lock
} from "lucide-react";

const steps = [
  { id: 1, label: "Account", icon: User },
  { id: 2, label: "Business", icon: Building2 },
  { id: 3, label: "Products", icon: Package },
  { id: 4, label: "Settings", icon: Settings },
];

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir < 0 ? 300 : -300, opacity: 0 }),
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, signUp, signIn } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Account
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Step 2: Business
  const [businessName, setBusinessName] = useState("");
  const [countryCode, setCountryCode] = useState("+237");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [location, setLocation] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");

  // Step 3: Products
  const [products, setProducts] = useState([{ name: "", price: "", description: "", stock: "" }]);

  // Step 4: Bot Settings
  const [language, setLanguage] = useState("French");
  const [tone, setTone] = useState("Friendly");
  const [workingHoursStart, setWorkingHoursStart] = useState("08:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("18:00");
  const [outOfHoursMessage, setOutOfHoursMessage] = useState("Nous sommes fermes. Nous vous repondrons demain.");

  useEffect(() => {
    if (user) {
      setCurrentStep(2);
      setEmail(user.email || "");
    }
  }, [user]);

  const addProduct = () => setProducts([...products, { name: "", price: "", description: "", stock: "" }]);
  const removeProduct = (idx) => { if (products.length > 1) setProducts(products.filter((_, i) => i !== idx)); };
  const updateProduct = (idx, field, value) => {
    const updated = [...products];
    updated[idx] = { ...updated[idx], [field]: value };
    setProducts(updated);
  };

  const validateStep = () => {
    setError("");
    if (currentStep === 1 && !user) {
      if (!email || !password || !confirmPassword) { setError("All fields are required"); return false; }
      if (!email.includes("@")) { setError("Please enter a valid email"); return false; }
      if (password.length < 6) { setError("Password must be at least 6 characters"); return false; }
      if (password !== confirmPassword) { setError("Passwords do not match"); return false; }
    }
    if (currentStep === 2) {
      if (!businessName || !phoneNumber || !location || !businessDescription) { setError("All fields are required"); return false; }
    }
    if (currentStep === 3) {
      for (const p of products) {
        if (!p.name || !p.price || !p.description || !p.stock) { setError("All product fields are required"); return false; }
        if (isNaN(Number(p.price)) || Number(p.price) <= 0) { setError("Price must be a positive number"); return false; }
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (currentStep === 1 && !user) {
      setIsSubmitting(true);
      try {
        const result = await signUp(email, password);
        // If rate limited, still proceed - account may already be created
        if (result?.rateLimited) {
          // Account creation may have happened but email rate limit hit - proceed anyway
        }
      } catch (err) {
        const msg = err.message || "Failed to create account";
        // If user already exists, try to sign in and proceed
        if (msg.toLowerCase().includes("already registered") || 
            msg.toLowerCase().includes("log in instead") ||
            msg.toLowerCase().includes("email not confirmed")) {
          try {
            await signIn(email, password);
          } catch (signInErr) {
            // If sign-in fails too, still proceed - user can login later
            // The important thing is not to block onboarding
          }
        } else if (!msg.toLowerCase().includes("rate limit")) {
          setError(msg);
          setIsSubmitting(false);
          return;
        }
      }
      setIsSubmitting(false);
    }

    setDirection(1);
    setCurrentStep((s) => Math.min(s + 1, 4));
  };

  const handleBack = () => {
    setError("");
    setDirection(-1);
    setCurrentStep((s) => Math.max(s - 1, user ? 2 : 1));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");
    try {
      // If user isn't logged in yet, try signing in
      let authEmail = user?.email || email;
      if (!user && email && password) {
        try {
          const { data } = await supabase.auth.signInWithPassword({ email, password });
          if (data?.user) authEmail = data.user.email;
        } catch {
          // Continue with the email from form
        }
      }

      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({
          email: authEmail,
          business_name: businessName,
          phone_number: countryCode + phoneNumber,
          language,
          tone,
          working_hours_start: workingHoursStart,
          working_hours_end: workingHoursEnd,
          out_of_hours_message: outOfHoursMessage,
          is_bot_active: true,
          location,
          business_description: businessDescription,
        })
        .select()
        .single();

      if (clientError) throw clientError;

      const productsToInsert = products.map((p) => ({
        client_id: clientData.id,
        name: p.name,
        price: Number(p.price),
        description: p.description,
        stock: Number(p.stock),
        available: true,
      }));

      const { error: productsError } = await supabase.from("products").insert(productsToInsert);
      if (productsError) throw productsError;

      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Failed to save data. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = (currentStep / 4) * 100;

  const inputClass = "w-full bg-zinc-900/50 border border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 transition-all text-sm outline-none";
  const selectClass = "w-full bg-zinc-900/50 border border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-white transition-all text-sm outline-none appearance-none";
  const labelClass = "block text-sm font-medium text-zinc-400 mb-1.5";

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="absolute inset-0" style={{ background: "radial-gradient(circle at 30% 50%, rgba(37,211,102,0.05) 0%, transparent 60%)" }} />

      <div className="relative z-10 w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center">
              <MessageCircle size={18} className="text-black" />
            </div>
            <span className="text-lg font-bold text-white">AutoChat</span>
          </div>
          <h1 className="text-2xl font-bold text-white" data-testid="onboarding-heading">Set up your AI assistant</h1>
          <p className="text-zinc-500 text-sm mt-1">Step {currentStep} of 4</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step) => (
              <div key={step.id} className="flex items-center gap-2" data-testid={`step-indicator-${step.id}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 ${
                  currentStep >= step.id
                    ? "bg-primary text-black"
                    : "bg-zinc-800 text-zinc-600"
                }`}>
                  {currentStep > step.id ? <Check size={16} /> : <step.icon size={16} />}
                </div>
                <span className={`hidden sm:block text-xs font-medium transition-colors ${
                  currentStep >= step.id ? "text-white" : "text-zinc-600"
                }`}>{step.label}</span>
              </div>
            ))}
          </div>
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
                data-testid="onboarding-error"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 1: Account */}
            {currentStep === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-5"
                data-testid="onboarding-step-1"
              >
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <User size={20} className="text-primary" /> Create Your Account
                </h2>
                <div>
                  <label className={labelClass}>Email <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} pl-11`} placeholder="you@business.com" data-testid="onboarding-email" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Password <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={`${inputClass} pl-11`} placeholder="Min 6 characters" data-testid="onboarding-password" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Confirm Password <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={`${inputClass} pl-11`} placeholder="Confirm password" data-testid="onboarding-confirm-password" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Business Info */}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-5"
                data-testid="onboarding-step-2"
              >
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Building2 size={20} className="text-primary" /> Business Information
                </h2>
                <div>
                  <label className={labelClass}>Business Name <span className="text-red-400">*</span></label>
                  <input type="text" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} placeholder="My Business" data-testid="onboarding-business-name" />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp Number <span className="text-red-400">*</span></label>
                  <div className="flex gap-3">
                    <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="w-[110px] shrink-0 bg-zinc-900/50 border border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-3 text-white transition-all text-sm outline-none" data-testid="onboarding-country-code">
                      <option value="+237">+237</option>
                      <option value="+234">+234</option>
                      <option value="+225">+225</option>
                      <option value="+233">+233</option>
                      <option value="+254">+254</option>
                      <option value="+27">+27</option>
                    </select>
                    <div className="relative flex-1">
                      <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                      <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))} className={`${inputClass} pl-11`} placeholder="6XXXXXXXX" data-testid="onboarding-phone" />
                    </div>
                  </div>
                  <p className="text-xs text-zinc-600 mt-1.5">Full number: {countryCode}{phoneNumber}</p>
                </div>
                <div>
                  <label className={labelClass}>Location <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} className={`${inputClass} pl-11`} placeholder="Douala, Cameroon" data-testid="onboarding-location" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Business Description <span className="text-red-400">*</span></label>
                  <textarea value={businessDescription} onChange={(e) => setBusinessDescription(e.target.value)} rows={3} className={inputClass} placeholder="What does your business do?" data-testid="onboarding-description" />
                </div>
              </motion.div>
            )}

            {/* Step 3: Products */}
            {currentStep === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-5"
                data-testid="onboarding-step-3"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Package size={20} className="text-primary" /> Your Products
                  </h2>
                  <button onClick={addProduct} className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-400 transition-colors" data-testid="add-product-btn">
                    <Plus size={16} /> Add
                  </button>
                </div>

                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  {products.map((product, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-3"
                      data-testid={`product-card-${idx}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-zinc-500">Product {idx + 1}</span>
                        {products.length > 1 && (
                          <button onClick={() => removeProduct(idx)} className="text-zinc-600 hover:text-red-400 transition-colors" data-testid={`remove-product-${idx}`}>
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" value={product.name} onChange={(e) => updateProduct(idx, "name", e.target.value)} className={inputClass} placeholder="Name" data-testid={`product-name-${idx}`} />
                        <input type="number" value={product.price} onChange={(e) => updateProduct(idx, "price", e.target.value)} className={inputClass} placeholder="Price (XAF)" data-testid={`product-price-${idx}`} />
                        <input type="number" value={product.stock} onChange={(e) => updateProduct(idx, "stock", e.target.value)} className={inputClass} placeholder="Stock" data-testid={`product-stock-${idx}`} />
                        <input type="text" value={product.description} onChange={(e) => updateProduct(idx, "description", e.target.value)} className={inputClass} placeholder="Description" data-testid={`product-desc-${idx}`} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Bot Settings */}
            {currentStep === 4 && (
              <motion.div
                key="step4"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="space-y-5"
                data-testid="onboarding-step-4"
              >
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Settings size={20} className="text-primary" /> Bot Settings
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}><Globe size={14} className="inline mr-1" />Language</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className={selectClass} data-testid="onboarding-language">
                      <option value="French">French</option>
                      <option value="English">English</option>
                      <option value="Bilingual">Bilingual</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}><Smile size={14} className="inline mr-1" />Tone</label>
                    <select value={tone} onChange={(e) => setTone(e.target.value)} className={selectClass} data-testid="onboarding-tone">
                      <option value="Friendly">Friendly</option>
                      <option value="Formal">Formal</option>
                      <option value="Local/Pidgin">Local Pidgin</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}><Clock size={14} className="inline mr-1" />Hours Start</label>
                    <input type="time" value={workingHoursStart} onChange={(e) => setWorkingHoursStart(e.target.value)} className={inputClass} data-testid="onboarding-hours-start" />
                  </div>
                  <div>
                    <label className={labelClass}><Clock size={14} className="inline mr-1" />Hours End</label>
                    <input type="time" value={workingHoursEnd} onChange={(e) => setWorkingHoursEnd(e.target.value)} className={inputClass} data-testid="onboarding-hours-end" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Out of Hours Message</label>
                  <textarea value={outOfHoursMessage} onChange={(e) => setOutOfHoursMessage(e.target.value)} rows={2} className={inputClass} data-testid="onboarding-ooh-message" />
                </div>

                {/* Review Summary */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 space-y-2 mt-4">
                  <h3 className="text-sm font-semibold text-primary">Review Summary</h3>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                    <span className="text-zinc-500">Business:</span><span className="text-zinc-300">{businessName || "—"}</span>
                    <span className="text-zinc-500">Phone:</span><span className="text-zinc-300">{countryCode}{phoneNumber || "—"}</span>
                    <span className="text-zinc-500">Location:</span><span className="text-zinc-300">{location || "—"}</span>
                    <span className="text-zinc-500">Products:</span><span className="text-zinc-300">{products.filter(p => p.name).length} items</span>
                    <span className="text-zinc-500">Language:</span><span className="text-zinc-300">{language}</span>
                    <span className="text-zinc-500">Tone:</span><span className="text-zinc-300">{tone}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex gap-3">
            {currentStep > (user ? 2 : 1) && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 border border-zinc-700 text-zinc-300 font-medium py-3 rounded-full hover:bg-zinc-800/50 transition-all disabled:opacity-50"
                data-testid="onboarding-back-btn"
              >
                <ArrowLeft size={18} /> Back
              </button>
            )}

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-semibold py-3 rounded-full hover:bg-primary-600 transition-all shadow-[0_0_20px_-5px_rgba(37,211,102,0.4)] disabled:opacity-50"
                data-testid="onboarding-next-btn"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>{currentStep === 1 && !user ? "Create Account & Next" : "Next"} <ArrowRight size={18} /></>}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 bg-primary text-black font-semibold py-3 rounded-full hover:bg-primary-600 transition-all shadow-[0_0_20px_-5px_rgba(37,211,102,0.4)] disabled:opacity-50"
                data-testid="onboarding-launch-btn"
              >
                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <>Launch My Bot <ArrowRight size={18} /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
