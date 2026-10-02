import { Star } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function Reviews() {
  const { reviews, siteContent } = useApp();

  return (
    <section className="section soft">
      <div className="container">

        {/* REVIEWS INTRO */}
        <div className="page-intro centered">

          <span className="eyebrow">
            Customer reviews
          </span>

          <h1>
            {siteContent.reviews_title ||
              "Sweet words from our customers."}
          </h1>

          <p>
            {siteContent.reviews_text ||
              "Testimonials are managed by the shop dashboard."}
          </p>

        </div>

        {/* REVIEWS */}
        <div className="reviews-grid">

          {reviews.map((r) => (
            <article
              className="review-card"
              key={r.ReviewID}
            >

              <div className="stars">
                {Array.from(
                  { length: 5 },
                  (_, i) => (
                    <Star
                      key={i}
                      size={17}
                      fill={
                        i < Number(r.Rating || 0)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  )
                )}
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
  );
}