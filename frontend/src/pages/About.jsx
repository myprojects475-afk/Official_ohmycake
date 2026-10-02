import { Heart, Sparkles, Clock3 } from "lucide-react";
import { useApp } from "../context/AppContext";

export default function About() {
  const { siteContent } = useApp();

  return (
    <section className="section">
      <div className="container">

        {/* =========================
            ABOUT INTRO
        ========================== */}
        <div className="page-intro centered">

          <span className="eyebrow">
            <Sparkles size={15} />
            About us
          </span>

          {/* ABOUT TITLE */}
          <h1>
            {siteContent.about_title ||
              "Made for the moments you want to remember."}
          </h1>

          {/* ABOUT TEXT */}
          <p>
            {siteContent.about_text ||
              "Oh My Cake by Abi is a home pastry shop built around fresh bakes, personal touches and uncomplicated ordering."}
          </p>

        </div>

        {/* =========================
            ABOUT STORY
        ========================== */}
        <div className="about-grid">

          <div className="about-photo cake-art">
            <div className="cake-illustration small">
              <div className="cake-top" />
              <div className="cake-body" />
              <div className="cake-plate" />
            </div>
          </div>

          <div className="about-copy">

            <span className="eyebrow">
              Our story
            </span>

            {/* STORY TITLE */}
            <h2>
              {siteContent.about_story_title ||
                "A small kitchen with a big sweet tooth."}
            </h2>

            {/* STORY TEXT */}
            <p>
              {siteContent.about_story_text ||
                "Every cake, cookie and cupcake is made with the idea that good food should feel personal. We keep the menu familiar, the process simple and the finishing touches thoughtful."}
            </p>

            {/* =========================
                ABOUT POINTS
            ========================== */}
            <div className="about-points">

              <div>
                <Heart />

                <span>
                  <strong>
                    Made with care
                  </strong>

                  <small>
                    Small-batch bakes for real celebrations.
                  </small>
                </span>
              </div>

              <div>
                <Clock3 />

                <span>
                  <strong>
                    {siteContent.about_opening_hours ||
                      "Open 9 AM – 10 PM"}
                  </strong>

                  <small>
                    Choose a pickup or delivery time
                    that works for you.
                  </small>
                </span>
              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}