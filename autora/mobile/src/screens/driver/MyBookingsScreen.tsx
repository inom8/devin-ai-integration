import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { bookingApi } from "../../services/api";
import { Booking } from "../../types";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  CONFIRMED: "#3b82f6",
  IN_PROGRESS: "#8b5cf6",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};

export default function MyBookingsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string | undefined>();

  const loadBookings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bookingApi.list(filter);
      setBookings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Bookings</Text>

      <FlatList
        horizontal
        data={["All", "PENDING", "CONFIRMED", "COMPLETED"]}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.filterChip,
              (item === "All" ? !filter : filter === item) &&
                styles.filterChipActive,
            ]}
            onPress={() => setFilter(item === "All" ? undefined : item)}
          >
            <Text
              style={[
                styles.filterText,
                (item === "All" ? !filter : filter === item) &&
                  styles.filterTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.filters}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#1a73e8" style={styles.loader} />
      ) : (
        <FlatList
          data={bookings}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.providerName}>
                  {item.provider?.user?.name || "Provider"}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: STATUS_COLORS[item.status] || "#999" },
                  ]}
                >
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.service}>
                {item.providerService?.category?.name || "Service"}
              </Text>
              <Text style={styles.date}>
                {new Date(item.scheduledAt).toLocaleDateString()} at{" "}
                {new Date(item.scheduledAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
              <Text style={styles.price}>
                {item.totalPrice.toLocaleString()} UZS
              </Text>
            </View>
          )}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <Text style={styles.empty}>No bookings found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  header: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 12 },
  filters: { marginBottom: 12, maxHeight: 44 },
  filterChip: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  filterChipActive: { backgroundColor: "#1a73e8", borderColor: "#1a73e8" },
  filterText: { fontSize: 13, color: "#666" },
  filterTextActive: { color: "#fff", fontWeight: "600" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  providerName: { fontSize: 16, fontWeight: "bold", color: "#333" },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "600" },
  service: { fontSize: 14, color: "#1a73e8", marginTop: 4 },
  date: { fontSize: 13, color: "#666", marginTop: 4 },
  price: { fontSize: 15, fontWeight: "bold", color: "#333", marginTop: 4 },
  loader: { marginTop: 40 },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});
