import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { towingApi } from "../../services/api";
import { TowingRequest } from "../../types";

interface TowingJobScreenProps {
  route: { params: { requestId: string } };
  navigation: { goBack: () => void };
}

export default function TowingJobScreen({ route, navigation }: TowingJobScreenProps) {
  const [request, setRequest] = useState<TowingRequest | null>(null);
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
  }, [route.params.requestId]);

  const updateStatus = async (status: string) => {
    try {
      const res = await towingApi.updateStatus(route.params.requestId, status);
      setRequest(res.data);
      if (status === "COMPLETED") {
        Alert.alert("Complete", "Job completed!", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      }
    } catch {
      Alert.alert("Error", "Failed to update status");
    }
  };

  if (loading || !request) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>Navigation Map</Text>
        <Text style={styles.coords}>
          Pickup: {request.pickupLat.toFixed(4)}, {request.pickupLng.toFixed(4)}
        </Text>
      </View>

      <View style={styles.details}>
        <Text style={styles.status}>Status: {request.status.replace("_", " ")}</Text>
        {request.pickupAddress && (
          <Text style={styles.address}>Pickup: {request.pickupAddress}</Text>
        )}
        {request.dropoffAddress && (
          <Text style={styles.address}>Dropoff: {request.dropoffAddress}</Text>
        )}
      </View>

      <View style={styles.actions}>
        {request.status === "ACCEPTED" && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#3b82f6" }]}
            onPress={() => updateStatus("EN_ROUTE")}
          >
            <Text style={styles.btnText}>Start Driving</Text>
          </TouchableOpacity>
        )}
        {request.status === "EN_ROUTE" && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#f59e0b" }]}
            onPress={() => updateStatus("ARRIVED")}
          >
            <Text style={styles.btnText}>I Have Arrived</Text>
          </TouchableOpacity>
        )}
        {request.status === "ARRIVED" && (
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#10b981" }]}
            onPress={() => updateStatus("COMPLETED")}
          >
            <Text style={styles.btnText}>Complete Job</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  mapPlaceholder: {
    height: 250,
    backgroundColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  mapText: { fontSize: 18, color: "#666" },
  coords: { fontSize: 14, color: "#888", marginTop: 4 },
  details: { padding: 16 },
  status: { fontSize: 18, fontWeight: "bold", color: "#333" },
  address: { fontSize: 14, color: "#666", marginTop: 4 },
  actions: { padding: 16, gap: 8 },
  btn: { borderRadius: 12, padding: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
