const CART_KEY = "ohmycake_cart_v2";
const ADMIN_KEY = "ohmycake_dashboard_session_v2";

export function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function loadDashboardSession() {
  try {
    return JSON.parse(localStorage.getItem(ADMIN_KEY) || "null");
  } catch {
    return null;
  }
}

export function saveDashboardSession(session) {
  localStorage.setItem(ADMIN_KEY, JSON.stringify(session));
}

export function clearDashboardSession() {
  localStorage.removeItem(ADMIN_KEY);
}
