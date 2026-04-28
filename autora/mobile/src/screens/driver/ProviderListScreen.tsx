import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { providerApi } from "../../services/api";
import { ServiceProvider } from "../../types";

interface ProviderListScreenProps {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
  route: { params?: { category?: string } };
}

export default function ProviderListScreen({ navigation, route }: ProviderListScreenProps) {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const category = route.params?.category;

  useEffect(() => {
    const load = async () => {
      try {
        const params: Record<string, string> = {};
        if (category) params.category = category;
        const res = await providerApi.list(params);
        setProviders(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [category]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={providers}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("ProviderDetail", { id: item.id })}
          >
            <Text style={styles.name}>{item.businessName}</Text>
            <Text style={styles.rating}>{"★"} {item.rating.toFixed(1)} ({item.reviewCount} reviews)</Text>
            {item.address && <Text style={styles.address}>{item.address}</Text>}
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No providers found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  name: { fontSize: 18, fontWeight: "bold", color: "#333" },
  rating: { fontSize: 14, color: "#d97706", marginTop: 4 },
  address: { fontSize: 14, color: "#666", marginTop: 4 },
  empty: { textAlign: "center", color: "#999", marginTop: 40 },
});
