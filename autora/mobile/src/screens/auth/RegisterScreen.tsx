import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi } from "../../services/api";

interface RegisterScreenProps {
  navigation: { replace: (screen: string) => void };
}

const ROLES = [
  { key: "DRIVER", label: "Driver / Car Owner" },
  { key: "SERVICE_PROVIDER", label: "Service Provider" },
  { key: "TOWING_PROVIDER", label: "Towing Provider" },
];

export default function RegisterScreen({ navigation }: RegisterScreenProps) {
  const [name, setName] = useState("");
  const [selectedRole, setSelectedRole] = useState("DRIVER");
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(name, selectedRole);
      await AsyncStorage.setItem("token", res.data.token);
      await AsyncStorage.setItem("user", JSON.stringify(res.data.user));
      navigation.replace("MainTabs");
    } catch {
      Alert.alert("Error", "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Complete Registration</Text>

      <TextInput
        style={styles.input}
        placeholder="Your name"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Select your role:</Text>
      {ROLES.map((role) => (
        <TouchableOpacity
          key={role.key}
          style={[
            styles.roleOption,
            selectedRole === role.key && styles.roleOptionSelected,
          ]}
          onPress={() => setSelectedRole(role.key)}
        >
          <Text
            style={[
              styles.roleText,
              selectedRole === role.key && styles.roleTextSelected,
            ]}
          >
            {role.label}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Get Started</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 32,
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  roleOption: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#ddd",
  },
  roleOptionSelected: {
    borderColor: "#1a73e8",
    backgroundColor: "#e8f0fe",
  },
  roleText: {
    fontSize: 16,
    color: "#333",
  },
  roleTextSelected: {
    color: "#1a73e8",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#1a73e8",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
