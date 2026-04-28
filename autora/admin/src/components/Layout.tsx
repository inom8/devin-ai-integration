import { Link, Outlet, useLocation } from "react-router-dom";
import { logout } from "../services/api";

const NAV_ITEMS = [
  { path: "/", label: "Dashboard" },
  { path: "/providers", label: "Providers" },
  { path: "/users", label: "Users" },
  { path: "/bookings", label: "Bookings" },
  { path: "/towing", label: "Towing" },
  { path: "/reviews", label: "Reviews" },
  { path: "/categories", label: "Categories" },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <nav
        style={{
          width: 240,
          backgroundColor: "#1e293b",
          color: "#fff",
          padding: "20px 0",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "0 20px", marginBottom: 32 }}>
          <h1 style={{ fontSize: 24, fontWeight: "bold" }}>Autora Admin</h1>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, flex: 1 }}>
          {NAV_ITEMS.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                style={{
                  display: "block",
                  padding: "12px 20px",
                  color: location.pathname === item.path ? "#fff" : "#94a3b8",
                  backgroundColor:
                    location.pathname === item.path
                      ? "rgba(255,255,255,0.1)"
                      : "transparent",
                  textDecoration: "none",
                  fontSize: 15,
                  fontWeight: location.pathname === item.path ? 600 : 400,
                }}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button
            onClick={logout}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.2)",
              backgroundColor: "transparent",
              color: "#94a3b8",
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main style={{ flex: 1, backgroundColor: "#f1f5f9", padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}
