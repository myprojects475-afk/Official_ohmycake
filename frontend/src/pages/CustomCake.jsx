import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, MapPin, Upload } from "lucide-react";
import { submitCustomCakeRequest, validateBooking } from "../services/api";
import { useApp } from "../context/AppContext";

export default function CustomCake() {
  const { settings } = useApp();
  const navigate = useNavigate();
  const [form, setForm] = useState({ occasion:"Birthday", flavor:"", qty:1, weight:"", date:"", time:"", description:"", fulfillment:"Pickup", address:"", name:"", phone:"", email:"", referenceImage:null });
  const [status, setStatus] = useState({loading:false,error:""});
  const set = (k,v) => setForm(f => ({...f,[k]:v}));
  const minDate = new Date(Date.now() + Number(settings.MinLeadTimeHours || 2) * 60 * 60 * 1000);
  const maxDate = new Date(Date.now() + Number(settings.MaxLeadTimeDays || 10) * 24 * 60 * 60 * 1000);
  const minDateStr = minDate.toISOString().slice(0,10);
  const maxDateStr = maxDate.toISOString().slice(0,10);

  const submit = async e => {
    e.preventDefault();
    setStatus({loading:true,error:""});
    if (!form.flavor.trim() || !form.date || !form.time || !form.description.trim() || !form.name.trim() || !form.phone.trim() || !form.email.trim()) {
      setStatus({loading:false,error:"Please complete all required fields."}); return;
    }
    if (form.fulfillment === "Delivery" && !form.address.trim()) {
      setStatus({loading:false,error:"Please enter the delivery address."}); return;
    }
    try {
      const booking = await validateBooking(form.date, form.time);
      if (booking && booking.valid === false) throw new Error(booking.message || "Please choose a valid booking time.");
      const result = await submitCustomCakeRequest(form);
      navigate(`/order-confirmation?type=custom&id=${encodeURIComponent(result.requestId)}`);
    } catch (err) {
      setStatus({loading:false,error:err.message || "Unable to submit request."});
    }
  };

  return <section className="section"><div className="container narrow"><div className="page-intro"><span className="eyebrow">Made just for you</span><h1>Custom cakes</h1><p>Tell us what you are imagining and our team will call you to discuss the final design, price and payment.</p></div>
    <div className="notice-box"><strong>No online price or payment</strong><span>Custom cake requests are separate from Cart and Checkout. Weight is for our reference only.</span></div>
    <form className="form-card" onSubmit={submit}>
      <div className="form-section"><h3>1. Cake details</h3><div className="form-grid">
        <label>Occasion<select value={form.occasion} onChange={e=>set("occasion",e.target.value)}><option>Birthday</option><option>Anniversary</option><option>Wedding</option><option>Baby Shower</option><option>Graduation</option><option>Other</option></select></label>
        <label>Flavor<input value={form.flavor} onChange={e=>set("flavor",e.target.value)} maxLength={100} placeholder="e.g. Chocolate, Rasmalai"/></label>
        <label>Quantity<input type="number" min="1" max="50" value={form.qty} onChange={e=>set("qty",Math.max(1,Number(e.target.value)||1))}/></label>
        <label>Weight <span className="optional">for reference only</span><select value={form.weight} onChange={e=>set("weight",e.target.value)}><option value="">Select</option><option value="500">500 g</option><option value="1000">1 kg</option><option value="1500">1.5 kg</option><option value="2000">2 kg</option><option value="other">Other</option></select></label>
      </div><label>Describe how you want your cake<textarea rows="6" value={form.description} maxLength={2000} onChange={e=>set("description",e.target.value)} placeholder="Colours, theme, decoration, message, reference details..."/></label></div>
      <div className="form-section"><h3>2. Reference image <span className="optional">optional</span></h3><label className="upload-box"><Upload size={22}/><strong>Upload a reference photo</strong><span>Maximum 5 MB. Stored through the backend in the shared Google Drive folder.</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{const file=e.target.files?.[0]||null;if(file&&file.size>5*1024*1024){setStatus({loading:false,error:"Reference image must be 5 MB or smaller."});return;}set("referenceImage",file);}}/>{form.referenceImage && <b>{form.referenceImage.name}</b>}</label></div>
      <div className="form-section"><h3>3. Date, time & fulfillment</h3><div className="choice-row"><button type="button" className={form.fulfillment==="Pickup"?"choice selected":"choice"} onClick={()=>set("fulfillment","Pickup")}><strong>Store Pickup</strong><span>Come collect from the shop</span></button><button type="button" className={form.fulfillment==="Delivery"?"choice selected":"choice"} onClick={()=>set("fulfillment","Delivery")}><strong>Delivery</strong><span>Address captured for logistics</span></button></div><div className="form-grid"><label>Date<input type="date" min={minDateStr} max={maxDateStr} value={form.date} onChange={e=>set("date",e.target.value)}/></label><label>Time<input type="time" min={settings.ShopOpenTime} max={settings.ShopCloseTime} value={form.time} onChange={e=>set("time",e.target.value)}/></label></div>{form.fulfillment==="Delivery" && <label><MapPin size={15}/> Delivery address<input value={form.address} maxLength={500} onChange={e=>set("address",e.target.value)} placeholder="Enter the delivery address"/></label>}</div>
      <div className="form-section"><h3>4. Your contact details</h3><div className="form-grid"><label>Name<input value={form.name} maxLength={120} onChange={e=>set("name",e.target.value)} /></label><label>Contact number<input value={form.phone} maxLength={30} onChange={e=>set("phone",e.target.value)} /></label><label>Email<input type="email" value={form.email} maxLength={160} onChange={e=>set("email",e.target.value)} /></label></div></div>
      {status.error && <div className="form-error">{status.error}</div>}
      <div className="form-actions"><Link to="/" className="btn btn-ghost">Cancel</Link><button className="btn btn-primary" disabled={status.loading}>{status.loading ? "Submitting..." : "Submit request"} <ArrowRight size={17}/></button></div>
    </form>
  </div></section>;
}
