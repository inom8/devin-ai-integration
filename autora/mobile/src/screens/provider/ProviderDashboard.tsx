import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { bookingApi } from "../../services/api";
import { Booking } from "../../types";

export default function ProviderDashboard() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      const res = await bookingApi.list("PENDING");
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await bookingApi.updateStatus(id, "CONFIRMED");
      Alert.alert("Success", "Booking confirmed");
      loadBookings();
    } catch {
      Alert.alert("Error", "Failed to confirm booking");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Provider Dashboard</Text>
      <Text style={styles.subtitle}>Incoming Bookings</Text>

      <FlatList
        data={bookings}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.serviceName}>
              {item.providerService?.category?.name || "Service"}
            </Text>
            <Text style={styles.dateText}>
              {new Date(item.scheduledAt).toLocaleDateString()} at{" "}
              {new Date(item.scheduledAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
            {item.notes && <Text style={styles.notes}>{item.notes}</Text>}
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => handleConfirm(item.id)}
            >
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No incoming bookings</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 4 },
  subtitle: { fontSize: 16, color: "#666", marginBottom: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  serviceName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  dateText: { fontSize: 14, color: "#666", marginTop: 4 },
  notes: { fontSize: 13, color: "#888", marginTop: 4, fontStyle: "italic" },
  confirmBtn: {
    backgroundColor: "#10b981",
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
    marginTop: 12,
  },
  confirmText: { color: "#fff", fontWeight: "600" },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});
