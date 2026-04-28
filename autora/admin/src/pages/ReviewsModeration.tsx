import { useEffect, useState } from "react";
import api from "../services/api";

interface Review {
  id: string;
  targetType: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string };
}

export default function ReviewsModeration() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get("/reviews");
        setReviews(res.data);
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
      <h2 style={{ fontSize: 24, fontWeight: "bold", marginBottom: 24 }}>Reviews Moderation</h2>
      <div style={{ display: "grid", gap: 12 }}>
        {reviews.length === 0 ? (
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              padding: 24,
              textAlign: "center",
              color: "#94a3b8",
            }}
          >
            No reviews to moderate
          </div>
        ) : (
          reviews.map((r) => (
            <div
              key={r.id}
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 16,
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong>{r.user?.name || "Anonymous"}</strong>
                  <span style={{ marginLeft: 8, color: "#d97706" }}>
                    {"★".repeat(r.rating)}
                  </span>
                </div>
                <span style={{ fontSize: 12, color: "#94a3b8" }}>
                  {r.targetType.replace("_", " ")} · {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
              {r.comment && (
                <p style={{ marginTop: 8, color: "#475569", fontSize: 14 }}>{r.comment}</p>
              )}
              <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
                <button
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: "none",
                    backgroundColor: "#fee2e2",
                    color: "#dc2626",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Flag
                </button>
                <button
                  style={{
                    padding: "4px 12px",
                    borderRadius: 6,
                    border: "none",
                    backgroundColor: "#fef3c7",
                    color: "#d97706",
                    cursor: "pointer",
                    fontSize: 13,
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
