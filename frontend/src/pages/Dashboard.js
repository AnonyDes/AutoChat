import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../contexts/AuthContext";
import supabase from "../lib/supabase";
import {
  LayoutDashboard, MessageSquare, ShoppingBag, Package, Settings,
  LogOut, MessageCircle, Power, Plus, Trash2, Check, X,
  TrendingUp, Clock, AlertTriangle, ChevronRight, Search, Edit2, Save, Bell
} from "lucide-react";

const navItems = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "conversations", label: "Conversations", icon: MessageSquare },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "products", label: "Products", icon: Package },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState(null);
  const [products, setProducts] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({ name: "", price: "", description: "", stock: "" });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notifications, setNotifications] = useState({ escalations: 0, pendingOrders: 0 });
  const chatEndRef = useRef(null);

  useEffect(() => { loadData(); }, [user]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selectedConversation]);

  // Real-time subscriptions
  useEffect(() => {
    if (!client) return;

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'conversations',
        filter: `client_id=eq.${client.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setConversations(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setConversations(prev => prev.map(c => c.id === payload.new.id ? payload.new : c));
          if (selectedConversation?.id === payload.new.id) {
            setSelectedConversation(payload.new);
          }
        }
        updateNotifications();
      })
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'orders',
        filter: `client_id=eq.${client.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setOrders(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setOrders(prev => prev.map(o => o.id === payload.new.id ? payload.new : o));
        }
        updateNotifications();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [client, selectedConversation]);

  // Update notification badges
  const updateNotifications = useCallback(() => {
    const escalations = conversations.filter(c => c.status === 'escalated').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    setNotifications({ escalations, pendingOrders });
  }, [conversations, orders]);

  useEffect(() => { updateNotifications(); }, [conversations, orders, updateNotifications]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: clientData } = await supabase.from("clients").select("*").eq("email", user.email).single();
      if (!clientData) { setLoading(false); return; }
      setClient(clientData);

      const [productsRes, convsRes, ordersRes] = await Promise.all([
        supabase.from("products").select("*").eq("client_id", clientData.id),
        supabase.from("conversations").select("*").eq("client_id", clientData.id).order("updated_at", { ascending: false }),
        supabase.from("orders").select("*").eq("client_id", clientData.id).order("created_at", { ascending: false }),
      ]);

      setProducts(productsRes.data || []);
      setConversations(convsRes.data || []);
      setOrders(ordersRes.data || []);
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleBot = async () => {
    if (!client) return;
    const newStatus = !client.is_bot_active;
    await supabase.from("clients").update({ is_bot_active: newStatus }).eq("id", client.id);
    setClient({ ...client, is_bot_active: newStatus });
  };

  const updateOrderStatus = async (orderId, status) => {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    setOrders(orders.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const updateProduct = async (productId, updates) => {
    await supabase.from("products").update(updates).eq("id", productId);
    setProducts(products.map((p) => (p.id === productId ? { ...p, ...updates } : p)));
    setEditingProduct(null);
  };

  const addProduct = async () => {
    const { data } = await supabase
      .from("products")
      .insert({ client_id: client.id, name: newProduct.name, price: Number(newProduct.price), description: newProduct.description, stock: Number(newProduct.stock), available: true })
      .select().single();
    if (data) {
      setProducts([...products, data]);
      setShowProductModal(false);
      setNewProduct({ name: "", price: "", description: "", stock: "" });
    }
  };

  const deleteProduct = async (productId) => {
    await supabase.from("products").delete().eq("id", productId);
    setProducts(products.filter((p) => p.id !== productId));
  };

  const updateClient = async (updates) => {
    await supabase.from("clients").update(updates).eq("id", client.id);
    setClient({ ...client, ...updates });
  };

  const markResolved = async (conversationId) => {
    await supabase.from("conversations").update({ status: "resolved" }).eq("id", conversationId);
    setConversations(conversations.map((c) => (c.id === conversationId ? { ...c, status: "resolved" } : c)));
    if (selectedConversation?.id === conversationId) setSelectedConversation({ ...selectedConversation, status: "resolved" });
  };

  const handleSignOut = async () => { await signOut(); navigate("/login"); };

  const getStats = () => {
    const today = new Date().toISOString().split("T")[0];
    const convsToday = conversations.filter((c) => c.created_at?.startsWith(today)).length;
    const msgsHandled = conversations.reduce((acc, c) => {
      const msgs = (c.messages || []).filter((m) => m.role === "agent" && m.timestamp?.startsWith(today));
      return acc + msgs.length;
    }, 0);
    const ordersToday = orders.filter((o) => o.created_at?.startsWith(today)).length;
    const escalations = conversations.filter((c) => c.status === "escalated").length;
    return { convsToday, msgsHandled, ordersToday, escalations };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center" data-testid="dashboard-loading">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-zinc-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-6" data-testid="no-client-screen">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageCircle size={28} className="text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Complete Your Setup</h2>
          <p className="text-zinc-400 mb-8">You haven't set up your business yet. Complete the onboarding to start using AutoChat.</p>
          <Link to="/onboarding" className="inline-flex items-center gap-2 bg-primary text-black font-semibold px-8 py-3 rounded-full" data-testid="go-to-onboarding-btn">
            Complete Setup <ChevronRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  const stats = getStats();
  const statCards = [
    { label: "Conversations Today", value: stats.convsToday, icon: MessageSquare, color: "text-primary" },
    { label: "Messages Handled", value: stats.msgsHandled, icon: TrendingUp, color: "text-blue-400" },
    { label: "Orders Today", value: stats.ordersToday, icon: ShoppingBag, color: "text-amber-400" },
    { label: "Escalations", value: stats.escalations, icon: AlertTriangle, color: "text-red-400" },
  ];

  const inputClass = "w-full bg-zinc-900/50 border border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 transition-all text-sm outline-none";
  const selectClass = "w-full bg-zinc-900/50 border border-zinc-800 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-white transition-all text-sm outline-none";

  return (
    <div className="flex h-screen bg-[#09090b] overflow-hidden" data-testid="dashboard">
      {/* Sidebar */}
      <aside className={`${sidebarCollapsed ? "w-16" : "w-64"} bg-zinc-950 border-r border-zinc-800/50 flex flex-col shrink-0 transition-all duration-300`} data-testid="dashboard-sidebar">
        <div className={`p-4 border-b border-zinc-800/50 ${sidebarCollapsed ? "px-3" : ""}`}>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shrink-0">
              <MessageCircle size={18} className="text-black" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{client.business_name}</p>
                <p className="text-[10px] text-zinc-500 truncate">{client.email}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1" data-testid="sidebar-nav">
          {navItems.map((item) => {
            const badge = item.id === "conversations" ? notifications.escalations :
                          item.id === "orders" ? notifications.pendingOrders : 0;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === item.id
                    ? "bg-primary/10 text-primary"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                } ${sidebarCollapsed ? "justify-center" : ""}`}
                data-testid={`nav-${item.id}`}
                title={item.label}
              >
                <div className="relative">
                  <item.icon size={18} />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center bg-red-500 text-white text-[9px] font-bold rounded-full px-1 animate-pulse" data-testid={`badge-${item.id}`}>
                      {badge}
                    </span>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
                {!sidebarCollapsed && badge > 0 && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    item.id === "conversations" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"
                  }`} data-testid={`badge-count-${item.id}`}>
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 space-y-2 border-t border-zinc-800/50">
          <button
            onClick={toggleBot}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              client.is_bot_active
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
            data-testid="toggle-bot-btn"
          >
            <Power size={16} />
            {!sidebarCollapsed && (client.is_bot_active ? "Bot Active" : "Bot Paused")}
          </button>
          <button onClick={handleSignOut} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm text-zinc-600 hover:text-zinc-400 hover:bg-zinc-800/50 transition-all" data-testid="logout-btn">
            <LogOut size={16} />
            {!sidebarCollapsed && "Log out"}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Overview */}
        {activeTab === "overview" && (
          <div className="p-6 md:p-8 space-y-8" data-testid="overview-tab">
            <div>
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              <p className="text-sm text-zinc-500 mt-1">Welcome back, {client.business_name}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-stat rounded-2xl p-5 group hover:border-primary/20 transition-all duration-300 relative overflow-hidden"
                  data-testid={`stat-card-${idx}`}
                >
                  <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                  <div className="flex items-start justify-between relative z-10">
                    <div>
                      <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</p>
                      <p className={`text-3xl font-bold mt-2 ${stat.color}`}>{stat.value}</p>
                    </div>
                    <div className={`w-10 h-10 rounded-xl bg-zinc-800/50 flex items-center justify-center ${stat.color}`}>
                      <stat.icon size={18} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Recent Conversations */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-zinc-800/50 flex items-center justify-between">
                <h3 className="font-semibold text-white">Recent Conversations</h3>
                <button onClick={() => setActiveTab("conversations")} className="text-xs text-primary hover:underline" data-testid="view-all-convs">View all</button>
              </div>
              <div className="divide-y divide-zinc-800/30">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-zinc-600 text-sm">No conversations yet</div>
                ) : (
                  conversations.slice(0, 5).map((conv) => {
                    const lastMsg = conv.messages?.[conv.messages.length - 1];
                    return (
                      <div key={conv.id} className="px-5 py-4 hover:bg-zinc-800/20 transition-colors cursor-pointer" onClick={() => { setSelectedConversation(conv); setActiveTab("conversations"); }} data-testid={`recent-conv-${conv.id}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{conv.customer_phone}</p>
                            <p className="text-xs text-zinc-500 truncate mt-0.5">{lastMsg?.content || "No messages"}</p>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              conv.status === "active" ? "bg-primary/10 text-primary" :
                              conv.status === "escalated" ? "bg-red-500/10 text-red-400" :
                              "bg-zinc-800 text-zinc-500"
                            }`}>{conv.status}</span>
                            <span className="text-[10px] text-zinc-600">{conv.updated_at ? new Date(conv.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* Conversations */}
        {activeTab === "conversations" && (
          <div className="flex h-full" data-testid="conversations-tab">
            {/* Conversation List */}
            <div className="w-80 border-r border-zinc-800/50 bg-zinc-950/50 flex flex-col shrink-0">
              <div className="p-4 border-b border-zinc-800/50">
                <h3 className="font-semibold text-white text-sm">Conversations</h3>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-zinc-800/20">
                {conversations.length === 0 ? (
                  <div className="p-6 text-center text-zinc-600 text-xs">No conversations</div>
                ) : (
                  conversations.map((conv) => {
                    const lastMsg = conv.messages?.[conv.messages.length - 1];
                    return (
                      <button
                        key={conv.id}
                        onClick={() => setSelectedConversation(conv)}
                        className={`w-full text-left px-4 py-3.5 hover:bg-zinc-800/30 transition-colors ${
                          selectedConversation?.id === conv.id ? "bg-zinc-800/40 border-l-2 border-primary" : ""
                        }`}
                        data-testid={`conv-item-${conv.id}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium text-white">{conv.customer_phone}</p>
                          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
                            conv.status === "active" ? "bg-primary/10 text-primary" :
                            conv.status === "escalated" ? "bg-red-500/10 text-red-400" :
                            "bg-zinc-800 text-zinc-500"
                          }`}>{conv.status}</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 truncate">{lastMsg?.content || "No messages"}</p>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Chat View */}
            <div className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="px-6 py-3.5 border-b border-zinc-800/50 bg-zinc-950/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-zinc-800 rounded-full flex items-center justify-center">
                        <MessageSquare size={16} className="text-zinc-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{selectedConversation.customer_phone}</p>
                        <p className={`text-[10px] ${selectedConversation.status === "escalated" ? "text-red-400" : "text-primary"}`}>{selectedConversation.status}</p>
                      </div>
                    </div>
                    {selectedConversation.status !== "resolved" && (
                      <button onClick={() => markResolved(selectedConversation.id)} className="text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-all" data-testid="mark-resolved-btn">
                        Mark Resolved
                      </button>
                    )}
                  </div>

                  {/* Escalation Banner */}
                  {selectedConversation.status === "escalated" && (
                    <div className="px-6 py-2.5 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
                      <span className="text-xs font-medium text-red-400 flex items-center gap-2">
                        <AlertTriangle size={14} /> This conversation needs human attention
                      </span>
                    </div>
                  )}

                  {/* Messages - WhatsApp Style */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-3" style={{ background: "radial-gradient(circle at 50% 50%, rgba(24,24,27,0.8) 0%, #09090b 100%)" }} data-testid="chat-messages">
                    {(selectedConversation.messages || []).map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.role === "customer" ? "justify-start" : "justify-end"}`}>
                        <div className={`max-w-[75%] px-4 py-2.5 shadow-lg ${
                          msg.role === "customer"
                            ? "bg-zinc-800 text-white rounded-2xl rounded-tl-sm border border-zinc-700/50"
                            : "bg-primary text-black rounded-2xl rounded-tr-sm"
                        }`} data-testid={`chat-bubble-${idx}`}>
                          <p className="text-sm leading-relaxed">{msg.content}</p>
                          <p className={`text-[10px] mt-1.5 ${msg.role === "customer" ? "text-zinc-500" : "text-black/50"}`}>
                            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center" data-testid="no-conversation-selected">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-zinc-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <MessageSquare size={28} className="text-zinc-600" />
                    </div>
                    <p className="text-zinc-500 text-sm">Select a conversation to view messages</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Orders */}
        {activeTab === "orders" && (
          <div className="p-6 md:p-8 space-y-6" data-testid="orders-tab">
            <h1 className="text-2xl font-bold text-white">Orders</h1>
            <div className="glass-card rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="orders-table">
                  <thead>
                    <tr className="border-b border-zinc-800/50">
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Customer</th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Items</th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Total</th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-5 py-3.5 text-xs font-medium text-zinc-500 uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/20">
                    {orders.length === 0 ? (
                      <tr><td colSpan={5} className="px-5 py-8 text-center text-zinc-600 text-sm">No orders yet</td></tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id} className="hover:bg-zinc-800/20 transition-colors" data-testid={`order-row-${order.id}`}>
                          <td className="px-5 py-4 text-sm text-white">{order.customer_phone}</td>
                          <td className="px-5 py-4 text-sm text-zinc-400">
                            {(order.items || []).map((item, i) => <div key={i}>{item.product_name} x{item.quantity}</div>)}
                          </td>
                          <td className="px-5 py-4 text-sm font-medium text-primary">{order.total?.toLocaleString()} XAF</td>
                          <td className="px-5 py-4">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className="bg-zinc-800 border border-zinc-700 text-white text-xs rounded-lg px-2 py-1.5 outline-none focus:border-primary"
                              data-testid={`order-status-${order.id}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-5 py-4 text-xs text-zinc-500">{order.created_at ? new Date(order.created_at).toLocaleDateString() : ""}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        {activeTab === "products" && (
          <div className="p-6 md:p-8 space-y-6" data-testid="products-tab">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white">Products</h1>
              <button
                onClick={() => setShowProductModal(true)}
                className="inline-flex items-center gap-2 bg-primary text-black font-semibold px-5 py-2.5 rounded-full hover:bg-primary-600 transition-all text-sm"
                data-testid="add-product-btn"
              >
                <Plus size={16} /> Add Product
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.length === 0 ? (
                <div className="col-span-full text-center py-12 text-zinc-600 text-sm">No products yet. Add your first product.</div>
              ) : (
                products.map((product) => (
                  <motion.div
                    key={product.id}
                    layout
                    className="glass-card rounded-2xl p-5 space-y-3 group"
                    data-testid={`product-card-${product.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white">{product.name}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{product.description}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingProduct(product)} className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400" data-testid={`edit-product-${product.id}`}>
                          <Edit2 size={12} />
                        </button>
                        <button onClick={() => deleteProduct(product.id)} className="w-7 h-7 rounded-lg bg-zinc-800 hover:bg-red-500/20 flex items-center justify-center text-zinc-400 hover:text-red-400" data-testid={`delete-product-${product.id}`}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-zinc-800/50">
                      <span className="text-lg font-bold text-primary">{product.price?.toLocaleString()} XAF</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${product.stock > 0 ? "bg-primary/10 text-primary" : "bg-red-500/10 text-red-400"}`}>
                        Stock: {product.stock}
                      </span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Settings */}
        {activeTab === "settings" && client && (
          <div className="p-6 md:p-8 space-y-6 max-w-2xl" data-testid="settings-tab">
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <div className="glass-card rounded-2xl p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Business Name</label>
                <input type="text" defaultValue={client.business_name} onBlur={(e) => updateClient({ business_name: e.target.value })} className={inputClass} data-testid="settings-business-name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Business Description</label>
                <textarea defaultValue={client.business_description} onBlur={(e) => updateClient({ business_description: e.target.value })} rows={3} className={inputClass} data-testid="settings-description" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Location</label>
                <input type="text" defaultValue={client.location} onBlur={(e) => updateClient({ location: e.target.value })} className={inputClass} data-testid="settings-location" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Language</label>
                  <select defaultValue={client.language} onChange={(e) => updateClient({ language: e.target.value })} className={selectClass} data-testid="settings-language">
                    <option value="French">French</option>
                    <option value="English">English</option>
                    <option value="Bilingual">Bilingual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Tone</label>
                  <select defaultValue={client.tone} onChange={(e) => updateClient({ tone: e.target.value })} className={selectClass} data-testid="settings-tone">
                    <option value="Friendly">Friendly</option>
                    <option value="Formal">Formal</option>
                    <option value="Local/Pidgin">Local Pidgin</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Working Hours Start</label>
                  <input type="time" defaultValue={client.working_hours_start} onBlur={(e) => updateClient({ working_hours_start: e.target.value })} className={inputClass} data-testid="settings-hours-start" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Working Hours End</label>
                  <input type="time" defaultValue={client.working_hours_end} onBlur={(e) => updateClient({ working_hours_end: e.target.value })} className={inputClass} data-testid="settings-hours-end" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1.5">Out of Hours Message</label>
                <textarea defaultValue={client.out_of_hours_message} onBlur={(e) => updateClient({ out_of_hours_message: e.target.value })} rows={3} className={inputClass} data-testid="settings-ooh-message" />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showProductModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setShowProductModal(false)}
            data-testid="add-product-modal"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-5">Add New Product</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Name</label>
                  <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} className={inputClass} placeholder="Product name" data-testid="modal-product-name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Price (XAF)</label>
                  <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} className={inputClass} placeholder="5000" data-testid="modal-product-price" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Description</label>
                  <input type="text" value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} className={inputClass} placeholder="Brief description" data-testid="modal-product-desc" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Stock</label>
                  <input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })} className={inputClass} placeholder="100" data-testid="modal-product-stock" />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setShowProductModal(false)} className="flex-1 border border-zinc-700 text-zinc-300 py-2.5 rounded-full hover:bg-zinc-800/50 transition-all text-sm font-medium" data-testid="modal-cancel-btn">Cancel</button>
                <button onClick={addProduct} className="flex-1 bg-primary text-black py-2.5 rounded-full hover:bg-primary-600 transition-all text-sm font-semibold" data-testid="modal-add-btn">Add Product</button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Edit Product Modal */}
        {editingProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4"
            onClick={() => setEditingProduct(null)}
            data-testid="edit-product-modal"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card rounded-2xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-white mb-5">Edit Product</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Name</label>
                  <input type="text" defaultValue={editingProduct.name} onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })} className={inputClass} data-testid="edit-product-name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Price (XAF)</label>
                  <input type="number" defaultValue={editingProduct.price} onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })} className={inputClass} data-testid="edit-product-price" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Description</label>
                  <input type="text" defaultValue={editingProduct.description} onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })} className={inputClass} data-testid="edit-product-description" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1.5">Stock</label>
                  <input type="number" defaultValue={editingProduct.stock} onChange={(e) => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })} className={inputClass} data-testid="edit-product-stock" />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setEditingProduct(null)} className="flex-1 border border-zinc-700 text-zinc-300 py-2.5 rounded-full hover:bg-zinc-800/50 transition-all text-sm font-medium" data-testid="edit-cancel-btn">Cancel</button>
                <button
                  onClick={() => updateProduct(editingProduct.id, { name: editingProduct.name, price: editingProduct.price, description: editingProduct.description, stock: editingProduct.stock })}
                  className="flex-1 bg-primary text-black py-2.5 rounded-full hover:bg-primary-600 transition-all text-sm font-semibold"
                  data-testid="edit-save-btn"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
