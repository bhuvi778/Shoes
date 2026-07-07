import {
  ArrowLeft,
  BriefcaseBusiness,
  Leaf,
  Mail,
  MessageSquare,
  PackageCheck,
  RotateCcw,
  Ruler,
  Star,
  Truck,
  Users
} from "lucide-react";
import { BRAND_NAME, FREE_SHIPPING_THRESHOLD } from "../lib/constants.js";
import { inr } from "../lib/format.js";

const pageContent = {
  "size-guide": {
    group: "Support",
    title: "Size Guide",
    intro: "Measure once, buy confidently. Use this guide to compare foot length, shoe purpose, and fit preference before choosing a pair.",
    icon: Ruler,
    sections: [
      {
        title: "How to measure",
        items: [
          "Place your heel against a wall and stand on paper.",
          "Mark the longest toe, then measure heel-to-toe in centimeters.",
          "Measure both feet and choose the larger measurement."
        ]
      },
      {
        title: "Fit notes",
        items: ["Running shoes should leave a thumb-width in front.", "Leather shoes relax slightly after a few wears.", "Wide feet should size up if the product fit says narrow."]
      }
    ],
    cards: [
      { label: "UK 6", value: "24.5 cm" },
      { label: "UK 7", value: "25.4 cm" },
      { label: "UK 8", value: "26.2 cm" },
      { label: "UK 9", value: "27.1 cm" },
      { label: "UK 10", value: "27.9 cm" },
      { label: "UK 11", value: "28.8 cm" }
    ]
  },
  returns: {
    group: "Support",
    title: "Returns",
    intro: "ASCEND supports a 30-day fit check for unused pairs with original packaging and tags.",
    icon: RotateCcw,
    sections: [
      {
        title: "Return conditions",
        items: ["Shoes must be unused, clean, and in original packaging.", "Sale products follow the same fit-check rules unless marked final sale.", "Refunds are processed after quality check approval."]
      },
      {
        title: "Return process",
        items: ["Open the order from your account dashboard.", "Share pickup address and reason for return.", "Keep the package ready with invoice and box."]
      }
    ],
    cards: [
      { label: "Window", value: "30 days" },
      { label: "Pickup", value: "2-4 days" },
      { label: "Refund", value: "5-7 days" }
    ]
  },
  shipping: {
    group: "Support",
    title: "Shipping",
    intro: `Orders above ${inr(FREE_SHIPPING_THRESHOLD)} unlock free shipping across India. Every order is packed with tracking and delivery updates.`,
    icon: Truck,
    sections: [
      {
        title: "Delivery timelines",
        items: ["Metro deliveries usually arrive in 2-4 business days.", "Non-metro deliveries usually arrive in 4-7 business days.", "Pre-order and limited drops may show a longer dispatch window."]
      },
      {
        title: "Order tracking",
        items: ["Tracking is shared after dispatch.", "Dashboard orders show the current order status.", "Delivery partners may request OTP at handover."]
      }
    ],
    cards: [
      { label: "Free shipping", value: inr(FREE_SHIPPING_THRESHOLD) },
      { label: "Dispatch", value: "24-48 hrs" },
      { label: "Coverage", value: "India" }
    ]
  },
  contact: {
    group: "Support",
    title: "Contact",
    intro: "Need help with fit, payment, order status, or product details? Send a message and the support team will follow up.",
    icon: Mail,
    sections: [
      {
        title: "Support channels",
        items: ["Email: support@ascend.store", "Hours: Monday to Saturday, 10 AM - 7 PM", "For order help, include your ASCEND order number."]
      }
    ],
    cards: [
      { label: "Email", value: "support@ascend.store" },
      { label: "Response", value: "24 hrs" },
      { label: "Payments", value: "Razorpay" }
    ],
    contactForm: true
  },
  about: {
    group: "Company",
    title: "About ASCEND",
    intro: "ASCEND is built for shoppers who compare shoes by purpose, fit, comfort, and finish instead of browsing a static catalog.",
    icon: Users,
    sections: [
      {
        title: "What we curate",
        items: ["Performance runners for daily miles.", "Casual sneakers for repeated wear.", "Leather shoes and boots for premium dressing."]
      },
      {
        title: "How we sell",
        items: ["Clear product photos and multiple image galleries.", "Brand, category, price, offer, and coupon controls from admin.", "Secure Razorpay checkout for online orders."]
      }
    ],
    cards: [
      { label: "Focus", value: "Footwear" },
      { label: "Checkout", value: "Razorpay" },
      { label: "Returns", value: "30 days" }
    ]
  },
  reviews: {
    group: "Company",
    title: "Reviews",
    intro: "Customer feedback helps shoppers decide by comfort, durability, and real-world use.",
    icon: MessageSquare,
    sections: [
      {
        title: "What reviews cover",
        items: ["Fit and sizing accuracy.", "Comfort after long wear.", "Build quality and delivery experience."]
      }
    ],
    cards: [
      { label: "Signals", value: "Fit" },
      { label: "Signals", value: "Comfort" },
      { label: "Signals", value: "Quality" }
    ],
    reviewsPage: true
  },
  careers: {
    group: "Company",
    title: "Careers",
    intro: "ASCEND is a commerce-first footwear store. Future roles will focus on catalog quality, operations, customer support, and brand partnerships.",
    icon: BriefcaseBusiness,
    sections: [
      {
        title: "Teams we hire for",
        items: ["Catalog operations and product onboarding.", "Customer support and returns coordination.", "Brand sourcing and partnership management."]
      },
      {
        title: "How to apply",
        items: ["Send your profile to careers@ascend.store.", "Mention the role area and city.", "Attach relevant commerce or retail experience."]
      }
    ],
    cards: [
      { label: "Catalog", value: "Ops" },
      { label: "Support", value: "CX" },
      { label: "Growth", value: "Brands" }
    ]
  },
  sustainability: {
    group: "Company",
    title: "Sustainability",
    intro: "The most sustainable pair is one that fits well, lasts longer, and does not need repeated returns.",
    icon: Leaf,
    sections: [
      {
        title: "Our direction",
        items: ["Prioritize durable products over disposable trends.", "Improve size guidance to reduce avoidable returns.", "Use cleaner packaging as operations scale."]
      },
      {
        title: "Customer impact",
        items: ["Choose the right size before ordering.", "Care for leather, suede, and knit uppers as recommended.", "Recycle packaging where local facilities support it."]
      }
    ],
    cards: [
      { label: "Less waste", value: "Fit first" },
      { label: "Longer wear", value: "Care" },
      { label: "Packaging", value: "Cleaner" }
    ]
  }
};

export default function InfoPage({ slug, testimonials = [], onBack, onOpenCollection, onContactSubmit }) {
  const page = pageContent[slug] || pageContent.about;
  const Icon = page.icon || PackageCheck;

  return (
    <main className="page-shell info-page">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft />
        Back to store
      </button>

      <section className="info-hero">
        <div>
          <p className="eyebrow">{page.group}</p>
          <h1>{page.title}</h1>
          <p>{page.intro}</p>
        </div>
        <span className="info-hero-icon">
          <Icon />
        </span>
      </section>

      {page.cards?.length > 0 && (
        <section className="info-card-grid" aria-label={`${page.title} highlights`}>
          {page.cards.map((card, index) => (
            <article className="info-card" key={`${card.label}-${card.value}-${index}`}>
              <span>{card.label}</span>
              <strong>{card.value}</strong>
            </article>
          ))}
        </section>
      )}

      <section className="info-content-grid">
        {page.sections.map((section) => (
          <article className="info-panel" key={section.title}>
            <h2>{section.title}</h2>
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      {page.reviewsPage && (
        <section className="info-panel info-reviews">
          <h2>Customer reviews</h2>
          <div className="info-review-grid">
            {(testimonials.length ? testimonials : [{ name: BRAND_NAME, role: "Customer team", quote: "Reviews added from admin will appear here.", rating: 5 }]).map((item) => (
              <article className="testimonial-card" key={`${item.name}-${item.quote}`}>
                <div className="stars" aria-label={`${item.rating || 5} star review`}>
                  {Array.from({ length: item.rating || 5 }).map((_, index) => (
                    <Star key={index} />
                  ))}
                </div>
                <p>"{item.quote}"</p>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {page.contactForm && (
        <form className="info-panel info-contact-form" onSubmit={onContactSubmit}>
          <h2>Send a message</h2>
          <div className="info-form-grid">
            <label>
              <span>Name</span>
              <input type="text" required />
            </label>
            <label>
              <span>Email</span>
              <input type="email" required />
            </label>
          </div>
          <label>
            <span>Message</span>
            <textarea required />
          </label>
          <button className="checkout-button" type="submit">Send Message</button>
        </form>
      )}

      <section className="info-cta">
        <div>
          <p className="eyebrow">Continue shopping</p>
          <h2>Explore the latest ASCEND catalog.</h2>
        </div>
        <button className="checkout-button" type="button" onClick={onOpenCollection}>Browse Collection</button>
      </section>
    </main>
  );
}
