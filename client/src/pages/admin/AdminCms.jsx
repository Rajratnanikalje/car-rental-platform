import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { DEFAULT_CMS_DATA } from "../../hooks/useCms";
import AdminImageUpload from "../../components/admin/AdminImageUpload";
import "./AdminPages.css";
import "./AdminCms.css";

const API_URL = import.meta.env.VITE_API_URL;

const TABS = [
  { id: "hero", label: "Hero Section", icon: "🚀" },
  { id: "about", label: "About & Steps", icon: "ℹ️" },
  { id: "services", label: "Services", icon: "🛠️" },
  { id: "fleet", label: "Fleet Showcase", icon: "🚗" },
  { id: "gallery", label: "Gallery", icon: "🖼️" },
  { id: "testimonials", label: "Testimonials", icon: "💬" },
  { id: "contact", label: "Contact Info", icon: "📞" },
  { id: "footer", label: "Footer & Social", icon: "📄" },
  { id: "branding", label: "Branding & Banner", icon: "🎨" },
];

export default function AdminCms() {
  const [activeTab, setActiveTab] = useState("hero");
  const [cmsData, setCmsData] = useState(DEFAULT_CMS_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: "", text: "" });

  // Fetch full CMS content
  const loadContent = useCallback(async (signal) => {
    try {
      const res = await fetch(`${API_URL}/cms`, {
        credentials: "include",
        signal,
      });
      const data = await res.json();
      if (res.ok && data?.content) {
        setCmsData((prev) => ({
          ...prev,
          ...data.content,
        }));
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Failed to load CMS content:", err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      loadContent(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadContent]);

  // Generic field update for current active tab
  const handleFieldChange = (field, value) => {
    setCmsData((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value,
      },
    }));
  };

  // Update item in a list array
  const handleListItemChange = (listKey, index, field, value) => {
    setCmsData((prev) => {
      const list = [...(prev[activeTab][listKey] || [])];
      list[index] = { ...list[index], [field]: value };
      return {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          [listKey]: list,
        },
      };
    });
  };

  // Add new item to a list array
  const handleAddListItem = (listKey, template) => {
    setCmsData((prev) => {
      const list = [...(prev[activeTab][listKey] || []), template];
      return {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          [listKey]: list,
        },
      };
    });
  };

  // Remove item from a list array
  const handleRemoveListItem = (listKey, index) => {
    setCmsData((prev) => {
      const list = prev[activeTab][listKey].filter((_, i) => i !== index);
      return {
        ...prev,
        [activeTab]: {
          ...prev[activeTab],
          [listKey]: list,
        },
      };
    });
  };

  // Save current active tab section
  const handleSaveSection = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setStatusMsg({ type: "", text: "" });

      const payload = {
        data: cmsData[activeTab],
      };

      const res = await fetch(`${API_URL}/cms/${activeTab}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        setStatusMsg({
          type: "success",
          text: `Section '${activeTab.toUpperCase()}' saved and published live!`,
        });
      } else {
        setStatusMsg({
          type: "error",
          text: result.message || "Failed to save section changes.",
        });
      }
    } catch (err) {
      console.error("CMS save error:", err);
      setStatusMsg({
        type: "error",
        text: "Network error while saving changes.",
      });
    } finally {
      setSaving(false);
    }
  };

  const currentHero = cmsData.hero || {};
  const currentAbout = cmsData.about || {};
  const currentServices = cmsData.services || {};
  const currentFleet = cmsData.fleet || {};
  const currentGallery = cmsData.gallery || {};
  const currentTestimonials = cmsData.testimonials || {};
  const currentContact = cmsData.contact || {};
  const currentFooter = cmsData.footer || {};
  const currentBranding = cmsData.branding || {};

  return (
    <div className="admin-page-container admin-cms-container">
      {/* Header */}
      <div className="cms-header-row">
        <div>
          <h1 className="admin-page-title">Website CMS Manager</h1>
          <p className="admin-page-subtitle">
            Manage public website text, sections, testimonials, gallery, and branding live in MongoDB.
          </p>
        </div>

        <div className="cms-header-actions">
          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            className="cms-preview-btn"
          >
            <span>🌐</span>
            <span>View Public Website</span>
          </Link>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="cms-tabs-bar">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`cms-tab-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => {
              setActiveTab(tab.id);
              setStatusMsg({ type: "", text: "" });
            }}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Toast Alert */}
      {statusMsg.text && (
        <div className={`cms-toast ${statusMsg.type}`}>
          <span>{statusMsg.type === "success" ? "✅" : "⚠️"}</span>
          <span>{statusMsg.text}</span>
        </div>
      )}

      {loading ? (
        <div className="admin-loading-state glass-card">
          <div className="spinner" />
          <p>Loading CMS configuration...</p>
        </div>
      ) : (
        <form onSubmit={handleSaveSection} className="cms-editor-card glass-card">
          {/* =========================================================
              1. HERO TAB
          ========================================================== */}
          {activeTab === "hero" && (
            <>
              <div className="cms-section-heading">
                <h3>Hero Section Configuration</h3>
                <p>Customize the primary headline, tagline, buttons, and visual preview card.</p>
              </div>

              <div className="cms-form-grid">
                <div className="cms-form-group col-span-2">
                  <label>Top Badge Text</label>
                  <input
                    type="text"
                    value={currentHero.badgeText || ""}
                    onChange={(e) => handleFieldChange("badgeText", e.target.value)}
                    placeholder="e.g. Premium Car Rental Experience"
                  />
                </div>

                <div className="cms-form-group col-span-2">
                  <AdminImageUpload
                    value={currentHero.heroBgImage || ""}
                    onChange={(val) => handleFieldChange("heroBgImage", val)}
                    label="Hero Background Photo (Gallery / File)"
                    helpText="Upload a banner photo from your gallery (optional, leave empty for dark gradient)"
                    previewHeight="160px"
                  />
                </div>

                <div className="cms-form-group">
                  <label>Main Headline</label>
                  <input
                    type="text"
                    value={currentHero.headingMain || ""}
                    onChange={(e) => handleFieldChange("headingMain", e.target.value)}
                    placeholder="e.g. Drive Your Journey"
                  />
                </div>

                <div className="cms-form-group">
                  <label>Highlighted Headline (Gradient Accent)</label>
                  <input
                    type="text"
                    value={currentHero.headingHighlight || ""}
                    onChange={(e) => handleFieldChange("headingHighlight", e.target.value)}
                    placeholder="e.g. Your Way."
                  />
                </div>

                <div className="cms-form-group col-span-2">
                  <label>Hero Subtitle / Description</label>
                  <textarea
                    value={currentHero.description || ""}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                    placeholder="Brief description for renters"
                  />
                </div>

                <div className="cms-form-group">
                  <label>Primary Button Label</label>
                  <input
                    type="text"
                    value={currentHero.primaryButtonText || ""}
                    onChange={(e) => handleFieldChange("primaryButtonText", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>Primary Button Link</label>
                  <input
                    type="text"
                    value={currentHero.primaryButtonLink || ""}
                    onChange={(e) => handleFieldChange("primaryButtonLink", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>Secondary Button Label</label>
                  <input
                    type="text"
                    value={currentHero.secondaryButtonText || ""}
                    onChange={(e) => handleFieldChange("secondaryButtonText", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>Secondary Button Link</label>
                  <input
                    type="text"
                    value={currentHero.secondaryButtonLink || ""}
                    onChange={(e) => handleFieldChange("secondaryButtonLink", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>Preview Card Title</label>
                  <input
                    type="text"
                    value={currentHero.vehicleTitle || ""}
                    onChange={(e) => handleFieldChange("vehicleTitle", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>Preview Card Subtitle</label>
                  <input
                    type="text"
                    value={currentHero.vehicleSubtitle || ""}
                    onChange={(e) => handleFieldChange("vehicleSubtitle", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* =========================================================
              2. ABOUT & STEPS TAB
          ========================================================== */}
          {activeTab === "about" && (
            <>
              <div className="cms-section-heading">
                <h3>About Us & How It Works</h3>
                <p>Edit the platform value proposition, benefits cards, and the 3-step rental journey.</p>
              </div>

              <div className="cms-form-grid">
                <div className="cms-form-group">
                  <label>About Tag</label>
                  <input
                    type="text"
                    value={currentAbout.sectionTag || ""}
                    onChange={(e) => handleFieldChange("sectionTag", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>About Title</label>
                  <input
                    type="text"
                    value={currentAbout.title || ""}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                  />
                </div>

                <div className="cms-form-group col-span-2">
                  <label>About Description</label>
                  <textarea
                    value={currentAbout.description || ""}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                  />
                </div>
              </div>

              {/* Benefits Cards */}
              <div className="cms-items-header">
                <h4>Platform Benefits (Why RideOn)</h4>
                <button
                  type="button"
                  className="cms-add-btn"
                  onClick={() =>
                    handleAddListItem("benefits", {
                      icon: "✨",
                      title: "New Benefit",
                      description: "Benefit explanation text",
                    })
                  }
                >
                  + Add Benefit
                </button>
              </div>

              <div className="cms-items-list">
                {(currentAbout.benefits || []).map((b, idx) => (
                  <div key={idx} className="cms-item-card">
                    <div className="cms-item-top">
                      <span className="cms-item-badge">Benefit #{idx + 1}</span>
                      <button
                        type="button"
                        className="cms-remove-btn"
                        onClick={() => handleRemoveListItem("benefits", idx)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="cms-form-grid">
                      <div className="cms-form-group">
                        <label>Icon (Emoji)</label>
                        <input
                          type="text"
                          value={b.icon || ""}
                          onChange={(e) =>
                            handleListItemChange("benefits", idx, "icon", e.target.value)
                          }
                        />
                      </div>
                      <div className="cms-form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          value={b.title || ""}
                          onChange={(e) =>
                            handleListItemChange("benefits", idx, "title", e.target.value)
                          }
                        />
                      </div>
                      <div className="cms-form-group col-span-2">
                        <label>Description</label>
                        <input
                          type="text"
                          value={b.description || ""}
                          onChange={(e) =>
                            handleListItemChange("benefits", idx, "description", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Steps */}
              <div className="cms-items-header">
                <h4>How It Works (Steps)</h4>
              </div>

              <div className="cms-items-list">
                {(currentAbout.steps || []).map((s, idx) => (
                  <div key={idx} className="cms-item-card">
                    <div className="cms-item-top">
                      <span className="cms-item-badge">Step {s.number || idx + 1}</span>
                    </div>
                    <div className="cms-form-grid">
                      <div className="cms-form-group">
                        <label>Step Number</label>
                        <input
                          type="text"
                          value={s.number || ""}
                          onChange={(e) =>
                            handleListItemChange("steps", idx, "number", e.target.value)
                          }
                        />
                      </div>
                      <div className="cms-form-group">
                        <label>Icon</label>
                        <input
                          type="text"
                          value={s.icon || ""}
                          onChange={(e) =>
                            handleListItemChange("steps", idx, "icon", e.target.value)
                          }
                        />
                      </div>
                      <div className="cms-form-group col-span-2">
                        <label>Title</label>
                        <input
                          type="text"
                          value={s.title || ""}
                          onChange={(e) =>
                            handleListItemChange("steps", idx, "title", e.target.value)
                          }
                        />
                      </div>
                      <div className="cms-form-group col-span-2">
                        <label>Description</label>
                        <input
                          type="text"
                          value={s.description || ""}
                          onChange={(e) =>
                            handleListItemChange("steps", idx, "description", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* =========================================================
              3. SERVICES TAB
          ========================================================== */}
          {activeTab === "services" && (
            <>
              <div className="cms-section-heading">
                <h3>Services & Offerings</h3>
                <p>Manage the mobility service cards displayed to customers.</p>
              </div>

              <div className="cms-form-grid">
                <div className="cms-form-group">
                  <label>Section Tag</label>
                  <input
                    type="text"
                    value={currentServices.sectionTag || ""}
                    onChange={(e) => handleFieldChange("sectionTag", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>Section Title</label>
                  <input
                    type="text"
                    value={currentServices.title || ""}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                  />
                </div>

                <div className="cms-form-group col-span-2">
                  <label>Section Description</label>
                  <textarea
                    value={currentServices.description || ""}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                  />
                </div>
              </div>

              <div className="cms-items-header">
                <h4>Service Offerings</h4>
                <button
                  type="button"
                  className="cms-add-btn"
                  onClick={() =>
                    handleAddListItem("items", {
                      icon: "🚗",
                      title: "New Service",
                      description: "Service description here",
                    })
                  }
                >
                  + Add Service
                </button>
              </div>

              <div className="cms-items-list">
                {(currentServices.items || []).map((svc, idx) => (
                  <div key={idx} className="cms-item-card">
                    <div className="cms-item-top">
                      <span className="cms-item-badge">Service #{idx + 1}</span>
                      <button
                        type="button"
                        className="cms-remove-btn"
                        onClick={() => handleRemoveListItem("items", idx)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="cms-form-grid">
                      <div className="cms-form-group">
                        <label>Icon</label>
                        <input
                          type="text"
                          value={svc.icon || ""}
                          onChange={(e) =>
                            handleListItemChange("items", idx, "icon", e.target.value)
                          }
                        />
                      </div>
                      <div className="cms-form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          value={svc.title || ""}
                          onChange={(e) =>
                            handleListItemChange("items", idx, "title", e.target.value)
                          }
                        />
                      </div>
                      <div className="cms-form-group col-span-2">
                        <label>Description</label>
                        <textarea
                          value={svc.description || ""}
                          onChange={(e) =>
                            handleListItemChange("items", idx, "description", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* =========================================================
              4. FLEET SHOWCASE TAB
          ========================================================== */}
          {activeTab === "fleet" && (
            <>
              <div className="cms-section-heading">
                <h3>Fleet Showcase & CTA Settings</h3>
                <p>Configure headings for the popular cars grid and the final call-to-action banner.</p>
              </div>

              <div className="cms-form-grid">
                <div className="cms-form-group">
                  <label>Fleet Section Tag</label>
                  <input
                    type="text"
                    value={currentFleet.sectionTag || ""}
                    onChange={(e) => handleFieldChange("sectionTag", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>Fleet Section Title</label>
                  <input
                    type="text"
                    value={currentFleet.title || ""}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                  />
                </div>

                <div className="cms-form-group col-span-2">
                  <label>Fleet Description</label>
                  <textarea
                    value={currentFleet.description || ""}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>View All Cars Button Text</label>
                  <input
                    type="text"
                    value={currentFleet.viewAllText || ""}
                    onChange={(e) => handleFieldChange("viewAllText", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>CTA Label Tag</label>
                  <input
                    type="text"
                    value={currentFleet.ctaTag || ""}
                    onChange={(e) => handleFieldChange("ctaTag", e.target.value)}
                  />
                </div>

                <div className="cms-form-group col-span-2">
                  <label>CTA Title</label>
                  <input
                    type="text"
                    value={currentFleet.ctaTitle || ""}
                    onChange={(e) => handleFieldChange("ctaTitle", e.target.value)}
                  />
                </div>

                <div className="cms-form-group col-span-2">
                  <label>CTA Description</label>
                  <textarea
                    value={currentFleet.ctaDescription || ""}
                    onChange={(e) => handleFieldChange("ctaDescription", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* =========================================================
              5. GALLERY TAB
          ========================================================== */}
          {activeTab === "gallery" && (
            <>
              <div className="cms-section-heading">
                <h3>Gallery Showcase</h3>
                <p>Showcase real fleet photos, road trip moments, and vehicle categories.</p>
              </div>

              <div className="cms-form-grid">
                <div className="cms-form-group">
                  <label>Section Tag</label>
                  <input
                    type="text"
                    value={currentGallery.sectionTag || ""}
                    onChange={(e) => handleFieldChange("sectionTag", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>Section Title</label>
                  <input
                    type="text"
                    value={currentGallery.title || ""}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                  />
                </div>

                <div className="cms-form-group col-span-2">
                  <label>Section Description</label>
                  <textarea
                    value={currentGallery.description || ""}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                  />
                </div>
              </div>

              <div className="cms-items-header">
                <h4>Gallery Photos</h4>
                <button
                  type="button"
                  className="cms-add-btn"
                  onClick={() =>
                    handleAddListItem("items", {
                      title: "New Photo",
                      category: "Fleet",
                      image: "",
                    })
                  }
                >
                  + Add Photo
                </button>
              </div>

              <div className="cms-items-list">
                {(currentGallery.items || []).map((img, idx) => (
                  <div key={idx} className="cms-item-card">
                    <div className="cms-item-top">
                      <span className="cms-item-badge">Photo #{idx + 1}</span>
                      <button
                        type="button"
                        className="cms-remove-btn"
                        onClick={() => handleRemoveListItem("items", idx)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="cms-form-grid">
                      <div className="cms-form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          value={img.title || ""}
                          onChange={(e) =>
                            handleListItemChange("items", idx, "title", e.target.value)
                          }
                        />
                      </div>
                      <div className="cms-form-group">
                        <label>Category Tag</label>
                        <input
                          type="text"
                          value={img.category || ""}
                          onChange={(e) =>
                            handleListItemChange("items", idx, "category", e.target.value)
                          }
                        />
                      </div>
                      <div className="cms-form-group col-span-2">
                        <AdminImageUpload
                          value={img.image || ""}
                          onChange={(val) =>
                            handleListItemChange("items", idx, "image", val)
                          }
                          label="Gallery Photo (Upload from Gallery / Files)"
                          helpText="Upload directly from your phone or computer gallery"
                          previewHeight="150px"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* =========================================================
              6. TESTIMONIALS TAB
          ========================================================== */}
          {activeTab === "testimonials" && (
            <>
              <div className="cms-section-heading">
                <h3>Customer Testimonials</h3>
                <p>Display real customer stories, reviews, and star ratings on the public site.</p>
              </div>

              <div className="cms-form-grid">
                <div className="cms-form-group">
                  <label>Section Tag</label>
                  <input
                    type="text"
                    value={currentTestimonials.sectionTag || ""}
                    onChange={(e) => handleFieldChange("sectionTag", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>Section Title</label>
                  <input
                    type="text"
                    value={currentTestimonials.title || ""}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                  />
                </div>

                <div className="cms-form-group col-span-2">
                  <label>Section Description</label>
                  <textarea
                    value={currentTestimonials.description || ""}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                  />
                </div>
              </div>

              <div className="cms-items-header">
                <h4>Customer Reviews</h4>
                <button
                  type="button"
                  className="cms-add-btn"
                  onClick={() =>
                    handleAddListItem("items", {
                      name: "Happy Renter",
                      role: "Verified Driver",
                      rating: 5,
                      comment: "Great experience with RideOn!",
                      initials: "HR",
                    })
                  }
                >
                  + Add Review
                </button>
              </div>

              <div className="cms-items-list">
                {(currentTestimonials.items || []).map((t, idx) => (
                  <div key={idx} className="cms-item-card">
                    <div className="cms-item-top">
                      <span className="cms-item-badge">Review #{idx + 1}</span>
                      <button
                        type="button"
                        className="cms-remove-btn"
                        onClick={() => handleRemoveListItem("items", idx)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="cms-form-grid">
                      <div className="cms-form-group">
                        <label>Customer Name</label>
                        <input
                          type="text"
                          value={t.name || ""}
                          onChange={(e) =>
                            handleListItemChange("items", idx, "name", e.target.value)
                          }
                        />
                      </div>
                      <div className="cms-form-group">
                        <label>Role / City</label>
                        <input
                          type="text"
                          value={t.role || ""}
                          onChange={(e) =>
                            handleListItemChange("items", idx, "role", e.target.value)
                          }
                        />
                      </div>
                      <div className="cms-form-group">
                        <label>Star Rating (1 - 5)</label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={t.rating || 5}
                          onChange={(e) =>
                            handleListItemChange("items", idx, "rating", Number(e.target.value))
                          }
                        />
                      </div>
                      <div className="cms-form-group">
                        <label>Avatar Initials</label>
                        <input
                          type="text"
                          maxLength="3"
                          value={t.initials || ""}
                          onChange={(e) =>
                            handleListItemChange("items", idx, "initials", e.target.value)
                          }
                        />
                      </div>
                      <div className="cms-form-group col-span-2">
                        <label>Review Quote</label>
                        <textarea
                          value={t.comment || ""}
                          onChange={(e) =>
                            handleListItemChange("items", idx, "comment", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* =========================================================
              7. CONTACT TAB
          ========================================================== */}
          {activeTab === "contact" && (
            <>
              <div className="cms-section-heading">
                <h3>Contact & Support Information</h3>
                <p>Update phone numbers, official email, physical headquarters, and emergency helplines.</p>
              </div>

              <div className="cms-form-grid">
                <div className="cms-form-group">
                  <label>Primary Phone</label>
                  <input
                    type="text"
                    value={currentContact.phone || ""}
                    onChange={(e) => handleFieldChange("phone", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>Support Email</label>
                  <input
                    type="email"
                    value={currentContact.email || ""}
                    onChange={(e) => handleFieldChange("email", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>WhatsApp Number (With country code)</label>
                  <input
                    type="text"
                    value={currentContact.whatsapp || ""}
                    onChange={(e) => handleFieldChange("whatsapp", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>Emergency 24/7 Helpline</label>
                  <input
                    type="text"
                    value={currentContact.emergencyPhone || ""}
                    onChange={(e) => handleFieldChange("emergencyPhone", e.target.value)}
                  />
                </div>

                <div className="cms-form-group col-span-2">
                  <label>Office Address</label>
                  <textarea
                    value={currentContact.address || ""}
                    onChange={(e) => handleFieldChange("address", e.target.value)}
                  />
                </div>

                <div className="cms-form-group col-span-2">
                  <label>Working Hours</label>
                  <input
                    type="text"
                    value={currentContact.workingHours || ""}
                    onChange={(e) => handleFieldChange("workingHours", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* =========================================================
              8. FOOTER TAB
          ========================================================== */}
          {activeTab === "footer" && (
            <>
              <div className="cms-section-heading">
                <h3>Footer & Social Media Links</h3>
                <p>Customize the footer tagline, copyright statement, and official social media handles.</p>
              </div>

              <div className="cms-form-grid">
                <div className="cms-form-group col-span-2">
                  <label>Footer Brand Description</label>
                  <textarea
                    value={currentFooter.description || ""}
                    onChange={(e) => handleFieldChange("description", e.target.value)}
                  />
                </div>

                <div className="cms-form-group col-span-2">
                  <label>Copyright Statement</label>
                  <input
                    type="text"
                    value={currentFooter.copyrightText || ""}
                    onChange={(e) => handleFieldChange("copyrightText", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>Facebook Page URL</label>
                  <input
                    type="text"
                    value={currentFooter.facebookUrl || ""}
                    onChange={(e) => handleFieldChange("facebookUrl", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>Twitter / X URL</label>
                  <input
                    type="text"
                    value={currentFooter.twitterUrl || ""}
                    onChange={(e) => handleFieldChange("twitterUrl", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>Instagram URL</label>
                  <input
                    type="text"
                    value={currentFooter.instagramUrl || ""}
                    onChange={(e) => handleFieldChange("instagramUrl", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>LinkedIn URL</label>
                  <input
                    type="text"
                    value={currentFooter.linkedinUrl || ""}
                    onChange={(e) => handleFieldChange("linkedinUrl", e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          {/* =========================================================
              9. BRANDING TAB
          ========================================================== */}
          {activeTab === "branding" && (
            <>
              <div className="cms-section-heading">
                <h3>Branding & Announcement Banner</h3>
                <p>Manage brand marks, brand name, and the top promotional banner across all public pages.</p>
              </div>

              <div className="cms-form-grid">
                <div className="cms-form-group">
                  <label>Brand Name</label>
                  <input
                    type="text"
                    value={currentBranding.brandName || ""}
                    onChange={(e) => handleFieldChange("brandName", e.target.value)}
                  />
                </div>

                <div className="cms-form-group">
                  <label>Brand Mark / Logo Letter</label>
                  <input
                    type="text"
                    maxLength="2"
                    value={currentBranding.brandMark || ""}
                    onChange={(e) => handleFieldChange("brandMark", e.target.value)}
                  />
                </div>

                <div className="cms-form-group col-span-2">
                  <label>Brand Tagline</label>
                  <input
                    type="text"
                    value={currentBranding.brandTagline || ""}
                    onChange={(e) => handleFieldChange("brandTagline", e.target.value)}
                  />
                </div>

                <div className="cms-form-group col-span-2">
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={!!currentBranding.announcementActive}
                      onChange={(e) => handleFieldChange("announcementActive", e.target.checked)}
                      style={{ width: "auto" }}
                    />
                    <span>Enable Top Announcement Banner on Customer Website</span>
                  </label>
                </div>

                <div className="cms-form-group col-span-2">
                  <label>Announcement Banner Message</label>
                  <textarea
                    value={currentBranding.announcementText || ""}
                    onChange={(e) => handleFieldChange("announcementText", e.target.value)}
                    placeholder="e.g. Special Offer: Flat 10% off on all bookings with code RIDE10!"
                  />
                </div>
              </div>
            </>
          )}

          {/* Action Bar */}
          <div className="cms-actions-bar">
            <button
              type="submit"
              disabled={saving}
              className="shiny-button cms-save-btn"
            >
              {saving ? "Saving Changes..." : `Save ${activeTab.toUpperCase()} Section`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

