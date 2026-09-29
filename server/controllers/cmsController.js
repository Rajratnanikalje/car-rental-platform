const SiteContent = require("../models/SiteContent");

// ==========================================
// CANONICAL DEFAULT CONTENT (RideOn Platform)
// ==========================================
const DEFAULT_CMS = {
  hero: {
    badgeText: "Premium Car Rental Experience",
    headingMain: "Drive Your Journey",
    headingHighlight: "Your Way.",
    description:
      "Rent reliable cars at transparent prices with a smooth booking experience. Choose your car, pick your dates, and hit the road.",
    primaryButtonText: "Explore Cars",
    primaryButtonLink: "/cars",
    secondaryButtonText: "Get Started",
    secondaryButtonLink: "/register",
    trustItems: [],
    vehicleTag: "RideOn Vehicle",
    vehicleStatus: "Available",
    vehicleTitle: "Premium Drive",
    vehicleSubtitle: "Comfort • Style • Performance",
    vehiclePriceText: "Live pricing",
    floatingTag1Title: "Fast Booking",
    floatingTag1Subtitle: "Simple & secure",
    floatingTag2Title: "Trusted Rentals",
    floatingTag2Subtitle: "Transparent pricing",
  },

  about: {
    sectionTag: "Why RideOn",
    title: "Everything you need for a better journey.",
    description:
      "We make car rentals simple with transparent pricing, reliable vehicles and a booking experience designed around your convenience.",
    buttonText: "Find Your Car →",
    buttonLink: "/cars",
    benefits: [
      {
        icon: "💰",
        title: "Transparent Pricing",
        description:
          "Know your rental cost upfront with clear pricing and no unexpected surprises.",
      },
      {
        icon: "🛡️",
        title: "Reliable Cars",
        description:
          "Choose from well-maintained vehicles suitable for city drives, family trips and long journeys.",
      },
      {
        icon: "⚡",
        title: "Easy Booking",
        description:
          "Select your dates, choose your car and complete your booking without unnecessary steps.",
      },
      {
        icon: "📍",
        title: "Flexible Travel",
        description:
          "Enjoy the freedom to travel on your schedule with convenient rental options.",
      },
    ],
    stepsTag: "Simple process",
    stepsTitle: "Rent a car in three easy steps.",
    stepsDescription:
      "From choosing your car to starting your journey, we keep the entire rental process simple and transparent.",
    steps: [
      {
        number: "01",
        icon: "🚗",
        title: "Choose Your Car",
        description:
          "Browse our available cars and choose the vehicle that fits your journey and budget.",
      },
      {
        number: "02",
        icon: "📅",
        title: "Book Your Ride",
        description:
          "Select your rental dates, review the pricing and confirm your booking securely.",
      },
      {
        number: "03",
        icon: "🛣️",
        title: "Enjoy Your Journey",
        description:
          "Pick up your car and enjoy your trip with transparent rental terms and reliable support.",
      },
    ],
  },

  services: { sectionTag: "", title: "", description: "", items: [] },

  fleet: {
    sectionTag: "Our fleet",
    title: "Popular cars for your next journey.",
    description:
      "Choose from comfortable and reliable vehicles designed for different kinds of trips.",
    viewAllText: "View All Cars →",
    ctaTag: "Ready to hit the road?",
    ctaTitle: "Your next journey starts here.",
    ctaDescription:
      "Choose your car, select your dates and get ready for a comfortable journey with RideOn.",
    ctaPrimaryText: "Browse Cars →",
    ctaSecondaryText: "Create Account",
  },

  gallery: {
    sectionTag: "Fleet in Action",
    title: "Explore the RideOn experience.",
    description:
      "See real moments and vehicle photos managed by administrators.",
    items: [],
  },

  testimonials: {
    sectionTag: "",
    title: "",
    description: "",
    items: [],
  },

  contact: {
    phone: "",
    email: "",
    address: "",
    workingHours: "",
    emergencyPhone: "",
    whatsapp: "",
    supportNote: "",
  },

  footer: {
    description:
      "Reliable cars, transparent pricing and a simple rental experience for every journey.",
    copyrightText: "RideOn Car Rentals. All rights reserved.",
    privacyUrl: "#privacy",
    termsUrl: "#terms",
  },

  branding: {
    brandName: "RideOn",
    brandTagline: "Premium Car Rental",
    brandMark: "R",
    announcementActive: false,
    announcementText: "",
  },
};

// ==========================================
// GET ALL CMS CONTENT (PUBLIC)
// Merges MongoDB records with defaults
// ==========================================
exports.getAllCmsContent = async (req, res) => {
  try {
    const records = await SiteContent.find({});
    const cmsMap = {};

    records.forEach((rec) => {
      cmsMap[rec.section] = rec.data;
    });

    const mergedContent = {};
    const keys = Object.keys(DEFAULT_CMS);

    keys.forEach((key) => {
      if (cmsMap[key] !== undefined && cmsMap[key] !== null) {
        // Deep merge or use saved
        if (typeof DEFAULT_CMS[key] === "object" && !Array.isArray(DEFAULT_CMS[key])) {
          mergedContent[key] = { ...DEFAULT_CMS[key], ...cmsMap[key] };
        } else {
          mergedContent[key] = cmsMap[key];
        }
      } else {
        mergedContent[key] = DEFAULT_CMS[key];
      }
    });

    return res.status(200).json({
      success: true,
      content: mergedContent,
    });
  } catch (error) {
    console.error("Get CMS content error:", error);
    // Even if DB fails, return defaults safely
    return res.status(200).json({
      success: true,
      content: DEFAULT_CMS,
      warning: "Loaded canonical defaults",
    });
  }
};

// ==========================================
// GET CMS SECTION (PUBLIC)
// ==========================================
exports.getCmsSection = async (req, res) => {
  try {
    const { section } = req.params;
    const defaultData = DEFAULT_CMS[section];

    if (!defaultData) {
      return res.status(404).json({
        success: false,
        message: `Section '${section}' not recognized`,
      });
    }

    const record = await SiteContent.findOne({ section });

    let finalData = defaultData;
    if (record && record.data) {
      if (typeof defaultData === "object" && !Array.isArray(defaultData)) {
        finalData = { ...defaultData, ...record.data };
      } else {
        finalData = record.data;
      }
    }

    return res.status(200).json({
      success: true,
      section,
      data: finalData,
    });
  } catch (error) {
    console.error(`Get CMS section [${req.params.section}] error:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to load section content",
    });
  }
};

// ==========================================
// UPDATE CMS SECTION (ADMIN ONLY)
// ==========================================
exports.updateCmsSection = async (req, res) => {
  try {
    const { section } = req.params;
    const { data } = req.body;

    if (!DEFAULT_CMS[section]) {
      return res.status(400).json({
        success: false,
        message: `Invalid section name: '${section}'`,
      });
    }

    if (data === undefined || data === null) {
      return res.status(400).json({
        success: false,
        message: "Payload 'data' is required",
      });
    }

    const updated = await SiteContent.findOneAndUpdate(
      { section },
      {
        data,
        updatedBy: req.user?._id || req.user?.id,
      },
      { upsert: true, returnDocument: "after", runValidators: true }
    );

    const AuditLog = require("../models/AuditLog");
    await AuditLog.create({
      actor: req.user?._id || req.user?.id,
      action: `Updated CMS ${section} section`,
      entityType: "CMS",
      entityId: updated._id,
      newValue: { section },
    }).catch((err) => console.error("Audit log error:", err.message));

    return res.status(200).json({
      success: true,
      message: `Section '${section}' updated successfully`,
      section: updated.section,
      data: updated.data,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error(`Update CMS section [${req.params.section}] error:`, error);
    return res.status(500).json({
      success: false,
      message: "Failed to update CMS section",
      error: error.message,
    });
  }
};

// ==========================================
// GET AUDIT LOGS (ADMIN ONLY)
// ==========================================
exports.getAuditLogs = async (req, res) => {
  try {
    const AuditLog = require("../models/AuditLog");
    const logs = await AuditLog.find()
      .populate("actor", "name email role")
      .sort({ createdAt: -1 })
      .limit(100);

    return res.json({
      success: true,
      count: logs.length,
      logs,
    });
  } catch (error) {
    console.error("Get audit logs error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
