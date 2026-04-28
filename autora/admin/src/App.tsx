import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ProviderManagement from "./pages/ProviderManagement";
import UserManagement from "./pages/UserManagement";
import BookingManagement from "./pages/BookingManagement";
import TowingManagement from "./pages/TowingManagement";
import ReviewsModeration from "./pages/ReviewsModeration";
import CategoriesManagement from "./pages/CategoriesManagement";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="providers" element={<ProviderManagement />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="bookings" element={<BookingManagement />} />
          <Route path="towing" element={<TowingManagement />} />
          <Route path="reviews" element={<ReviewsModeration />} />
          <Route path="categories" element={<CategoriesManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
