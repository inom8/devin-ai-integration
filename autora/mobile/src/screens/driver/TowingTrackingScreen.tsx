import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { towingApi } from "../../services/api";
import {
  connectTowingSocket,
  joinRequest,
  onLocationUpdate,
  onDriverEnRoute,
  onDriverArrived,
  disconnectTowingSocket,
} from "../../services/socket";
import { TowingRequest } from "../../types";

interface TowingTrackingScreenProps {
  route: { params: { requestId: string } };
}

const STATUS_LABELS: Record<string, string> = {
  REQUESTED: "Looking for a driver...",
  ACCEPTED: "Driver assigned!",
  EN_ROUTE: "Driver is on the way!",
  ARRIVED: "Driver has arrived!",
  COMPLETED: "Towing complete",
  CANCELLED: "Request cancelled",
};

export default function TowingTrackingScreen({ route }: TowingTrackingScreenProps) {
  const [request, setRequest] = useState<TowingRequest | null>(null);
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await towingApi.getById(route.params.requestId);
        setRequest(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();

    const socket = connectTowingSocket();
    joinRequest(route.params.requestId);

    onLocationUpdate((data) => {
      setDriverLocation({ lat: data.lat, lng: data.lng });
    });

    onDriverEnRoute(() => {
      setRequest((prev) => (prev ? { ...prev, status: "EN_ROUTE" } : null));
    });

    onDriverArrived(() => {
      setRequest((prev) => (prev ? { ...prev, status: "ARRIVED" } : null));
    });

    return () => {
      disconnectTowingSocket();
    };
  }, [route.params.requestId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>
          {driverLocation
            ? `Driver at: ${driverLocation.lat.toFixed(4)}, ${driverLocation.lng.toFixed(4)}`
            : "Map view - waiting for driver location"}
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <Text style={styles.statusLabel}>
          {request ? STATUS_LABELS[request.status] || request.status : "Loading..."}
        </Text>

        {request?.estimatedArrival && (
          <Text style={styles.eta}>
            ETA: {new Date(request.estimatedArrival).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        )}

        <View style={styles.statusSteps}>
          {["REQUESTED", "ACCEPTED", "EN_ROUTE", "ARRIVED", "COMPLETED"].map(
            (step, idx) => {
              const statuses = ["REQUESTED", "ACCEPTED", "EN_ROUTE", "ARRIVED", "COMPLETED"];
              const currentIdx = request
                ? statuses.indexOf(request.status)
                : -1;
              const isActive = idx <= currentIdx;
              return (
                <View key={step} style={styles.stepRow}>
                  <View
                    style={[
                      styles.stepDot,
                      isActive && styles.stepDotActive,
                    ]}
                  />
                  <Text
                    style={[
                      styles.stepText,
                      isActive && styles.stepTextActive,
                    ]}
                  >
                    {step.replace("_", " ")}
                  </Text>
                </View>
              );
            }
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  mapPlaceholder: {
    height: 300,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  mapText: { color: "#666", fontSize: 16 },
  statusContainer: { padding: 20 },
  statusLabel: { fontSize: 22, fontWeight: "bold", color: "#333", textAlign: "center" },
  eta: { fontSize: 16, color: "#1a73e8", textAlign: "center", marginTop: 8 },
  statusSteps: { marginTop: 24 },
  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  stepDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ddd",
    marginRight: 12,
  },
  stepDotActive: { backgroundColor: "#10b981" },
  stepText: { fontSize: 15, color: "#999" },
  stepTextActive: { color: "#333", fontWeight: "600" },
});
