import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  loadCart,
  saveCart,
  loadDashboardSession,
  saveDashboardSession,
  clearDashboardSession,
} from "../lib/storage";

import {
  fetchProductsWithStock,
  fetchReviews,
  fetchSiteContent,
  fetchSettings,
  restoreSupabaseSession,
  fetchDashboardProfile,
  signOutSupabase,
} from "../services/api";

import {
  products as fallbackProducts,
  reviews as fallbackReviews,
  siteContent as fallbackContent,
  settings as fallbackSettings,
} from "../data/demoData";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [siteContent, setSiteContent] = useState({});
  const [settings, setSettings] = useState({});

  const [cart, setCart] = useState(loadCart);
  const [session, setSession] = useState(loadDashboardSession);

  // Start with loading enabled so fallback/demo UI
  // does not flash before Supabase data is ready.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    saveCart(cart);
  }, [cart]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);

      try {
        const [
          p,
          r,
          c,
          s,
          authSession,
        ] = await Promise.all([
          fetchProductsWithStock(),
          fetchReviews(),
          fetchSiteContent(),
          fetchSettings(),
          restoreSupabaseSession(),
        ]);

        if (!active) return;

        setProducts(
          p?.length
            ? p
            : fallbackProducts
        );

        setReviews(
          r?.length
            ? r
            : fallbackReviews
        );

        setSiteContent(
          Object.keys(c || {}).length
            ? c
            : fallbackContent
        );

        setSettings(
          Object.keys(s || {}).length
            ? normalizeSettings(s)
            : fallbackSettings
        );

        if (authSession) {
          try {
            const profile = await fetchDashboardProfile();

            if (profile) {
              const next = {
                role: profile.Role,
                username: profile.Username,
                name:
                  profile.Role === "admin"
                    ? "Administrator"
                    : "Client",
                demo: false,
                authUserId:
                  authSession.user?.id || null,
                email:
                  authSession.user?.email || null,
              };

              setSession(next);
              saveDashboardSession(next);
            }
          } catch (error) {
            console.error(
              "Dashboard profile load failed:",
              error
            );

            setSession(null);
            clearDashboardSession();
          }
        }
      } catch (error) {
        console.error(
          "Initial data load failed:",
          error
        );

        if (active) {
          setProducts(fallbackProducts);
          setReviews(fallbackReviews);
          setSiteContent(fallbackContent);
          setSettings(fallbackSettings);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, []);

  const addToCart = (item) => {
    setCart((current) => {
      const same = current.find(
        (x) =>
          x.ProductID === item.ProductID &&
          Number(x.Weight || 0) ===
            Number(item.Weight || 0) &&
          (x.CakeMessage || "") ===
            (item.CakeMessage || "")
      );

      if (same) {
        return current.map((x) =>
          x === same
            ? {
                ...x,
                Qty: x.Qty + item.Qty,
                CandleBoxes:
                  (x.CandleBoxes || 0) +
                  (item.CandleBoxes || 0),
              }
            : x
        );
      }

      return [
        ...current,
        {
          ...item,
          lineId:
            crypto.randomUUID?.() ||
            `${Date.now()}-${Math.random()}`,
        },
      ];
    });
  };

  const updateCartQty = (lineId, qty) => {
    setCart((current) =>
      current.map((x) =>
        x.lineId === lineId
          ? {
              ...x,
              Qty: Math.max(
                1,
                Number(qty) || 1
              ),
            }
          : x
      )
    );
  };

  const removeFromCart = (lineId) => {
    setCart((current) =>
      current.filter(
        (x) => x.lineId !== lineId
      )
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const login = (next) => {
    setSession(next);
    saveDashboardSession(next);
  };

  const logout = async () => {
    await signOutSupabase();
    setSession(null);
    clearDashboardSession();
  };

  const value = useMemo(
    () => ({
      products,
      setProducts,

      reviews,
      setReviews,

      siteContent,
      setSiteContent,

      settings,
      setSettings,

      cart,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,

      session,
      login,
      logout,

      loading,
    }),
    [
      products,
      reviews,
      siteContent,
      settings,
      cart,
      session,
      loading,
    ]
  );

  // Prevent the old/fallback UI from appearing
  // while the initial Supabase data is loading.
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#fffaf7",
          color: "#3d2b25",
          fontFamily: "inherit",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "24px",
          }}
        >
          <div
            style={{
              fontSize: "28px",
              fontWeight: 700,
              marginBottom: "10px",
            }}
          >
            Oh My Cake
          </div>

          <div
            style={{
              fontSize: "14px",
              opacity: 0.7,
            }}
          >
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

function normalizeSettings(s) {
  return Object.fromEntries(
    Object.entries(s).map(([k, v]) => {
      const n = [
        "CandleBoxPrice",
        "DeliveryFeeFlat",
        "DeliveryRadiusKm",
        "MinLeadTimeHours",
        "MaxLeadTimeDays",
      ].includes(k)
        ? Number(v)
        : v;

      return [k, n];
    })
  );
}

export function useApp() {
  return useContext(AppContext);
}