import { Link } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  Sparkles,
  Star,
  Truck,
  CakeSlice,
  Instagram,
  MapPin
} from "lucide-react";
import ProductCard from "../components/ProductCard";
import { useApp } from "../context/AppContext";

const gallery = [
  "/images/main.webp",
  "/images/flower red.webp",
  "/images/mango.webp",
  "/images/rainbow.jpg",
  "/images/cup.jpg",
  "/images/cookie.jpg"
];

export default function Home() {
  const { products, reviews, siteContent } = useApp();

  const best = products
    .filter((p) => p.Bestseller === "Y")
    .slice(0, 6);

  const visibleReviews = reviews
    .filter((r) => r.DisplayOnSite !== "N")
    .slice(0, 3);

  return (
    <>
      {/* HERO */}
      <section className="omc-hero">
        <div className="omc-hero-copy">

          <span className="omc-kicker">
            {siteContent.home_eyebrow ||
              "HOME BAKER · FSSAI REGISTERED"}
          </span>

          <h1>
            {siteContent.home_title ||
              "Where Flour & Sugar Become Magic!"}
          </h1>

          <p>
            {siteContent.home_subtext ||
              "Handcrafted cakes and sweet treats..."}
          </p>

          <div className="omc-actions">

            <Link
              to="/menu/cakes"
              className="omc-btn omc-btn-dark"
            >
              {siteContent.cta_shop || "ORDER NOW"}
              <ArrowRight size={16} />
            </Link>

            <Link
              to="/custom-cakes"
              className="omc-btn omc-btn-light"
            >
              {siteContent.cta_custom ||
                "CUSTOMIZE YOUR CAKE"}
            </Link>

          </div>

          <div className="omc-location">
            <MapPin size={15} />
            Coimbatore, Tamil Nadu
          </div>

        </div>

        <div className="omc-hero-visual">

          <div className="omc-hero-photo">
            <img
              src="/images/chocostrw.jpg"
              alt="Fresh celebration cake"
            />
          </div>

          <div className="omc-float omc-float-a">
            <Star size={14} fill="currentColor" />
            Customer favourite
            <br />
            <strong>Freshly made</strong>
          </div>

          <div className="omc-float omc-float-b">
            <Heart size={15} fill="currentColor" />
            Made with love
          </div>

        </div>
      </section>

      {/* TRUST */}
      <section className="omc-trust">

        <div>
          <CakeSlice />
          <span>
            <b>Home baked</b>
            <small>Made in small batches</small>
          </span>
        </div>

        <div>
          <Sparkles />
          <span>
            <b>Freshly made</b>
            <small>Prepared for your order</small>
          </span>
        </div>

        <div>
          <Truck />
          <span>
            <b>Delivery &amp; pickup</b>
            <small>Local fulfilment</small>
          </span>
        </div>

        <div>
          <Heart />
          <span>
            <b>Made for moments</b>
            <small>Personalised with care</small>
          </span>
        </div>

      </section>

      {/* BESTSELLERS */}
      <section className="omc-section">
        <div className="container">

          <div className="omc-section-head">

            <div>
              <span className="omc-kicker">
                OUR FAVOURITES
              </span>

              <h2>
                {siteContent.home_bestsellers_title ||
                  "A Little Something Sweet"}
              </h2>

              <p>
                Our most-loved bakes, chosen for birthdays,
                celebrations and gifting.
              </p>
            </div>

            <Link
              to="/menu/cakes"
              className="omc-text-link"
            >
              EXPLORE MENU
              <ArrowRight size={15} />
            </Link>

          </div>

          <div className="product-grid">
            {best.map((p) => (
              <ProductCard
                key={p.ProductID}
                product={p}
              />
            ))}
          </div>

        </div>
      </section>

      {/* CATEGORIES */}
      <section className="omc-section omc-cream">
        <div className="container">

          <div className="omc-section-head centered">

            <div>
              <span className="omc-kicker">
                EXPLORE
              </span>

              <h2>
                {siteContent.home_categories_title ||
                  "Our Sweet Creations"}
              </h2>

              <p>
                A little sweetness for every kind of
                celebration.
              </p>
            </div>

          </div>

          <div className="omc-category-grid">

            <Link
              to="/menu/cakes"
              className="omc-category"
            >
              <img
                src="/images/cake-black-forest.svg"
                alt="Cakes"
              />

              <div>
                <span>01 · CAKES</span>
                <h3>Celebration layers</h3>
                <p>
                  Elegant favourites crafted for
                  special moments.
                </p>
                <b>
                  SHOP CAKES
                  <ArrowRight size={15} />
                </b>
              </div>
            </Link>

            <Link
              to="/menu/cookies"
              className="omc-category"
            >
              <img
                src="/images/cookie-choco-chip.svg"
                alt="Cookies"
              />

              <div>
                <span>02 · COOKIES</span>
                <h3>Little bites of joy</h3>
                <p>
                  Crisp, chewy and freshly baked.
                </p>
                <b>
                  SHOP COOKIES
                  <ArrowRight size={15} />
                </b>
              </div>
            </Link>

            <Link
              to="/menu/cupcakes"
              className="omc-category"
            >
              <img
                src="/images/cupcake-red-velvet.svg"
                alt="Cupcakes"
              />

              <div>
                <span>03 · CUPCAKES</span>
                <h3>One sweet moment</h3>
                <p>
                  Pretty little treats for sharing
                  and gifting.
                </p>
                <b>
                  SHOP CUPCAKES
                  <ArrowRight size={15} />
                </b>
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* CUSTOM CAKE */}
      <section className="omc-custom">
        <div className="container omc-custom-inner">

          <div>

            <span className="omc-kicker">
              MADE JUST FOR YOU
            </span>

            <h2>
              {siteContent.home_custom_title ||
                "Your Dream Cake, Your Way."}
            </h2>

            <p>
              {siteContent.home_custom_text ||
                "Tell us what you're imagining and we'll help turn it into a beautiful cake."}
            </p>

            <div className="omc-tags">
              <span>Birthdays</span>
              <span>Anniversaries</span>
              <span>Theme cakes</span>
              <span>Floral cakes</span>
            </div>

          </div>

          <Link
            to="/custom-cakes"
            className="omc-btn omc-btn-light"
          >
            {siteContent.cta_custom ||
              "CREATE YOUR CUSTOM CAKE"}
            <ArrowRight size={16} />
          </Link>

        </div>
      </section>

      {/* REVIEWS */}
      <section className="omc-section">
        <div className="container">

          <div className="omc-section-head centered">

            <div>
              <span className="omc-kicker">
                CUSTOMER LOVE
              </span>

              <h2>
                Sweet Words From Our Customers
              </h2>

              <p>
                Real feedback from people who celebrated
                with us.
              </p>
            </div>

            <Link
              to="/reviews"
              className="omc-text-link"
            >
              VIEW REVIEWS
              <ArrowRight size={15} />
            </Link>

          </div>

          <div className="omc-reviews">

            {visibleReviews.map((r) => (
              <article key={r.ReviewID}>

                <div className="stars">
                  {"★".repeat(Number(r.Rating || 5))}
                </div>

                <p>
                  “{r.Text}”
                </p>

                <strong>
                  {r.CustomerName}
                </strong>

              </article>
            ))}

          </div>

        </div>
      </section>

      {/* GALLERY */}
      <section className="omc-gallery-section omc-cream">
        <div className="container">

          <div className="omc-section-head">

            <div>
              <span className="omc-kicker">
                FROM OUR GALLERY
              </span>

              <h2>
                Made for Moments That Matter
              </h2>
            </div>

            <a
              className="omc-text-link"
              href="https://www.instagram.com/ohmycakebyabi/"
              target="_blank"
              rel="noreferrer"
            >
              <Instagram size={16} />
              @OHMYCAKEBYABI
            </a>

          </div>

          <div className="omc-gallery">
            {gallery.map((src, i) => (
              <img
                key={src}
                src={src}
                alt={`Oh My Cake creation ${i + 1}`}
              />
            ))}
          </div>

        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="omc-contact-cta">
        <div className="container">

          <span className="omc-kicker">
            LET'S MAKE SOMETHING SWEET
          </span>

          <h2>
            Have a cake idea?
          </h2>

          <p>
            We're here for questions, custom requests
            and celebration orders.
          </p>

          <Link
            to="/contact"
            className="omc-btn omc-btn-light"
          >
            GET IN TOUCH
            <ArrowRight size={16} />
          </Link>

        </div>
      </section>
    </>
  );
}