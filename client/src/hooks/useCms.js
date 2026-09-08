import { API_URL } from "../config/api";
import { useState, useEffect, useCallback } from "react";

// Canonical fallback state matching backend defaults
export const DEFAULT_CMS_DATA = {
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
    trustItems: [
      { title: "Flexible", subtitle: "Vehicle plans" },
      { title: "24/7", subtitle: "Booking Access" },
      { title: "Clear", subtitle: "Pricing" },
    ],
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

  services: {
    sectionTag: "Our Services",
    title: "Premium mobility solutions tailored for you.",
    description:
      "Whether you need a daily rental, outstation trip, or a professional driver, RideOn has you covered.",
    items: [
      {
        icon: "🚗",
        title: "Self-Drive Rental",
        description:
          "Freedom of driving pristine, verified vehicles with flexible KM packages and zero hidden charges.",
      },
      {
        icon: "👨‍✈️",
        title: "Chauffeur Driven",
        description:
          "Trained, background-verified professional drivers for business trips, airport drops, or special events.",
      },
      {
        icon: "🛣️",
        title: "Outstation Trips",
        description:
          "Seamless inter-city one-way drops and round trips with 24/7 dedicated roadside assistance.",
      },
      {
        icon: "👥",
        title: "Shared Rides",
        description:
          "Affordable shared seat booking for popular city corridors with verified co-passengers.",
      },
      {
        icon: "⚡",
        title: "Instant Verification",
        description:
          "Digital driving license and Aadhaar KYC verification approved within minutes.",
      },
      {
        icon: "🛡️",
        title: "Comprehensive Insurance",
        description:
          "All vehicles are fully insured with 24/7 breakdown assistance for peace of mind on every journey.",
      },
    ],
  },

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
    sectionTag: "Renter Stories",
    title: "Loved by thousands of happy travelers.",
    description:
      "Read what verified renters and regular road-trippers have to say about their RideOn journey.",
    items: [
      {
        name: "Rahul Sharma",
        role: "Frequent Traveler • Bengaluru",
        rating: 5,
        comment:
          "Booking was completely seamless! The car was delivered sanitized, smelled fresh, and performed flawlessly on my Western Ghats trip.",
        initials: "RS",
      },
      {
        name: "Priya Nair",
        role: "Product Designer • Mumbai",
        rating: 5,
        comment:
          "Transparent pricing without any hidden charges at the end. The flexible KM package saved me over 30% compared to traditional car hires!",
        initials: "PN",
      },
      {
        name: "Amit Verma",
        role: "Weekend Explorer • Pune",
        rating: 5,
        comment:
          "Driver verification and instant security deposit refund was phenomenal. RideOn is now my only go-to platform for self-drive cars.",
        initials: "AV",
      },
    ],
  },

  contact: {
    phone: "+91 98765 43210",
    email: "support@rideon.com",
    address: "RideOn Central Hub, Outer Ring Road, Bengaluru, Karnataka, India",
    workingHours: "24 Hours / 7 Days a Week",
    emergencyPhone: "+91 98765 43219",
    whatsapp: "+919876543210",
    supportNote: "Our team responds to all inquiries within 15 minutes.",
  },

  footer: {
    description:
      "Reliable cars, transparent pricing and a simple rental experience for every journey.",
    copyrightText: "RideOn Car Rentals. All rights reserved.",
    facebookUrl: "https://facebook.com",
    twitterUrl: "https://twitter.com",
    instagramUrl: "https://instagram.com",
    linkedinUrl: "https://linkedin.com",
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

export function useCms() {
  const [cms, setCms] = useState(DEFAULT_CMS_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCms = useCallback(async (signal) => {
    try {
      const res = await fetch(`${API_URL}/cms`, { signal });
      const data = await res.json();
      if (res.ok && data?.content) {
        setCms((prev) => ({
          ...prev,
          ...data.content,
        }));
        setError(null);
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.warn("CMS content fetch fallback to defaults:", err.message);
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetchCms(controller.signal);
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [fetchCms]);

  return {
    cms,
    loading,
    error,
    refreshCms: () => fetchCms(),
  };
}

