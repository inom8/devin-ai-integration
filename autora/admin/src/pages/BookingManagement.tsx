import { useEffect, useState } from "react";
import api from "../services/api";

interface Booking {
  id: string;
  status: string;
  scheduledAt: string;
  totalPrice: number;
  createdAt: string;
  provider?: { businessName: string };
  providerService?: { category?: { name: string } };
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  IN_PROGRESS: "#8b5cf6",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};

export default function BookingManagement() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/admin/bookings");
        setBookings(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24 }}>Booking Management</h2>
      <table style={{ width: "100%", backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" }}>
        <thead>
          <tr style={{ backgroundColor: "#f8fafc" }}>
            <th style={thStyle}>Service</th>
            <th style={thStyle}>Provider</th>
            <th style={thStyle}>Scheduled</th>
            <th style={thStyle}>Price</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#94a3b8" }}>
                No bookings yet
              </td>
            </tr>
          ) : (
            bookings.map((b) => (
              <tr key={b.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={tdStyle}>{b.providerService?.category?.name || "—"}</td>
                <td style={tdStyle}>{b.provider?.businessName || "—"}</td>
                <td style={tdStyle}>{new Date(b.scheduledAt).toLocaleString()}</td>
                <td style={tdStyle}>{b.totalPrice.toLocaleString()} UZS</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#fff",
                      backgroundColor: STATUS_COLORS[b.status] || "#94a3b8",
                    }}
                  >
                    {b.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: 13,
  fontWeight: 600,
  color: "#64748b",
};

const tdStyle: React.CSSProperties = {
  padding: "12px 16px",
  fontSize: 14,
};
