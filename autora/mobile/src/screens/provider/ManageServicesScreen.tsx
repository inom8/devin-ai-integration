import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
} from "react-native";
import { ProviderService } from "../../types";

export default function ManageServicesScreen() {
  const [services, setServices] = useState<ProviderService[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");

  const handleAdd = () => {
    if (!name || !price) {
      Alert.alert("Error", "Name and price are required");
      return;
    }
    const newService: ProviderService = {
      id: Date.now().toString(),
      providerId: "",
      categoryId: "",
      price: parseFloat(price),
      duration: duration ? parseInt(duration) : null,
      description: null,
      category: { id: "", name },
    };
    setServices([...services, newService]);
    setName("");
    setPrice("");
    setDuration("");
  };

  const handleRemove = (id: string) => {
    setServices(services.filter((s) => s.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Manage Services</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Service name"
          value={name}
          onChangeText={setName}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Price (UZS)"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Duration (min)"
            keyboardType="numeric"
            value={duration}
            onChangeText={setDuration}
          />
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Text style={styles.addText}>Add Service</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        renderItem={({ item }) => (
          <View style={styles.serviceCard}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{item.category.name}</Text>
              <Text style={styles.servicePrice}>
                {item.price.toLocaleString()} UZS
                {item.duration ? ` · ${item.duration} min` : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={() => handleRemove(item.id)}>
              <Text style={styles.removeBtn}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No services added yet</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  header: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 16 },
  form: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 16 },
  input: {
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  row: { flexDirection: "row", gap: 8 },
  halfInput: { flex: 1 },
  addBtn: {
    backgroundColor: "#1a73e8",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
    marginTop: 4,
  },
  addText: { color: "#fff", fontWeight: "600" },
  serviceCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: "600", color: "#333" },
  servicePrice: { fontSize: 14, color: "#666", marginTop: 2 },
  removeBtn: { color: "#ef4444", fontWeight: "600" },
  empty: { textAlign: "center", color: "#999", marginTop: 20 },
});
