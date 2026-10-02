import {
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Clock3
} from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Contact() {
  const { siteContent, settings } = useApp();

  const phone =
    settings.ShopNotificationPhone || "+91 90000 00000";

  const phoneClean = phone.replace(/[^\d+]/g, "");
  const whatsappNumber = phone.replace(/\D/g, "");

  const email =
    settings.ShopNotificationEmail || "hello@ohmycake.example";

  return (
    <section className="section">
      <div className="container">

        {/* CONTACT INTRO */}
        <div className="page-intro">

          <span className="eyebrow">
            Contact us
          </span>

          <h1>
            {siteContent.contact_title || "Come say hello."}
          </h1>

          <p>
            {siteContent.contact_text ||
              "For custom cakes, questions or order help, reach us directly."}
          </p>

        </div>

        <div className="contact-grid">

          {/* CONTACT DETAILS */}
          <div className="contact-card">

            <h3>Get in touch</h3>

            {/* PHONE */}
            <a href={`tel:${phoneClean}`}>
              <Phone />
              {phone}
            </a>

            {/* WHATSAPP */}
            <a
              href={`https://wa.me/${whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle />
              WhatsApp us
            </a>

            {/* EMAIL */}
            <a href={`mailto:${email}`}>
              <Mail />
              {email}
            </a>

            {/* SHOP HOURS */}
            <div className="contact-hours">
              <Clock3 />

              <span>
                <strong>Shop hours</strong>

                <small>
                  Every day ·{" "}
                  {settings.ShopOpenTime || "09:00"} –{" "}
                  {settings.ShopCloseTime || "22:00"}
                </small>
              </span>
            </div>

          </div>

          {/* LOCATION */}
          <div className="map-placeholder">

            <MapPin size={38} />

            <h3>Store location</h3>

            <p>
              Google Maps / Places will be connected here.
              The checkout and custom-cake flows use the
              same map location for delivery logistics.
            </p>

            <span>
              {settings.DeliveryRadiusKm || 15} km delivery radius
            </span>

          </div>

        </div>

      </div>
    </section>
  );
}