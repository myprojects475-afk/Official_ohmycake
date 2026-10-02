import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadCart, saveCart, loadDashboardSession, saveDashboardSession, clearDashboardSession } from "../lib/storage";
import { fetchProductsWithStock, fetchReviews, fetchSiteContent, fetchSettings, restoreSupabaseSession, fetchDashboardProfile, signOutSupabase } from "../services/api";
import { products as fallbackProducts, reviews as fallbackReviews, siteContent as fallbackContent, settings as fallbackSettings } from "../data/demoData";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [products, setProducts] = useState(fallbackProducts);
  const [reviews, setReviews] = useState(fallbackReviews);
  const [siteContent, setSiteContent] = useState(fallbackContent);
  const [settings, setSettings] = useState(fallbackSettings);
  const [cart, setCart] = useState(loadCart);
  const [session, setSession] = useState(loadDashboardSession);
  const [loading, setLoading] = useState(false);

  useEffect(() => saveCart(cart), [cart]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const [p, r, c, s, authSession] = await Promise.all([
          fetchProductsWithStock(), fetchReviews(), fetchSiteContent(), fetchSettings(), restoreSupabaseSession()
        ]);
        if (!active) return;
        setProducts(p?.length ? p : fallbackProducts);
        setReviews(r?.length ? r : fallbackReviews);
        setSiteContent(Object.keys(c || {}).length ? c : fallbackContent);
        setSettings(Object.keys(s || {}).length ? normalizeSettings(s) : fallbackSettings);
        if (authSession) {
          try {
            const profile = await fetchDashboardProfile();
            if (profile) {
              const next = { role: profile.Role, username: profile.Username, name: profile.Role === "admin" ? "Administrator" : "Client", demo: false, authUserId: authSession.user?.id || null, email: authSession.user?.email || null };
              setSession(next); saveDashboardSession(next);
            }
          } catch {
            setSession(null); clearDashboardSession();
          }
        }
      } catch (error) {
        console.error("Initial data load failed:", error);
        if (active) {
          setProducts(fallbackProducts);
          setReviews(fallbackReviews);
          setSiteContent(fallbackContent);
          setSettings(fallbackSettings);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const addToCart = (item) => {
    setCart(current => {
      const same = current.find(x => x.ProductID === item.ProductID && Number(x.Weight || 0) === Number(item.Weight || 0) && (x.CakeMessage || "") === (item.CakeMessage || ""));
      if (same) return current.map(x => x === same ? { ...x, Qty: x.Qty + item.Qty, CandleBoxes: (x.CandleBoxes || 0) + (item.CandleBoxes || 0) } : x);
      return [...current, { ...item, lineId: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}` }];
    });
  };

  const updateCartQty = (lineId, qty) => setCart(current => current.map(x => x.lineId === lineId ? { ...x, Qty: Math.max(1, Number(qty) || 1) } : x));
  const removeFromCart = (lineId) => setCart(current => current.filter(x => x.lineId !== lineId));
  const clearCart = () => setCart([]);

  const login = (next) => { setSession(next); saveDashboardSession(next); };
  const logout = async () => { await signOutSupabase(); setSession(null); clearDashboardSession(); };

  const value = useMemo(() => ({
    products, setProducts, reviews, setReviews, siteContent, setSiteContent, settings, setSettings,
    cart, addToCart, updateCartQty, removeFromCart, clearCart, session, login, logout, loading
  }), [products, reviews, siteContent, settings, cart, session, loading]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

function normalizeSettings(s) {
  return Object.fromEntries(Object.entries(s).map(([k, v]) => {
    const n = ["CandleBoxPrice", "DeliveryFeeFlat", "DeliveryRadiusKm", "MinLeadTimeHours", "MaxLeadTimeDays"].includes(k) ? Number(v) : v;
    return [k, n];
  }));
}

export function useApp() { return useContext(AppContext); }
