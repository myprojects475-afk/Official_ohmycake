import { Link, useLocation, useSearchParams } from "react-router-dom";
import { CheckCircle2, MessageCircle, Mail, ArrowRight } from "lucide-react";

export default function OrderConfirmation() {
  const [params] = useSearchParams();
  const location = useLocation();
  const type = params.get("type") || "catalog";
  const id = params.get("id") || location.state?.orderId || "DEMO";
  const isCustom = type === "custom";
  return <section className="section"><div className="container narrow"><div className="confirmation-card"><div className="success-icon"><CheckCircle2/></div><span className="eyebrow">{isCustom ? "Request received" : "Order placed"}</span><h1>{isCustom ? "We have your custom cake request." : "Your sweet order is on its way."}</h1><p>{isCustom ? "There is no price or payment in this flow. The shop will contact you directly to discuss the design, final price and payment." : "Your order has been recorded. Confirmation and receipt will be sent through WhatsApp and email after the backend notification functions are connected."}</p><div className="order-id"><span>{isCustom ? "Request ID" : "Order ID"}</span><strong>{id}</strong></div><div className="notification-pills"><span><MessageCircle size={15}/> WhatsApp</span><span><Mail size={15}/> Email</span></div><div className="form-actions"><Link to="/" className="btn btn-ghost">Back home</Link><Link to="/menu/cakes" className="btn btn-primary">Continue shopping <ArrowRight size={17}/></Link></div></div></div></section>;
}
