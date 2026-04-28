import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { providerApi } from "../../services/api";
import { ServiceProvider } from "../../types";

interface HomeScreenProps {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
}

const CATEGORIES = [
  "All",
  "Oil Change",
  "Diagnostics",
  "Maintenance",
  "Tire Repair",
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, [selectedCategory]);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedCategory !== "All") params.category = selectedCategory;
      const res = await providerApi.list(params);
      setProviders(res.data);
    } catch (err) {
      console.error("Failed to load providers:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredProviders = providers.filter(
    (p) =>
      !search ||
      p.businessName.toLowerCase().includes(search.toLowerCase())
  );

  const renderProvider = ({ item }: { item: ServiceProvider }) => (
    <TouchableOpacity
      style={styles.providerCard}
      onPress={() => navigation.navigate("ProviderDetail", { id: item.id })}
    >
      <View style={styles.providerHeader}>
        <Text style={styles.providerName}>{item.businessName}</Text>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>
            {"★"} {item.rating.toFixed(1)}
          </Text>
        </View>
      </View>
      {item.address && <Text style={styles.providerAddress}>{item.address}</Text>}
      <Text style={styles.providerServices}>
        {item.services?.map((s) => s.category.name).join(" · ") || "No services listed"}
      </Text>
      <Text style={styles.reviewCount}>{item.reviewCount} reviews</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Find Auto Services</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Search providers..."
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        horizontal
        data={CATEGORIES}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === item && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(item)}
          >
            <Text
              style={[
                styles.categoryText,
                selectedCategory === item && styles.categoryTextActive,
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        style={styles.categories}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#1a73e8" style={styles.loader} />
      ) : (
        <FlatList
          data={filteredProviders}
          renderItem={renderProvider}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No providers found</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", paddingHorizontal: 16 },
  header: { fontSize: 24, fontWeight: "bold", marginTop: 16, marginBottom: 16, color: "#333" },
  searchInput: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  categories: { marginBottom: 12, maxHeight: 44 },
  categoryChip: {
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  categoryChipActive: { backgroundColor: "#1a73e8", borderColor: "#1a73e8" },
  categoryText: { fontSize: 14, color: "#666" },
  categoryTextActive: { color: "#fff", fontWeight: "600" },
  providerCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  providerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  providerName: { fontSize: 18, fontWeight: "bold", color: "#333", flex: 1 },
  ratingBadge: {
    backgroundColor: "#fef3c7",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  ratingText: { fontSize: 14, color: "#d97706", fontWeight: "600" },
  providerAddress: { fontSize: 14, color: "#666", marginTop: 4 },
  providerServices: { fontSize: 13, color: "#1a73e8", marginTop: 8 },
  reviewCount: { fontSize: 12, color: "#999", marginTop: 4 },
  loader: { marginTop: 40 },
  emptyText: { textAlign: "center", color: "#999", marginTop: 40, fontSize: 16 },
});
