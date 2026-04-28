import { useState } from "react";

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  createdAt: string;
}

export default function UserManagement() {
  const [users] = useState<User[]>([]);
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      !search ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search)
  );

  return (
    <div>
      <h2 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24 }}>User Management</h2>
      <input
        type="text"
        placeholder="Search by name or phone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          padding: "10px 16px",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          width: 320,
          marginBottom: 16,
          fontSize: 14,
        }}
      />
      <table style={{ width: "100%", backgroundColor: "#fff", borderRadius: 12, overflow: "hidden" }}>
        <thead>
          <tr style={{ backgroundColor: "#f8fafc" }}>
            <th style={thStyle}>Name</th>
            <th style={thStyle}>Phone</th>
            <th style={thStyle}>Role</th>
            <th style={thStyle}>Joined</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ ...tdStyle, textAlign: "center", color: "#94a3b8" }}>
                No users found. Users will appear here once the API is connected.
              </td>
            </tr>
          ) : (
            filtered.map((u) => (
              <tr key={u.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                <td style={tdStyle}>{u.name || "—"}</td>
                <td style={tdStyle}>{u.phone}</td>
                <td style={tdStyle}>{u.role}</td>
                <td style={tdStyle}>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td style={tdStyle}>
                  <button
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "none",
                      backgroundColor: "#f1f5f9",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                  >
                    View
                  </button>
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
