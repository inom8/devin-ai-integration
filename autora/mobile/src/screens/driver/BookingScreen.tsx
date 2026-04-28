import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import { bookingApi } from "../../services/api";

interface BookingScreenProps {
  navigation: { goBack: () => void };
  route: { params: { providerId: string; serviceId: string } };
}

export default function BookingScreen({ navigation, route }: BookingScreenProps) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBook = async () => {
    if (!date || !time) {
      Alert.alert("Error", "Please select date and time");
      return;
    }
    setLoading(true);
    try {
      const scheduledAt = new Date(`${date}T${time}:00`).toISOString();
      await bookingApi.create({
        providerId: route.params.providerId,
        providerServiceId: route.params.serviceId,
        scheduledAt,
        notes: notes || undefined,
        totalPrice: 0,
      });
      Alert.alert("Success", "Booking created!", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert("Error", "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book Service</Text>

      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.input}
        placeholder={`YYYY-MM-DD (e.g. ${new Date().toISOString().split("T")[0]})`}
        value={date}
        onChangeText={setDate}
        keyboardType={Platform.OS === "ios" ? "default" : "default"}
      />

      <Text style={styles.label}>Time</Text>
      <TextInput
        style={styles.input}
        placeholder="HH:MM (e.g. 14:00)"
        value={time}
        onChangeText={setTime}
      />

      <Text style={styles.label}>Notes (optional)</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        placeholder="Any special requests..."
        value={notes}
        onChangeText={setNotes}
        multiline
        numberOfLines={3}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleBook}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Confirm Booking</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", padding: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#333", marginBottom: 24 },
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
  button: {
    backgroundColor: "#1a73e8",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
