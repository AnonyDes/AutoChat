"use client";

import { useState, useEffect } from "react";
import supabase from "@/lib/supabase";
import type { Client, Product, Conversation, Order, Message } from "@/types";

const CLIENT_ID = "your-client-id-here";

type Tab = "overview" | "conversations" | "orders" | "products" | "settings";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    stock: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: clientData } = await supabase
        .from("clients")
        .select("*")
        .eq("id", CLIENT_ID)
        .single();

      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("client_id", CLIENT_ID);

      const { data: conversationsData } = await supabase
        .from("conversations")
        .select("*")
        .eq("client_id", CLIENT_ID)
        .order("updated_at", { ascending: false });

      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .eq("client_id", CLIENT_ID)
        .order("created_at", { ascending: false });

      setClient(clientData);
      setProducts(productsData || []);
      setConversations(conversationsData || []);
      setOrders(ordersData || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleBot = async () => {
    if (!client) return;
    const newStatus = !client.is_bot_active;
    await supabase
      .from("clients")
      .update({ is_bot_active: newStatus })
      .eq("id", CLIENT_ID);
    setClient({ ...client, is_bot_active: newStatus });
  };

  const updateOrderStatus = async (orderId: string, status: "pending" | "confirmed" | "delivered" | "cancelled") => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    await supabase.from("products").update(updates).eq("id", productId);
    setProducts(products.map((p) => (p.id === productId ? { ...p, ...updates } : p)));
    setEditingProduct(null);
  };

  const addProduct = async () => {
    const { data } = await supabase
      .from("products")
      .insert({
        client_id: CLIENT_ID,
        name: newProduct.name,
        price: Number(newProduct.price),
        description: newProduct.description,
        stock: Number(newProduct.stock),
        available: true,
      })
      .select()
      .single();

    if (data) {
      setProducts([...products, data]);
      setShowProductModal(false);
      setNewProduct({ name: "", price: "", description: "", stock: "" });
    }
  };

  const updateClient = async (updates: Partial<Client>) => {
    await supabase.from("clients").update(updates).eq("id", CLIENT_ID);
    setClient({ ...client!, ...updates });
  };

  const markResolved = async (conversationId: string) => {
    await supabase
      .from("conversations")
      .update({ status: "resolved" })
      .eq("id", conversationId);
    setConversations(
      conversations.map((c) => (c.id === conversationId ? { ...c, status: "resolved" } : c))
    );
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation({ ...selectedConversation, status: "resolved" });
    }
  };

  const getStatsForToday = () => {
    const today = new Date().toISOString().split("T")[0];
    const conversationsToday = conversations.filter((c) =>
      c.created_at.startsWith(today)
    ).length;
    const messagesHandled = conversations.reduce((acc, c) => {
      const todayMessages = (c.messages || []).filter(
        (m: Message) => m.role === "agent" && m.timestamp.startsWith(today)
      );
      return acc + todayMessages.length;
    }, 0);
    const ordersToday = orders.filter((o) => o.created_at.startsWith(today)).length;
    const escalations = conversations.filter((c) => c.status === "escalated").length;
    return { conversationsToday, messagesHandled, ordersToday, escalations };
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 bg-gray-900 animate-pulse" />
        <div className="flex-1 p-8">
          <div className="grid grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = getStatsForToday();

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-xl font-bold">{client?.business_name || "AutoChat"}</h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {(["overview", "conversations", "orders", "products", "settings"] as Tab[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`w-full text-left px-4 py-2.5 rounded-lg capitalize transition-colors ${
                  activeTab === tab
                    ? "bg-[#25D366] text-white"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                {tab}
              </button>
            )
          )}
        </nav>

        <div className="p-4 border-t border-gray-700">
          <button
            onClick={toggleBot}
            className={`w-full px-4 py-3 rounded-lg font-medium transition-colors ${
              client?.is_bot_active
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {client?.is_bot_active ? "🟢 Bot Active" : "🔴 Bot Paused"}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Conversations Today</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.conversationsToday}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Messages Handled</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {stats.messagesHandled}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Orders Today</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">{stats.ordersToday}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-sm font-medium text-gray-500">Escalations</h3>
                <p className="mt-2 text-3xl font-bold text-red-600">{stats.escalations}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Recent Conversations</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {conversations.slice(0, 5).map((conv) => {
                  const lastMessage = conv.messages?.[conv.messages.length - 1];
                  return (
                    <div key={conv.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{conv.customer_phone}</p>
                          <p className="text-sm text-gray-500 truncate">
                            {lastMessage?.content || "No messages"}
                          </p>
                        </div>
                        <div className="ml-4 flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                              conv.status === "active"
                                ? "bg-green-100 text-green-800"
                                : conv.status === "escalated"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {conv.status}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(conv.updated_at).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Conversations Tab */}
        {activeTab === "conversations" && (
          <div className="flex h-full">
            <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
              <div className="p-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">All Conversations</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {conversations.map((conv) => {
                  const lastMessage = conv.messages?.[conv.messages.length - 1];
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${
                        selectedConversation?.id === conv.id ? "bg-gray-100" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {conv.customer_phone}
                        </p>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            conv.status === "active"
                              ? "bg-green-100 text-green-800"
                              : conv.status === "escalated"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {conv.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">
                        {lastMessage?.content || "No messages"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {selectedConversation.status === "escalated" && (
                    <div className="bg-red-50 border-b border-red-200 px-6 py-3 flex items-center justify-between">
                      <span className="text-sm font-medium text-red-800">
                        ⚠️ This conversation has been escalated
                      </span>
                      <button
                        onClick={() => markResolved(selectedConversation.id)}
                        className="px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  )}

                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                    {(selectedConversation.messages || []).map((msg: Message, idx: number) => (
                      <div
                        key={idx}
                        className={`flex ${
                          msg.role === "customer" ? "justify-start" : "justify-end"
                        }`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-lg ${
                            msg.role === "customer"
                              ? "bg-white text-gray-900"
                              : "bg-[#25D366] text-white"
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.role === "customer" ? "text-gray-500" : "text-green-100"
                            }`}
                          >
                            {new Date(msg.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-gray-200 p-4 bg-white">
                    <button
                      onClick={() => markResolved(selectedConversation.id)}
                      className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
                    >
                      Pause Bot for This Chat
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  Select a conversation to view messages
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Orders</h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.customer_phone}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {order.items.map((item, i) => (
                          <div key={i}>
                            {item.product_name} x{item.quantity}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.total} XAF
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={order.status}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="text-sm border-gray-300 rounded-md focus:ring-[#25D366] focus:border-[#25D366]"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Products</h2>
              <button
                onClick={() => setShowProductModal(true)}
                className="px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20BD5A]"
              >
                + Add Product
              </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingProduct === product.id ? (
                          <input
                            type="text"
                            defaultValue={product.name}
                            onBlur={(e) => updateProduct(product.id, { name: e.target.value })}
                            className="border-gray-300 rounded-md text-sm"
                          />
                        ) : (
                          <span className="text-sm font-medium text-gray-900">
                            {product.name}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingProduct === product.id ? (
                          <input
                            type="number"
                            defaultValue={product.price}
                            onBlur={(e) =>
                              updateProduct(product.id, { price: Number(e.target.value) })
                            }
                            className="w-24 border-gray-300 rounded-md text-sm"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{product.price} XAF</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingProduct === product.id ? (
                          <input
                            type="number"
                            defaultValue={product.stock}
                            onBlur={(e) =>
                              updateProduct(product.id, { stock: Number(e.target.value) })
                            }
                            className="w-20 border-gray-300 rounded-md text-sm"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{product.stock}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={product.available}
                          onChange={(e) =>
                            updateProduct(product.id, { available: e.target.checked })
                          }
                          className="rounded text-[#25D366] focus:ring-[#25D366]"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            setEditingProduct(
                              editingProduct === product.id ? null : product.id
                            )
                          }
                          className="text-sm text-[#25D366] hover:text-[#20BD5A] font-medium"
                        >
                          {editingProduct === product.id ? "Done" : "Edit"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && client && (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Settings</h2>
            <div className="bg-white rounded-lg shadow p-6 max-w-2xl">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <input
                    type="text"
                    defaultValue={client.business_name}
                    onBlur={(e) => updateClient({ business_name: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#25D366] focus:border-[#25D366]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Business Description
                  </label>
                  <textarea
                    defaultValue={client.business_description}
                    onBlur={(e) => updateClient({ business_description: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#25D366] focus:border-[#25D366]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    defaultValue={client.location}
                    onBlur={(e) => updateClient({ location: e.target.value })}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#25D366] focus:border-[#25D366]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Language
                    </label>
                    <select
                      defaultValue={client.language}
                      onChange={(e) =>
                        updateClient({
                          language: e.target.value as "French" | "English" | "Bilingual",
                        })
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#25D366] focus:border-[#25D366]"
                    >
                      <option value="French">French</option>
                      <option value="English">English</option>
                      <option value="Bilingual">Bilingual</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tone</label>
                    <select
                      defaultValue={client.tone}
                      onChange={(e) =>
                        updateClient({
                          tone: e.target.value as "Friendly" | "Formal" | "Local/Pidgin",
                        })
                      }
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#25D366] focus:border-[#25D366]"
                    >
                      <option value="Friendly">Friendly</option>
                      <option value="Formal">Formal</option>
                      <option value="Local/Pidgin">Local/Pidgin</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Working Hours Start
                    </label>
                    <input
                      type="time"
                      defaultValue={client.working_hours_start}
                      onBlur={(e) => updateClient({ working_hours_start: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#25D366] focus:border-[#25D366]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Working Hours End
                    </label>
                    <input
                      type="time"
                      defaultValue={client.working_hours_end}
                      onBlur={(e) => updateClient({ working_hours_end: e.target.value })}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#25D366] focus:border-[#25D366]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Out of Hours Message
                  </label>
                  <textarea
                    defaultValue={client.out_of_hours_message}
                    onBlur={(e) => updateClient({ out_of_hours_message: e.target.value })}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#25D366] focus:border-[#25D366]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Product</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#25D366] focus:border-[#25D366]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Price (XAF)
                </label>
                <input
                  type="number"
                  value={newProduct.price}
                  onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#25D366] focus:border-[#25D366]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <input
                  type="text"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, description: e.target.value })
                  }
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#25D366] focus:border-[#25D366]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Stock</label>
                <input
                  type="number"
                  value={newProduct.stock}
                  onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-[#25D366] focus:border-[#25D366]"
                />
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setShowProductModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={addProduct}
                className="flex-1 px-4 py-2 bg-[#25D366] text-white rounded-lg hover:bg-[#20BD5A]"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
