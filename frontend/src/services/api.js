import { supabase, isSupabaseConfigured } from "../lib/supabase";
import {
  products as demoProducts,
  reviews as demoReviews,
  offers as demoOffers,
  settings as demoSettings,
  siteContent as demoSiteContent,
} from "../data/demoData";
 
function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to frontend/.env.");
}
 
async function invoke(functionName, body) {
  requireSupabase();
  const { data, error } = await supabase.functions.invoke(functionName, { body });
  if (error) {
    let msg = error.message;
    try { if (error.context?.json) msg = (await error.context.json()).error || msg; } catch {}
    throw new Error(msg || `Unable to call ${functionName}.`);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
 
export async function fetchProducts() {
  if (!isSupabaseConfigured) return demoProducts;
  const { data, error } = await supabase.from("Products").select("*").order("Name");
  if (error) throw error;
  return data || [];
}
 
export async function fetchProductStock(productId = null) {
  if (!isSupabaseConfigured) {
    if (!productId) return demoProducts.flatMap(p => (p.stock || []).map(s => ({ StockID: `${p.ProductID}-${s.weight}`, ProductID: p.ProductID, Weight: s.weight, UnitsAvailable: s.units })));
    const product = demoProducts.find(p => p.ProductID === productId);
    return (product?.stock || []).map(s => ({ StockID: `${productId}-${s.weight}`, ProductID: productId, Weight: s.weight, UnitsAvailable: s.units }));
  }
  let query = supabase.from("ProductStock").select("*").order("Weight", { ascending: true });
  if (productId) query = query.eq("ProductID", productId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}
 
export async function fetchProductsWithStock() {
  const products = await fetchProducts();
  const cakes = products.filter(p => p.Category === "Cake");
  if (!cakes.length) return products;
  const stock = await fetchProductStock();
  const byProduct = new Map();
  stock.forEach(row => {
    const list = byProduct.get(row.ProductID) || [];
    list.push({ ...row, weight: Number(row.Weight), units: Number(row.UnitsAvailable) });
    byProduct.set(row.ProductID, list);
  });
  return products.map(p => ({ ...p, stock: p.Category === "Cake" ? (byProduct.get(p.ProductID) || []) : [] }));
}
 
export async function fetchReviews() {
  if (!isSupabaseConfigured) return demoReviews.filter(x => x.DisplayOnSite === "Y");
  const { data, error } = await supabase.from("Reviews").select("*").eq("DisplayOnSite", "Y").order("ReviewID");
  if (error) throw error;
  return data || [];
}
 
export async function fetchSiteContent() {
  if (!isSupabaseConfigured) return demoSiteContent;
  const { data, error } = await supabase.from("SiteContent").select("*").order("PageName").order("Key");
  if (error) throw error;
  return Object.fromEntries((data || []).map(row => [row.Key, row.Value]));
}
 
export async function fetchSettings() {
  if (!isSupabaseConfigured) return demoSettings;
  const { data, error } = await supabase.from("Settings").select("*").order("Key");
  if (error) throw error;
  return Object.fromEntries((data || []).map(row => [row.Key, row.Value]));
}
 
export async function validateOffer(code, cartTotal) {
  const clean = String(code || "").trim().toUpperCase();
  if (!clean) return { valid: false, message: "Enter an offer code." };
  if (!isSupabaseConfigured) {
    const offer = demoOffers.find(o => String(o.Code).toUpperCase() === clean && o.Active === "Y");
    if (!offer) return { valid: false, message: "Invalid or expired offer code." };
    if (cartTotal < Number(offer.MinOrderValue || 0)) return { valid: false, message: `Minimum order value is ₹${offer.MinOrderValue}.` };
    const discount = String(offer.DiscountType).toLowerCase() === "percent" ? Math.round(cartTotal * Number(offer.DiscountValue) / 100) : Number(offer.DiscountValue);
    return { valid: true, code: offer.Code, discount: Math.min(discount, cartTotal) };
  }
  return invoke("public-api", { action: "validate-offer", code: clean, cartTotal: Number(cartTotal) });
}
 
export async function validateDelivery(payload) {
  if (!isSupabaseConfigured) return { eligible: Boolean(payload?.address), fee: payload?.address ? Number(demoSettings.DeliveryFeeFlat) : 0, distanceKm: null };
  return invoke("public-api", { action: "validate-delivery", ...payload });
}
 
export async function validateBooking(date, time) {
  if (!isSupabaseConfigured) return { valid: true };
  return invoke("public-api", { action: "validate-booking", date, time });
}
 
export async function createCatalogOrder(payload) {
  if (!isSupabaseConfigured) {
    const id = `ORD-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(Date.now()).slice(-4)}`;
    return { ok: true, orderId: id, demo: true };
  }
  if (payload?.paymentMode === "Online") {
    throw new Error("Online payment is not connected yet. Choose Pay at Store for pickup, or connect the selected payment gateway before enabling online payment.");
  }
  return invoke("create-order", { ...payload, paymentMode: "Pay at Store" });
}
 
async function fileToBase64(file) {
  if (!file) return null;
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  return { name: file.name, type: file.type, size: file.size, base64: btoa(binary) };
}
 
export async function submitCustomCakeRequest(payload) {
  if (!isSupabaseConfigured) {
    const id = `REQ-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${String(Date.now()).slice(-4)}`;
    return { ok: true, requestId: id, demo: true };
  }
  const upload = await fileToBase64(payload.referenceImage);
  const clean = { ...payload, referenceImage: upload };
  return invoke("custom-cake-request", clean);
}
 
 
export async function uploadImage(file) {
  const upload = await fileToBase64(file);
  return invoke("upload-image", { file: upload }).then(data => data.url);
}
 
export async function createProduct(product) { return invoke("admin-api", { action: "product.create", product }); }
export async function updateProduct(productId, changes) { return invoke("admin-api", { action: "product.update", productId, changes }); }
export async function deleteProduct(productId) { return invoke("admin-api", { action: "product.delete", productId }); }
export async function createProductStock(stock) { return invoke("admin-api", { action: "stock.create", stock }); }
export async function updateProductStock(stockId, changes) { return invoke("admin-api", { action: "stock.update", stockId, changes }); }
export async function deleteProductStock(stockId) { return invoke("admin-api", { action: "stock.delete", stockId }); }
 
export async function fetchOrders() {
  return invoke("admin-api", { action: "orders.list" }).then(data => data.orders || []);
}
 
export async function fetchOrderItems(orderId) {
  return invoke("admin-api", { action: "order-items.list", orderId }).then(data => data.items || []);
}
 
export async function updateOrderStatus(orderId, status) {
  return invoke("admin-api", { action: "order.status", orderId, status }).then(data => data.order);
}
 
export async function fetchCustomRequests() {
  return invoke("admin-api", { action: "custom.list" }).then(data => data.requests || []);
}
 
export async function updateCustomRequestStatus(requestId, status) {
  return invoke("admin-api", { action: "custom.status", requestId, status }).then(data => data.request);
}
 
export async function fetchAllReviews() { return invoke("admin-api", { action: "reviews.list" }).then(data => data.reviews || []); }
export async function fetchOffers() { return invoke("admin-api", { action: "offers.list" }).then(data => data.offers || []); }
export async function createOffer(offer) { return invoke("admin-api", { action: "offer.create", offer }).then(data => data.offer); }
export async function updateOffer(offerId, changes) { return invoke("admin-api", { action: "offer.update", offerId, changes }).then(data => data.offer); }
export async function deleteOffer(offerId) { return invoke("admin-api", { action: "offer.delete", offerId }).then(() => ({ ok: true })); }
 
export async function createReview(review) { return invoke("admin-api", { action: "review.create", review }).then(data => data.review); }
export async function updateReview(reviewId, changes) { return invoke("admin-api", { action: "review.update", reviewId, changes }).then(data => data.review); }
export async function deleteReview(reviewId) { return invoke("admin-api", { action: "review.delete", reviewId }).then(() => ({ ok: true })); }
 
export async function updateSiteContent(key, value) { return invoke("admin-api", { action: "content.update", key, value }); }
export async function updateSetting(key, value) { return invoke("admin-api", { action: "setting.update", key, value }); }
 
export async function fetchDashboardProfile() { return invoke("admin-api", { action: "profile" }).then(data => data.profile); }
export async function fetchAdminUsers() { return invoke("admin-api", { action: "users.list" }).then(data => data.users || []); }
export async function createAdminUser(user) { return invoke("admin-api", { action: "users.create", user }); }
export async function updateAdminUser(userId, changes) { return invoke("admin-api", { action: "users.update", userId, changes }); }
export async function deleteAdminUser(userId) { return invoke("admin-api", { action: "users.delete", userId }); }
export async function resetAdminPassword(userId, password) { return invoke("admin-api", { action: "users.reset-password", userId, password }); }
 
export async function restoreSupabaseSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}
 
export async function signOutSupabase() {
  if (supabase) await supabase.auth.signOut();
}
 