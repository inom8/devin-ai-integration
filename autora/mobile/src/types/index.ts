export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: "DRIVER" | "SERVICE_PROVIDER" | "TOWING_PROVIDER" | "ADMIN";
  avatarUrl: string | null;
  createdAt: string;
}

export interface ServiceProvider {
  id: string;
  userId: string;
  businessName: string;
  description: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  workingHoursJson: string | null;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  services: ProviderService[];
  user: { name: string; phone: string; avatarUrl: string | null };
}

export interface ServiceCategory {
  id: string;
  name: string;
}

export interface ProviderService {
  id: string;
  providerId: string;
  categoryId: string;
  price: number;
  duration: number | null;
  description: string | null;
  category: ServiceCategory;
}

export interface Booking {
  id: string;
  userId: string;
  providerId: string;
  providerServiceId: string;
  status: "PENDING" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  scheduledAt: string;
  notes: string | null;
  totalPrice: number;
  createdAt: string;
  provider: ServiceProvider;
  providerService: ProviderService;
}

export interface TowingRequest {
  id: string;
  userId: string;
  towingProviderId: string | null;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string | null;
  dropoffLat: number | null;
  dropoffLng: number | null;
  dropoffAddress: string | null;
  status: "REQUESTED" | "ACCEPTED" | "EN_ROUTE" | "ARRIVED" | "COMPLETED" | "CANCELLED";
  estimatedArrival: string | null;
  price: number | null;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  targetType: "SERVICE_PROVIDER" | "TOWING_PROVIDER";
  targetId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: { name: string; avatarUrl: string | null };
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  MainTabs: undefined;
  ProviderDetail: { id: string };
  Booking: { providerId: string; serviceId: string };
  TowingTracking: { requestId: string };
  Review: { targetType: string; targetId: string };
};

export type BottomTabParamList = {
  Home: undefined;
  Bookings: undefined;
  Towing: undefined;
  Profile: undefined;
};
