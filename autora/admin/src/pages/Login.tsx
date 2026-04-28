import { useState } from "react";
import type { FormEvent } from "react";
import api from "../services/api";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/send-otp", { phone });
      setStep("otp");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to send OTP"
          : "Failed to send OTP";
      setError(typeof message === "string" ? message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", { phone, code });
      const { token, user } = res.data;
      if (user.role !== "ADMIN") {
        setError("Access denied. Admin role required.");
        return;
      }
      localStorage.setItem("admin_token", token);
      window.location.href = "/";
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Invalid OTP"
          : "Invalid OTP";
      setError(typeof message === "string" ? message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f1f5f9",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          padding: 40,
          width: 400,
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 8, textAlign: "center" }}>
          Autora Admin
        </h1>
        <p style={{ color: "#64748b", textAlign: "center", marginBottom: 32, fontSize: 14 }}>
          Sign in to the admin dashboard
        </p>

        {error && (
          <div
            style={{
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              padding: "10px 14px",
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        {step === "phone" ? (
          <form onSubmit={handleSendOtp}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="+998901234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 16,
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              disabled={loading || !phone.trim()}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "none",
                backgroundColor: loading ? "#94a3b8" : "#1e293b",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "default" : "pointer",
              }}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <p style={{ fontSize: 14, color: "#475569", marginBottom: 16 }}>
              OTP sent to <strong>{phone}</strong>
            </p>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
              Verification Code
            </label>
            <input
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 20,
                letterSpacing: 8,
                textAlign: "center",
                marginBottom: 16,
                boxSizing: "border-box",
              }}
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                border: "none",
                backgroundColor: loading ? "#94a3b8" : "#1e293b",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: loading ? "default" : "pointer",
                marginBottom: 12,
              }}
            >
              {loading ? "Verifying..." : "Verify & Sign In"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setError("");
              }}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                backgroundColor: "transparent",
                color: "#64748b",
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              ← Change phone number
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
