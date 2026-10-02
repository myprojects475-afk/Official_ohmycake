import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  ChevronDown,
  Menu,
  X,
  CakeSlice,
  Instagram,
  Phone,
  MessageCircle,
  Mail
} from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function Layout({ children }) {
  const { cart, siteContent, settings } = useApp();

  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  /* =========================
     SETTINGS
  ========================== */

  const phone =
    settings?.ShopNotificationPhone || "+91 90000 00000";

  const phoneClean = phone.replace(/[^\d+]/g, "");

  const whatsappNumber = phone.replace(/\D/g, "");

  const email =
    settings?.ShopNotificationEmail ||
    "hello@ohmycake.example";

  const openTime =
    settings?.ShopOpenTime || "09:00";

  const closeTime =
    settings?.ShopCloseTime || "22:00";

  /* =========================
     NAVIGATION
  ========================== */

  const nav = [
    ["/", siteContent.nav_home || "Home"],
    ["/about", siteContent.nav_about || "About Us"],
    ["/reviews", siteContent.nav_reviews || "Reviews"],
    ["/contact", siteContent.nav_contact || "Contact"]
  ];

  /* =========================
     MENU HANDLER
  ========================== */

  const closeMenus = () => {
    setMenuOpen(false);
    setOpen(false);
  };

  return (
    <div className="app-shell">

      {/* =========================
          HEADER
      ========================== */}

      <header className="site-header">
        <div className="container header-inner">

          {/* BRAND */}

          <Link
            to="/"
            className="brand"
            onClick={closeMenus}
          >
            <span className="brand-mark">
              <CakeSlice size={22} />
            </span>

            <span>
              <strong>Oh My Cake</strong>
              <small>by Abi</small>
            </span>
          </Link>


          {/* MOBILE MENU BUTTON */}

          <button
            type="button"
            className="mobile-menu-btn"
            onClick={() => {
              setOpen((v) => !v);
              setMenuOpen(false);
            }}
            aria-label="Toggle navigation"
          >
            {open ? <X /> : <Menu />}
          </button>


          {/* NAVIGATION */}

          <nav
            className={`main-nav ${
              open ? "mobile-open" : ""
            }`}
          >

            {/* MAIN NAV LINKS */}

            {nav.map(([to, label]) => (
              <NavLink
                key={to}
                to={to}
                onClick={closeMenus}
                className={({ isActive }) =>
                  isActive ? "active" : ""
                }
              >
                {label}
              </NavLink>
            ))}


            {/* =========================
                MENU DROPDOWN
            ========================== */}

            <div className="nav-dropdown">

              <button
                type="button"
                className="nav-menu-button"
                onClick={() => {
                  setMenuOpen((v) => !v);
                }}
                aria-expanded={menuOpen}
              >
                <span>Menu</span>

                <ChevronDown
                  size={15}
                  className={
                    menuOpen ? "menu-arrow-open" : ""
                  }
                />
              </button>


              {menuOpen && (
                <div className="dropdown-panel">

                  <Link
                    to="/menu/cakes"
                    onClick={closeMenus}
                  >
                    Cakes
                  </Link>

                  <Link
                    to="/menu/cookies"
                    onClick={closeMenus}
                  >
                    Cookies
                  </Link>

                  <Link
                    to="/menu/cupcakes"
                    onClick={closeMenus}
                  >
                    Cupcakes
                  </Link>

                </div>
              )}

            </div>


            {/* CUSTOM CAKE */}

            <Link
              to="/custom-cakes"
              className="nav-custom"
              onClick={closeMenus}
            >
              {siteContent.nav_custom || "Custom Cake"}
            </Link>

          </nav>


          {/* CART */}

          <button
            type="button"
            className="cart-button"
            onClick={() => {
              closeMenus();
              navigate("/cart");
            }}
            aria-label="Open cart"
          >
            <ShoppingBag size={20} />

            <span>Cart</span>

            {cart.length > 0 && (
              <b>
                {cart.reduce(
                  (sum, x) =>
                    sum + Number(x.Qty || 0),
                  0
                )}
              </b>
            )}

          </button>

        </div>
      </header>


      {/* =========================
          MAIN CONTENT
      ========================== */}

      <main>
        {children}
      </main>


      {/* =========================
          FOOTER
      ========================== */}

      <footer className="footer">

        <div className="container footer-grid">

          {/* BRAND / FOOTER TEXT */}

          <div>

            <div className="brand footer-brand">

              <span className="brand-mark">
                <CakeSlice size={22} />
              </span>

              <span>
                <strong>Oh My Cake</strong>
                <small>by Abi</small>
              </span>

            </div>

            <p>
              {siteContent.footer_text ||
                "Freshly baked, thoughtfully made."}
            </p>

          </div>


          {/* EXPLORE */}

          <div>

            <h4>Explore</h4>

            <Link to="/menu/cakes">
              Cakes
            </Link>

            <Link to="/menu/cookies">
              Cookies
            </Link>

            <Link to="/menu/cupcakes">
              Cupcakes
            </Link>

            <Link to="/custom-cakes">
              {siteContent.nav_custom ||
                "Custom Cakes"}
            </Link>

          </div>


          {/* CONTACT */}

          <div>

            <h4>Contact</h4>

            {/* PHONE */}

            <a href={`tel:${phoneClean}`}>
              <Phone size={15} />
              {phone}
            </a>


            {/* WHATSAPP */}

            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={15} />
              WhatsApp
            </a>


            {/* EMAIL */}

            <a href={`mailto:${email}`}>
              <Mail size={15} />
              {email}
            </a>


            {/* INSTAGRAM */}

            <a
              href="https://www.instagram.com/ohmycakebyabi/"
              target="_blank"
              rel="noreferrer"
            >
              <Instagram size={15} />
              Instagram
            </a>

          </div>


          {/* SHOP HOURS */}

          <div>

            <h4>Shop hours</h4>

            <p>
              Every day
              <br />
              {openTime} – {closeTime}
            </p>

          </div>

        </div>


        {/* FOOTER BOTTOM */}

        <div className="container footer-bottom">

          <span>
            © {new Date().getFullYear()} Oh My Cake by Abi
          </span>

          <Link to="/admin/login">
            Dashboard
          </Link>

        </div>

      </footer>

    </div>
  );
}