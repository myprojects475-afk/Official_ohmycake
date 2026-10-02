import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ChevronRight,
  SlidersHorizontal
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useApp } from "../context/AppContext";

const categoryMap = {
  cakes: "Cake",
  cookies: "Cookie",
  cupcakes: "Cupcake"
};

export default function MenuPage() {
  const { category = "cakes" } = useParams();
  const { products } = useApp();

  const [sort, setSort] = useState("featured");

  /* =========================
     CURRENT CATEGORY
  ========================== */

  const selected =
    categoryMap[category.toLowerCase()] || "Cake";

  /* =========================
     FILTER PRODUCTS
  ========================== */

  const filtered = useMemo(() => {
    const list = products.filter((product) => {
      const productCategory = String(
        product.Category || ""
      )
        .trim()
        .toLowerCase();

      const currentCategory = selected.toLowerCase();

      return (
        productCategory === currentCategory ||
        productCategory === `${currentCategory}s`
      );
    });

    return [...list].sort((a, b) => {
      const priceA = Number(
        a.Category?.toLowerCase() === "cake"
          ? a.PricePer500g
          : a.PricePerPiece
      );

      const priceB = Number(
        b.Category?.toLowerCase() === "cake"
          ? b.PricePer500g
          : b.PricePerPiece
      );

      if (sort === "low") {
        return priceA - priceB;
      }

      if (sort === "high") {
        return priceB - priceA;
      }

      if (sort === "name") {
        return String(a.Name || "").localeCompare(
          String(b.Name || "")
        );
      }

      return (
        Number(b.Bestseller === "Y") -
        Number(a.Bestseller === "Y")
      );
    });
  }, [products, selected, sort]);

  /* =========================
     DISPLAY NAME
  ========================== */

  const displayName =
    selected === "Cake"
      ? "Cakes"
      : selected === "Cookie"
      ? "Cookies"
      : "Cupcakes";

  return (
    <section className="section menu-page">

      <div className="container">

        {/* =========================
            BREADCRUMBS
        ========================== */}

        <div className="breadcrumbs">

          <Link to="/">
            Home
          </Link>

          <ChevronRight size={14} />

          <span>
            Menu
          </span>

          <ChevronRight size={14} />

          <strong>
            {displayName}
          </strong>

        </div>


        {/* =========================
            PAGE HEADER
        ========================== */}

        <div className="page-title-row">

          <div>

            <span className="eyebrow">
              The menu
            </span>

            <h1>
              {displayName}
            </h1>

            <p>
              {selected === "Cake"
                ? "Celebration cakes priced by 500g. Available weight sizes are shown on each cake detail page based on live baked stock."
                : `Freshly baked ${selected.toLowerCase()}s priced per piece.`}
            </p>

          </div>


          {/* =========================
              SORT
          ========================== */}

          <div className="sort-control">

            <SlidersHorizontal size={17} />

            <label>
              Sort{" "}

              <select
                value={sort}
                onChange={(e) =>
                  setSort(e.target.value)
                }
              >
                <option value="featured">
                  Featured
                </option>

                <option value="low">
                  Price: Low to High
                </option>

                <option value="high">
                  Price: High to Low
                </option>

                <option value="name">
                  Name
                </option>

              </select>

            </label>

          </div>

        </div>


        {/* =========================
            PRODUCTS
        ========================== */}

        {filtered.length > 0 ? (

          <div className="product-grid">

            {filtered.map((product) => (
              <ProductCard
                key={product.ProductID}
                product={product}
              />
            ))}

          </div>

        ) : (

          /* =========================
             NO PRODUCTS
          ========================== */

          <div className="empty-state">

            <div className="empty-icon">
              🍰
            </div>

            <h2>
              No {displayName.toLowerCase()} available
            </h2>

            <p>
              There are currently no products listed
              in this category.
            </p>

            <Link
              to="/menu/cakes"
              className="btn btn-primary"
            >
              View Cakes
            </Link>

          </div>

        )}

      </div>

    </section>
  );
}