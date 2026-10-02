import { Link } from "react-router-dom";
import { Star, ArrowUpRight } from "lucide-react";

export default function ProductCard({ product }) {
  const price = product.Category === "Cake" ? product.PricePer500g : product.PricePerPiece;
  return (
    <Link to={`/product/${product.ProductID}`} className="product-card">
      <div className={`product-image ${product.Category.toLowerCase()}`}>
        <img src={product.ImageURL} alt="" onError={(e) => { e.currentTarget.style.display = "none"; }} />
        {product.Bestseller === "Y" && <span className="badge"><Star size={13} fill="currentColor"/> Bestseller</span>}
        <span className="image-category">{product.Category}</span>
      </div>
      <div className="product-card-body">
        <div><h3>{product.Name}</h3><p>{product.Description}</p></div>
        <div className="product-card-foot"><strong>₹{price}</strong><span>{product.Category === "Cake" ? "starting / 500g" : "per piece"} <ArrowUpRight size={16}/></span></div>
      </div>
    </Link>
  );
}
