import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  FlatList,
} from "react-native";
import * as Location from "expo-location";
import { towingApi } from "../../services/api";

interface TowingRequestScreenProps {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

interface NearbyTruck {
  id: string;
  vehicleType: string;
  plateNumber: string;
  distance: number;
  user: { name: string; phone: string };
}

export default function TowingRequestScreen({ navigation }: TowingRequestScreenProps) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearbyTrucks, setNearbyTrucks] = useState<NearbyTruck[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const getLocation = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Denied", "Location permission is required");
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({});
      const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
      setLocation(coords);

      try {
        const res = await towingApi.nearby(coords.lat, coords.lng);
        setNearbyTrucks(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    getLocation();
  }, []);

  const handleRequest = async () => {
    if (!location) return;
    setRequesting(true);
    try {
      const res = await towingApi.request({
        pickupLat: location.lat,
        pickupLng: location.lng,
        pickupAddress: "Current location",
      });
      Alert.alert("Success", "Towing request sent!");
      navigation.navigate("TowingTracking", { requestId: res.data.id });
    } catch {
      Alert.alert("Error", "Failed to send towing request");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e53e3e" />
        <Text style={styles.loadingText}>Finding nearby towing trucks...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.sosContainer}>
        <TouchableOpacity
          style={styles.sosButton}
          onPress={handleRequest}
          disabled={requesting}
        >
          {requesting ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <>
              <Text style={styles.sosIcon}>🚗</Text>
              <Text style={styles.sosText}>I Need a Tow</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>
        Nearby Towing Trucks ({nearbyTrucks.length})
      </Text>

      <FlatList
        data={nearbyTrucks}
        renderItem={({ item }) => (
          <View style={styles.truckCard}>
            <View>
              <Text style={styles.truckName}>{item.user.name}</Text>
              <Text style={styles.truckInfo}>
                {item.vehicleType} · {item.plateNumber}
              </Text>
            </View>
            <Text style={styles.distance}>{item.distance} km</Text>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No towing trucks nearby</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 16 },
  sosContainer: { alignItems: "center", paddingVertical: 32 },
  sosButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#e53e3e",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#e53e3e",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  sosIcon: { fontSize: 40 },
  sosText: { color: "#fff", fontSize: 16, fontWeight: "bold", marginTop: 4 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  truckCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  truckName: { fontSize: 16, fontWeight: "600", color: "#333" },
  truckInfo: { fontSize: 13, color: "#666", marginTop: 2 },
  distance: { fontSize: 16, fontWeight: "bold", color: "#1a73e8" },
  empty: { textAlign: "center", color: "#999", marginTop: 20 },
});
