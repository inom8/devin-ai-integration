import { useState } from "react";

interface TowingRequest {
  id: string;
  pickupAddress: string | null;
  status: string;
  createdAt: string;
  towingProvider?: { user: { name: string } };
}

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: "#f59e0b",
  ACCEPTED: "#3b82f6",
  EN_ROUTE: "#8b5cf6",
  ARRIVED: "#10b981",
  COMPLETED: "#059669",
  CANCELLED: "#ef4444",
};

export default function TowingManagement() {
  const [requests] = useState<TowingRequest[]>([]);

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24 }}>Towing Management</h2>
      <table style={{ width: "100%", backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" }}>
        <thead>
          <tr style={{ backgroundColor: "#f8fafc" }}>
            <th style={thStyle}>Pickup Location</th>
            <th style={thStyle}>Driver</th>
            <th style={thStyle}>Status</th>
            <th style={thStyle}>Created</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan={4} style={{ ...tdStyle, textAlign: "center", color: "#94a3b8" }}>
                No active towing requests
              </td>
            </tr>
          ) : (
            requests.map((r) => (
              <tr key={r.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={tdStyle}>{r.pickupAddress || "Unknown"}</td>
                <td style={tdStyle}>{r.towingProvider?.user.name || "Unassigned"}</td>
                <td style={tdStyle}>
                  <span
                    style={{
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#fff",
                      backgroundColor: STATUS_COLORS[r.status] || "#94a3b8",
                    }}
                  >
                    {r.status}
                  </span>
                </td>
                <td style={tdStyle}>{new Date(r.createdAt).toLocaleString()}</td>
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
