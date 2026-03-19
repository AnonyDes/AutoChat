import { useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, ShoppingBag, Package } from "lucide-react";

const COLORS = ["#25D366", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 shadow-xl">
      <p className="text-xs text-zinc-400 mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
};

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function formatDay(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function Analytics({ conversations, orders, products }) {
  const messagesPerDay = useMemo(() => {
    const days = getLast7Days();
    const counts = {};
    days.forEach((d) => (counts[d] = 0));

    (conversations || []).forEach((conv) => {
      (conv.messages || []).forEach((msg) => {
        if (msg.timestamp) {
          const day = msg.timestamp.split("T")[0];
          if (counts[day] !== undefined) counts[day]++;
        }
      });
    });

    return days.map((d) => ({ date: formatDay(d), messages: counts[d] }));
  }, [conversations]);

  const ordersPerDay = useMemo(() => {
    const days = getLast7Days();
    const counts = {};
    days.forEach((d) => (counts[d] = 0));

    (orders || []).forEach((order) => {
      if (order.created_at) {
        const day = order.created_at.split("T")[0];
        if (counts[day] !== undefined) counts[day]++;
      }
    });

    return days.map((d) => ({ date: formatDay(d), orders: counts[d] }));
  }, [orders]);

  const topProducts = useMemo(() => {
    const productCounts = {};

    (orders || []).forEach((order) => {
      (order.items || []).forEach((item) => {
        const name = item.product_name || "Unknown";
        productCounts[name] = (productCounts[name] || 0) + (item.quantity || 1);
      });
    });

    const sorted = Object.entries(productCounts)
      .map(([name, qty]) => ({ name, value: qty }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    if (sorted.length === 0) {
      // Show product catalog as placeholder
      return (products || []).slice(0, 5).map((p) => ({
        name: p.name,
        value: p.stock || 0,
      }));
    }
    return sorted;
  }, [orders, products]);

  const totalMessages = messagesPerDay.reduce((acc, d) => acc + d.messages, 0);
  const totalOrders = ordersPerDay.reduce((acc, d) => acc + d.orders, 0);
  const topProduct = topProducts[0]?.name || "N/A";

  return (
    <div className="space-y-6" data-testid="analytics-section">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-stat rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Messages (7d)</p>
              <p className="text-2xl font-bold text-primary">{totalMessages}</p>
            </div>
          </div>
        </div>
        <div className="glass-stat rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center">
              <ShoppingBag size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Orders (7d)</p>
              <p className="text-2xl font-bold text-blue-400">{totalOrders}</p>
            </div>
          </div>
        </div>
        <div className="glass-stat rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/10 flex items-center justify-center">
              <Package size={18} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Top Product</p>
              <p className="text-lg font-bold text-amber-400 truncate">{topProduct}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages per Day - Line Chart */}
        <div className="glass-card rounded-2xl p-6" data-testid="messages-chart">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" /> Messages per Day
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={messagesPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={{ stroke: "#27272a" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={{ stroke: "#27272a" }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="messages"
                  stroke="#25D366"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#25D366", stroke: "#09090b", strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: "#25D366" }}
                  name="Messages"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders per Day - Bar Chart */}
        <div className="glass-card rounded-2xl p-6" data-testid="orders-chart">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <ShoppingBag size={16} className="text-blue-400" /> Orders per Day
          </h3>
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ordersPerDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={{ stroke: "#27272a" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#71717a", fontSize: 11 }}
                  axisLine={{ stroke: "#27272a" }}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="orders"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  name="Orders"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products - Pie Chart */}
      <div className="glass-card rounded-2xl p-6" data-testid="products-chart">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Package size={16} className="text-amber-400" /> {orders?.length > 0 ? "Top Products Ordered" : "Product Catalog (Stock)"}
        </h3>
        <div className="flex items-center gap-8">
          <div className="h-[240px] w-[240px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={topProducts}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {topProducts.map((_, idx) => (
                    <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {topProducts.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 text-sm">
                <div className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                <span className="text-zinc-300 truncate flex-1">{item.name}</span>
                <span className="text-zinc-500 font-medium">{item.value}</span>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-zinc-600 text-xs">No data available</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
