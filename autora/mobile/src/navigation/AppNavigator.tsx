import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import AsyncStorage from "@react-native-async-storage/async-storage";

import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import HomeScreen from "../screens/driver/HomeScreen";
import ProviderDetailScreen from "../screens/driver/ProviderDetailScreen";
import BookingScreen from "../screens/driver/BookingScreen";
import MyBookingsScreen from "../screens/driver/MyBookingsScreen";
import TowingRequestScreen from "../screens/driver/TowingRequestScreen";
import TowingTrackingScreen from "../screens/driver/TowingTrackingScreen";
import ReviewScreen from "../screens/driver/ReviewScreen";
import ProfileScreen from "../screens/driver/ProfileScreen";
import ProviderDashboard from "../screens/provider/ProviderDashboard";
import ManageServicesScreen from "../screens/provider/ManageServicesScreen";
import ProviderProfileScreen from "../screens/provider/ProviderProfileScreen";
import TowingDashboard from "../screens/towing/TowingDashboard";
import TowingJobScreen from "../screens/towing/TowingJobScreen";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#1a73e8",
        tabBarInactiveTintColor: "#999",
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Home" }} />
      <Tab.Screen name="Bookings" component={MyBookingsScreen} options={{ tabBarLabel: "Bookings" }} />
      <Tab.Screen name="Towing" component={TowingRequestScreen} options={{ tabBarLabel: "SOS" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: "Profile" }} />
    </Tab.Navigator>
  );
}

function ProviderTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#1a73e8",
        tabBarInactiveTintColor: "#999",
      }}
    >
      <Tab.Screen name="Dashboard" component={ProviderDashboard} options={{ tabBarLabel: "Dashboard" }} />
      <Tab.Screen name="Services" component={ManageServicesScreen} options={{ tabBarLabel: "Services" }} />
      <Tab.Screen name="MyProfile" component={ProviderProfileScreen} options={{ tabBarLabel: "Profile" }} />
    </Tab.Navigator>
  );
}

function TowingTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: "#1a73e8",
        tabBarInactiveTintColor: "#999",
      }}
    >
      <Tab.Screen name="TowingHome" component={TowingDashboard} options={{ tabBarLabel: "Dashboard" }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarLabel: "Profile" }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState<string>("Login");
  const [role, setRole] = useState<string>("DRIVER");
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem("token");
      const userStr = await AsyncStorage.getItem("user");
      if (token && userStr) {
        const user = JSON.parse(userStr);
        setRole(user.role || "DRIVER");
        setInitialRoute("MainTabs");
      }
      setIsReady(true);
    };
    checkAuth();
  }, []);

  if (!isReady) return null;

  const MainTabs = role === "SERVICE_PROVIDER"
    ? ProviderTabs
    : role === "TOWING_PROVIDER"
    ? TowingTabs
    : DriverTabs;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen
          name="ProviderDetail"
          component={ProviderDetailScreen}
          options={{ headerShown: true, title: "Provider Details" }}
        />
        <Stack.Screen
          name="Booking"
          component={BookingScreen}
          options={{ headerShown: true, title: "Book Service" }}
        />
        <Stack.Screen
          name="TowingTracking"
          component={TowingTrackingScreen}
          options={{ headerShown: true, title: "Track Towing" }}
        />
        <Stack.Screen
          name="Review"
          component={ReviewScreen}
          options={{ headerShown: true, title: "Write Review" }}
        />
        <Stack.Screen
          name="TowingJob"
          component={TowingJobScreen}
          options={{ headerShown: true, title: "Towing Job" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
