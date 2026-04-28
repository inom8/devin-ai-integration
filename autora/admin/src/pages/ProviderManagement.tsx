import { useEffect, useState } from "react";
import api from "../services/api";

interface Provider {
  id: string;
  businessName: string;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  address?: string;
  user: { name: string; phone: string };
}

export default function ProviderManagement() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/providers");
        setProviders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const toggleVerify = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/providers/${id}`, { isVerified: !currentStatus });
      setProviders((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isVerified: !currentStatus } : p))
      );
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24 }}>Provider Management</h2>
      <table style={{ width: "100%", backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" }}>
        <thead>
          <tr style={{ backgroundColor: "#f8fafc" }}>
            <th style={thStyle}>Business Name</th>
            <th style={thStyle}>Owner</th>
            <th style={thStyle}>Rating</th>
            <th style={thStyle}>Reviews</th>
            <th style={thStyle}>Verified</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {providers.map((p) => (
            <tr key={p.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
              <td style={tdStyle}>{p.businessName}</td>
              <td style={tdStyle}>{p.user?.name || "N/A"}</td>
              <td style={tdStyle}>{p.rating.toFixed(1)}</td>
              <td style={tdStyle}>{p.reviewCount}</td>
              <td style={tdStyle}>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 600,
                    backgroundColor: p.isVerified ? "#dcfce7" : "#fee2e2",
                    color: p.isVerified ? "#16a34a" : "#dc2626",
                  }}
                >
                  {p.isVerified ? "Verified" : "Pending"}
                </span>
              </td>
              <td style={tdStyle}>
                <button
                  onClick={() => toggleVerify(p.id, p.isVerified)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    backgroundColor: p.isVerified ? "#fee2e2" : "#dcfce7",
                    color: p.isVerified ? "#dc2626" : "#16a34a",
                    cursor: "pointer",
                    fontWeight: 600,
                    fontSize: 13,
                  }}
                >
                  {p.isVerified ? "Revoke" : "Verify"}
                </button>
              </td>
            </tr>
          ))}
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
