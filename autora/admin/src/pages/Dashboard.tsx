import { useEffect, useState } from "react";
import api from "../services/api";

interface Stats {
  totalUsers: number;
  totalProviders: number;
  totalBookings: number;
  activeTowing: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalProviders: 0,
    totalBookings: 0,
    activeTowing: 0,
  });

  useEffect(() => {
    // Placeholder - in production, call a stats endpoint
    const fetchStats = async () => {
      try {
        const [providers, bookings] = await Promise.all([
          api.get("/providers").catch(() => ({ data: [] })),
          api.get("/bookings").catch(() => ({ data: [] })),
        ]);
        setStats({
          totalUsers: 0,
          totalProviders: Array.isArray(providers.data) ? providers.data.length : 0,
          totalBookings: Array.isArray(bookings.data) ? bookings.data.length : 0,
          activeTowing: 0,
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.totalUsers, color: "#3b82f6" },
    { label: "Providers", value: stats.totalProviders, color: "#10b981" },
    { label: "Bookings", value: stats.totalBookings, color: "#f59e0b" },
    { label: "Active Towing", value: stats.activeTowing, color: "#ef4444" },
  ];

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24 }}>Dashboard</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        {cards.map((card) => (
          <div
            key={card.label}
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 24,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>{card.label}</div>
            <div style={{ fontSize: 32, fontWeight: "bold", color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
