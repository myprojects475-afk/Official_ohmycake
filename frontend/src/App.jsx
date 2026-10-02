import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ProtectedAdmin from "./components/ProtectedAdmin";
import Home from "./pages/Home";
import MenuPage from "./pages/MenuPage";
import ProductDetail from "./pages/ProductDetail";
import CustomCake from "./pages/CustomCake";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import About from "./pages/About";
import Reviews from "./pages/Reviews";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const shopRoutes = [
  ["/", <Home />],
  ["/about", <About />],
  ["/reviews", <Reviews />],
  ["/contact", <Contact />],
  ["/menu/:category", <MenuPage />],
  ["/product/:id", <ProductDetail />],
  ["/custom-cake", <CustomCake />],
  ["/custom-cakes", <CustomCake />],
  ["/cart", <Cart />],
  ["/checkout", <Checkout />],
  ["/order-confirmation", <OrderConfirmation />],
  ["/confirmation", <OrderConfirmation />]
];

function NotFound() {
  return <section className="section"><div className="container empty-state"><span className="eyebrow">OH MY CAKE BY ABI</span><h1>Something sweet is missing.</h1><p>Let's take you back to the shop.</p><a href="/" className="btn btn-primary">Back home</a></div></section>;
}

export default function App() {
  return (
    <Routes>
      {shopRoutes.map(([path, element]) => (
        <Route key={path} path={path} element={<Layout>{element}</Layout>} />
      ))}
      <Route path="*" element={<Layout><NotFound /></Layout>} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/dashboard/login" element={<AdminLogin />} />
      <Route element={<ProtectedAdmin />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<AdminDashboard />} />
      </Route>
    </Routes>
  );
}
