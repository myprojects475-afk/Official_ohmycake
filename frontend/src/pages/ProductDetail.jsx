import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronRight, Minus, Plus, Star } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, addToCart, settings } = useApp();
  const product = products.find(p => p.ProductID === id);
  const [weight, setWeight] = useState("");
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState("");
  const [candleBoxes, setCandleBoxes] = useState(0);
  const [notice, setNotice] = useState("");

  if (!product) return <section className="section"><div className="container empty-state"><h2>Product not found</h2><Link className="btn btn-primary" to="/menu/cakes">Back to menu</Link></div></section>;

  const isCake = product.Category === "Cake";
  const available = isCake ? (product.stock || []).filter(s => Number(s.units ?? s.UnitsAvailable) > 0) : [];
  const selectedStock = available.find(s => Number(s.weight ?? s.Weight) === Number(weight));
  const price = isCake ? Number(product.PricePer500g || 0) * (Number(weight || 500) / 500) : Number(product.PricePerPiece || 0);
  const total = price * qty + Number(candleBoxes) * Number(settings.CandleBoxPrice || 5);

  const add = () => {
    if (isCake && !selectedStock) { setNotice("Please choose an available cake weight."); return; }
    const units = isCake ? Number(selectedStock.units ?? selectedStock.UnitsAvailable) : 999;
    if (qty > units) { setNotice(`Only ${units} unit${units === 1 ? "" : "s"} available at this weight.`); return; }
    addToCart({
      ProductID: product.ProductID, Name: product.Name, Category: product.Category,
      Weight: isCake ? Number(weight) : null, Qty: qty,
      CakeMessage: isCake ? message.trim() : "",
      CandleBoxes: isCake ? Number(candleBoxes) : 0,
      ItemPrice: price, ImageURL: product.ImageURL
    });
    navigate("/cart");
  };

  return (
    <section className="section"><div className="container">
      <div className="breadcrumbs"><Link to={`/menu/${product.Category.toLowerCase()}s`}>Menu</Link><ChevronRight size={14}/><strong>{product.Name}</strong></div>
      <div className="detail-grid">
        <div className={`detail-image ${product.Category.toLowerCase()}`}>
  <img
    src={product.ImageURL}
    alt={product.Name}
    onError={(e) => {
      console.error("Product image failed to load:", product.ImageURL);
      e.currentTarget.style.display = "block";
      e.currentTarget.style.opacity = "1";
    }}
  />

  {product.Bestseller === "Y" && (
    <span className="badge">
      <Star size={13} fill="currentColor" /> Bestseller
    </span>
  )}
</div>
        <div className="detail-copy"><span className="eyebrow">{product.Category}</span><h1>{product.Name}</h1><p className="lead">{product.Description}</p>
          {isCake ? <>
            <div className="option-block"><div className="option-label"><span>Available weight</span><small>Only sizes currently baked and ready</small></div><div className="weight-grid">{available.map(s => { const w=Number(s.weight??s.Weight); return <button key={w} className={Number(weight)===w?"selected":""} onClick={()=>{setWeight(w);setNotice("")}}><strong>{w >= 1000 ? `${w/1000} kg` : `${w} g`}</strong><small>{Number(s.units??s.UnitsAvailable)} ready</small></button>})}</div>{available.length===0 && <div className="inline-warning">This cake is currently out of stock in every baked size.</div>}<p className="small-note">Want a different weight? <Link to="/custom-cake">Order it as a Custom Cake</Link></p></div>
            <div className="option-block"><div className="option-label"><span>Cake message <small>(optional)</small></span></div><textarea value={message} maxLength={120} onChange={e=>setMessage(e.target.value)} placeholder="Happy Birthday Rithik"/></div>
            <div className="option-block"><div className="option-label"><span>Candle boxes</span><small>3 candles per box · ₹{settings.CandleBoxPrice} / box</small></div><div className="stepper"><button onClick={()=>setCandleBoxes(Math.max(0,candleBoxes-1))}><Minus size={16}/></button><strong>{candleBoxes}</strong><button onClick={()=>setCandleBoxes(candleBoxes+1)}><Plus size={16}/></button></div></div>
          </> : <div className="stock-note"><Check size={18}/> {product.InStock === "Y" ? "In stock" : "Currently out of stock"} · priced per piece</div>}
          <div className="detail-total"><span>Total</span><strong>₹{total.toLocaleString("en-IN")}</strong></div>
          <button className="btn btn-primary wide" disabled={!isCake && product.InStock!=="Y"} onClick={add}>{isCake ? "Add to Cart" : "Add to Cart"} <ChevronRight size={17}/></button>
          {notice && <p className="form-error">{notice}</p>}
        </div>
      </div>
    </div></section>
  );
}
