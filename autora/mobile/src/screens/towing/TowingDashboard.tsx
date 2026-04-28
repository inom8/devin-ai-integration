import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Switch,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import { towingApi } from "../../services/api";
import {
  connectTowingSocket,
  emitLocationUpdate,
  disconnectTowingSocket,
} from "../../services/socket";

interface IncomingRequest {
  id: string;
  pickupAddress: string | null;
  pickupLat: number;
  pickupLng: number;
  status: string;
}

export default function TowingDashboard() {
  const [isAvailable, setIsAvailable] = useState(true);
  const [requests, setRequests] = useState<IncomingRequest[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const locationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (locationInterval.current) clearInterval(locationInterval.current);
      disconnectTowingSocket();
    };
  }, []);

  const startLocationTracking = (requestId: string) => {
    connectTowingSocket();
    locationInterval.current = setInterval(async () => {
      try {
        const loc = await Location.getCurrentPositionAsync({});
        emitLocationUpdate(requestId, loc.coords.latitude, loc.coords.longitude);
      } catch (err) {
        console.error("Location error:", err);
      }
    }, 5000);
  };

  const handleAccept = async (requestId: string) => {
    try {
      await towingApi.accept(requestId);
      setActiveJobId(requestId);
      startLocationTracking(requestId);
      Alert.alert("Accepted", "Navigate to pickup location");
    } catch {
      Alert.alert("Error", "Failed to accept request");
    }
  };

  const handleStatusUpdate = async (status: string) => {
    if (!activeJobId) return;
    try {
      await towingApi.updateStatus(activeJobId, status);
      if (status === "COMPLETED") {
        if (locationInterval.current) clearInterval(locationInterval.current);
        disconnectTowingSocket();
        setActiveJobId(null);
        Alert.alert("Complete", "Job completed successfully!");
      }
    } catch {
      Alert.alert("Error", "Failed to update status");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Towing Dashboard</Text>

      <View style={styles.availabilityRow}>
        <Text style={styles.availabilityLabel}>Available for jobs</Text>
        <Switch
          value={isAvailable}
          onValueChange={setIsAvailable}
          trackColor={{ true: "#10b981" }}
        />
      </View>

      {activeJobId ? (
        <View style={styles.activeJob}>
          <Text style={styles.activeJobTitle}>Active Job</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#3b82f6" }]}
              onPress={() => handleStatusUpdate("EN_ROUTE")}
            >
              <Text style={styles.actionText}>En Route</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#f59e0b" }]}
              onPress={() => handleStatusUpdate("ARRIVED")}
            >
              <Text style={styles.actionText}>Arrived</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: "#10b981" }]}
              onPress={() => handleStatusUpdate("COMPLETED")}
            >
              <Text style={styles.actionText}>Complete</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Incoming Requests</Text>
          <FlatList
            data={requests}
            renderItem={({ item }) => (
              <View style={styles.requestCard}>
                <Text style={styles.requestAddress}>
                  {item.pickupAddress || `${item.pickupLat.toFixed(4)}, ${item.pickupLng.toFixed(4)}`}
                </Text>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => handleAccept(item.id)}
                >
                  <Text style={styles.acceptText}>Accept</Text>
                </TouchableOpacity>
              </View>
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.empty}>
                {isAvailable ? "Waiting for requests..." : "You are offline"}
              </Text>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  header: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 16 },
  availabilityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  availabilityLabel: { fontSize: 16, fontWeight: "600", color: "#333" },
  activeJob: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  activeJobTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 12 },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1, borderRadius: 8, padding: 12, alignItems: "center" },
  actionText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 8 },
  requestCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  requestAddress: { fontSize: 14, color: "#333", flex: 1 },
  acceptBtn: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  acceptText: { color: "#fff", fontWeight: "600" },
  empty: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 16 },
});
