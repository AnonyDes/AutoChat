"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import supabase from "@/lib/supabase";
import type { Client, Product } from "@/types";

interface ProductForm {
  name: string;
  price: string;
  description: string;
  stock: string;
}

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Step 1: Business Info
  const [email, setEmail] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [countryCode, setCountryCode] = useState("+237");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [location, setLocation] = useState("");

  // Step 2: Products
  const [products, setProducts] = useState<ProductForm[]>([
    { name: "", price: "", description: "", stock: "" },
  ]);

  // Step 3: Bot Settings
  const [language, setLanguage] = useState<"French" | "English" | "Bilingual">("French");
  const [tone, setTone] = useState<"Friendly" | "Formal" | "Local/Pidgin">("Friendly");
  const [workingHoursStart, setWorkingHoursStart] = useState("08:00");
  const [workingHoursEnd, setWorkingHoursEnd] = useState("18:00");
  const [outOfHoursMessage, setOutOfHoursMessage] = useState(
    "Nous sommes fermés. Nous vous répondrons demain."
  );

  const addProduct = () => {
    setProducts([...products, { name: "", price: "", description: "", stock: "" }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: keyof ProductForm, value: string) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const validateStep1 = () => {
    if (!email || !businessName || !phoneNumber || !businessDescription || !location) {
      setError("All fields are required");
      return false;
    }
    if (!email.includes("@")) {
      setError("Please enter a valid email");
      return false;
    }
    setError("");
    return true;
  };

  const validateStep2 = () => {
    if (products.length === 0) {
      setError("At least one product is required");
      return false;
    }
    for (const product of products) {
      if (!product.name || !product.price || !product.description || !product.stock) {
        setError("All product fields are required");
        return false;
      }
      if (isNaN(Number(product.price)) || Number(product.price) <= 0) {
        setError("Price must be a valid positive number");
        return false;
      }
      if (isNaN(Number(product.stock)) || Number(product.stock) < 0) {
        setError("Stock must be a valid number");
        return false;
      }
    }
    setError("");
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setError("");
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      // Insert client
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .insert({
          email,
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

      // Insert products
      const productsToInsert = products.map((p) => ({
        client_id: clientData.id,
        name: p.name,
        price: Number(p.price),
        description: p.description,
        stock: Number(p.stock),
        available: true,
      }));

      const { error: productsError } = await supabase
        .from("products")
        .insert(productsToInsert);

      if (productsError) throw productsError;

      // Success - redirect to dashboard
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Submission error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save data. Please try again."
      );
      setIsSubmitting(false);
    }
  };

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to AutoChat</h1>
          <p className="mt-2 text-sm text-gray-600">
            Set up your AI-powered WhatsApp assistant in 4 easy steps
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-sm font-medium text-gray-700">
            <span>Step {currentStep} of 4</span>
            <span>{Math.round(progressPercentage)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-[#25D366] transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="rounded-xl bg-white p-6 shadow-lg sm:p-8">
          {error && (
            <div className="mb-6 rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Step 1: Business Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Business Information</h2>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                  placeholder="My Business"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  WhatsApp Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="w-32 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                  >
                    <option value="+237">🇨🇲 +237</option>
                    <option value="+234">🇳🇬 +234</option>
                    <option value="+225">🇨🇮 +225</option>
                    <option value="+221">🇸🇳 +221</option>
                    <option value="+233">🇬🇭 +233</option>
                    <option value="+254">🇰🇪 +254</option>
                    <option value="+255">🇹🇿 +255</option>
                    <option value="+256">🇺🇬 +256</option>
                    <option value="+27">🇿🇦 +27</option>
                    <option value="+212">🇲🇦 +212</option>
                    <option value="+213">🇩🇿 +213</option>
                    <option value="+216">🇹🇳 +216</option>
                    <option value="+251">🇪🇹 +251</option>
                    <option value="+260">🇿🇲 +260</option>
                    <option value="+263">🇿🇼 +263</option>
                  </select>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                    placeholder="6XXXXXXXX"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Full number: {countryCode}{phoneNumber}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Business Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={businessDescription}
                  onChange={(e) => setBusinessDescription(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                  placeholder="Describe what your business does..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location/City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                  placeholder="Douala, Cameroon"
                />
              </div>
            </div>
          )}

          {/* Step 2: Products */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Your Products</h2>
                <button
                  onClick={addProduct}
                  className="rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white hover:bg-[#20BD5A] transition-colors"
                >
                  + Add Product
                </button>
              </div>

              <div className="space-y-4">
                {products.map((product, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-gray-200 p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">
                        Product {index + 1}
                      </span>
                      {products.length > 1 && (
                        <button
                          onClick={() => removeProduct(index)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => updateProduct(index, "name", e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                          placeholder="Product name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Price (XAF) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={product.price}
                          onChange={(e) => updateProduct(index, "price", e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                          placeholder="5000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Stock Quantity <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={product.stock}
                          onChange={(e) => updateProduct(index, "stock", e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                          placeholder="100"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={product.description}
                          onChange={(e) =>
                            updateProduct(index, "description", e.target.value)
                          }
                          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                          placeholder="Product description"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Bot Settings */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Bot Settings</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) =>
                      setLanguage(e.target.value as "French" | "English" | "Bilingual")
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                  >
                    <option value="French">French</option>
                    <option value="English">English</option>
                    <option value="Bilingual">Bilingual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Tone</label>
                  <select
                    value={tone}
                    onChange={(e) =>
                      setTone(e.target.value as "Friendly" | "Formal" | "Local/Pidgin")
                    }
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                  >
                    <option value="Friendly">Friendly</option>
                    <option value="Formal">Formal</option>
                    <option value="Local/Pidgin">Local/Pidgin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Working Hours Start
                  </label>
                  <input
                    type="time"
                    value={workingHoursStart}
                    onChange={(e) => setWorkingHoursStart(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Working Hours End
                  </label>
                  <input
                    type="time"
                    value={workingHoursEnd}
                    onChange={(e) => setWorkingHoursEnd(e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Out of Hours Message
                </label>
                <textarea
                  value={outOfHoursMessage}
                  onChange={(e) => setOutOfHoursMessage(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#25D366] focus:outline-none focus:ring-2 focus:ring-[#25D366]/20"
                />
              </div>
            </div>
          )}

          {/* Step 4: Review & Launch */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900">Review & Launch</h2>

              <div className="space-y-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Business Information
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Email:</dt>
                      <dd className="font-medium text-gray-900">{email}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Business Name:</dt>
                      <dd className="font-medium text-gray-900">{businessName}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Phone:</dt>
                      <dd className="font-medium text-gray-900">{phoneNumber}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Location:</dt>
                      <dd className="font-medium text-gray-900">{location}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 mb-1">Description:</dt>
                      <dd className="font-medium text-gray-900">{businessDescription}</dd>
                    </div>
                  </dl>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Products ({products.length})
                  </h3>
                  <div className="space-y-3">
                    {products.map((product, index) => (
                      <div
                        key={index}
                        className="rounded-md bg-white p-3 border border-gray-200"
                      >
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="mt-1 text-sm text-gray-600">
                          {product.description}
                        </div>
                        <div className="mt-2 flex gap-4 text-sm">
                          <span className="text-gray-600">
                            Price: <span className="font-medium">{product.price} XAF</span>
                          </span>
                          <span className="text-gray-600">
                            Stock: <span className="font-medium">{product.stock}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Bot Settings
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Language:</dt>
                      <dd className="font-medium text-gray-900">{language}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Tone:</dt>
                      <dd className="font-medium text-gray-900">{tone}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Working Hours:</dt>
                      <dd className="font-medium text-gray-900">
                        {workingHoursStart} - {workingHoursEnd}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-600 mb-1">Out of Hours Message:</dt>
                      <dd className="font-medium text-gray-900">{outOfHoursMessage}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 flex gap-4">
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Back
              </button>
            )}

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="flex-1 rounded-lg bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:bg-[#20BD5A] transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 rounded-lg bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:bg-[#20BD5A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Launching...
                  </>
                ) : (
                  <>Launch My Bot 🚀</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
