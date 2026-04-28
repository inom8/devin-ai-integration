import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { providerApi, reviewApi } from "../../services/api";
import { ServiceProvider, Review } from "../../types";

interface ProviderDetailScreenProps {
  navigation: { navigate: (screen: string, params?: Record<string, unknown>) => void };
  route: { params: { id: string } };
}

export default function ProviderDetailScreen({ navigation, route }: ProviderDetailScreenProps) {
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [provRes, revRes] = await Promise.all([
          providerApi.getById(route.params.id),
          reviewApi.list("SERVICE_PROVIDER", route.params.id),
        ]);
        setProvider(provRes.data);
        setReviews(revRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [route.params.id]);

  if (loading || !provider) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a73e8" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.name}>{provider.businessName}</Text>
        <Text style={styles.rating}>
          {"★"} {provider.rating.toFixed(1)} · {provider.reviewCount} reviews
        </Text>
        {provider.address && <Text style={styles.address}>{provider.address}</Text>}
        {provider.description && (
          <Text style={styles.description}>{provider.description}</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Services</Text>
      {provider.services.map((service) => (
        <TouchableOpacity
          key={service.id}
          style={styles.serviceCard}
          onPress={() =>
            navigation.navigate("Booking", {
              providerId: provider.id,
              serviceId: service.id,
            })
          }
        >
          <View style={styles.serviceInfo}>
            <Text style={styles.serviceName}>{service.category.name}</Text>
            {service.description && (
              <Text style={styles.serviceDesc}>{service.description}</Text>
            )}
            {service.duration && (
              <Text style={styles.duration}>{service.duration} min</Text>
            )}
          </View>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {service.price.toLocaleString()} UZS
            </Text>
            <Text style={styles.bookBtn}>Book</Text>
          </View>
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>Reviews</Text>
      {reviews.length === 0 ? (
        <Text style={styles.noReviews}>No reviews yet</Text>
      ) : (
        reviews.map((review) => (
          <View key={review.id} style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <Text style={styles.reviewerName}>{review.user.name}</Text>
              <Text style={styles.reviewRating}>{"★"} {review.rating}</Text>
            </View>
            {review.comment && (
              <Text style={styles.reviewComment}>{review.comment}</Text>
            )}
          </View>
        ))
      )}

      <TouchableOpacity
        style={styles.writeReviewBtn}
        onPress={() =>
          navigation.navigate("Review", {
            targetType: "SERVICE_PROVIDER",
            targetId: provider.id,
          })
        }
      >
        <Text style={styles.writeReviewText}>Write a Review</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { backgroundColor: "#fff", padding: 20, marginBottom: 8 },
  name: { fontSize: 24, fontWeight: "bold", color: "#333" },
  rating: { fontSize: 16, color: "#d97706", marginTop: 4 },
  address: { fontSize: 14, color: "#666", marginTop: 4 },
  description: { fontSize: 14, color: "#555", marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#333", paddingHorizontal: 16, paddingVertical: 12 },
  serviceCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  serviceInfo: { flex: 1 },
  serviceName: { fontSize: 16, fontWeight: "600", color: "#333" },
  serviceDesc: { fontSize: 13, color: "#666", marginTop: 2 },
  duration: { fontSize: 12, color: "#999", marginTop: 2 },
  priceContainer: { alignItems: "flex-end" },
  price: { fontSize: 16, fontWeight: "bold", color: "#1a73e8" },
  bookBtn: { fontSize: 14, color: "#1a73e8", fontWeight: "600", marginTop: 4 },
  reviewCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
  },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between" },
  reviewerName: { fontSize: 14, fontWeight: "600", color: "#333" },
  reviewRating: { fontSize: 14, color: "#d97706" },
  reviewComment: { fontSize: 14, color: "#555", marginTop: 4 },
  noReviews: { textAlign: "center", color: "#999", paddingHorizontal: 16, marginBottom: 16 },
  writeReviewBtn: {
    backgroundColor: "#1a73e8",
    margin: 16,
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
  },
  writeReviewText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
