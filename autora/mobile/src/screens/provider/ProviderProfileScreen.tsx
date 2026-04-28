import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { providerApi } from "../../services/api";

export default function ProviderProfileScreen() {
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [workingHours, setWorkingHours] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!businessName) {
      Alert.alert("Error", "Business name is required");
      return;
    }
    setLoading(true);
    try {
      await providerApi.create({
        businessName,
        description: description || undefined,
        address: address || undefined,
        workingHoursJson: workingHours || undefined,
        latitude: 41.311081,
        longitude: 69.240562,
      });
      Alert.alert("Success", "Profile updated");
    } catch {
      Alert.alert("Error", "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Business Profile</Text>

      <Text style={styles.label}>Business Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Your business name"
        value={businessName}
        onChangeText={setBusinessName}
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Describe your services..."
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
      />

      <Text style={styles.label}>Address</Text>
      <TextInput
        style={styles.input}
        placeholder="Your business address"
        value={address}
        onChangeText={setAddress}
      />

      <Text style={styles.label}>Working Hours</Text>
      <TextInput
        style={styles.input}
        placeholder='e.g. Mon-Fri 9:00-18:00'
        value={workingHours}
        onChangeText={setWorkingHours}
      />

      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleSave}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>Save Profile</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  header: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#333", marginBottom: 6 },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  textArea: { height: 80, textAlignVertical: "top" },
  saveBtn: {
    backgroundColor: "#1a73e8",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 32,
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
