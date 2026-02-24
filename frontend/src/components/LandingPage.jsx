import React from "react";

import { Link, useNavigate } from "react-router-dom";

// Add Material Icons import in your index.html or here's a link to include
// Add this to your public/index.html in the head section:
// <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0,1" />

const LandingPage = () => {
  const navigate = useNavigate();

  const landingImages = {
    hero: "https://images.pexels.com/photos/6281827/pexels-photo-6281827.jpeg?auto=compress&cs=tinysrgb&w=1600",
    feature:
      "https://images.pexels.com/photos/6281830/pexels-photo-6281830.jpeg?auto=compress&cs=tinysrgb&w=1600",
  };

  const features = [
    {
      icon: "tune",
      title: "Adaptive Study Planning",
      description:
        "AI-powered study hour allocation based on your performance, difficulty, and exam urgency.",
    },
    {
      icon: "insights",
      title: "Performance Tracking",
      description:
        "Weekly score monitoring with clear trends so you can improve consistently.",
    },
    {
      icon: "school",
      title: "Academic Path Recommendations",
      description:
        "Guidance based on your subject strengths and long-term performance patterns.",
    },
    {
      icon: "autorenew",
      title: "Real-time Adaptation",
      description:
        "Study plans adjust as your scores improve or decline during the term.",
    },
    {
      icon: "bar_chart",
      title: "Progress Analytics",
      description:
        "Understand study utilization, top subjects, and performance distribution.",
    },
    {
      icon: "verified_user",
      title: "Secure and Private",
      description:
        "Academic data is protected and role-based access keeps records controlled.",
    },
  ];

  const stats = [
    { number: "35%", label: "Average Grade Improvement" },
    { number: "2.5x", label: "Study Efficiency" },
    { number: "500+", label: "Students Helped" },
    { number: "95%", label: "User Satisfaction" },
  ];

  const pricing = [
    {
      name: "Basic",
      price: "Free",
      features: [
        "Up to 5 subjects",
        "Basic study planning",
        "Performance tracking",
        "Mobile app access",
      ],
      highlighted: false,
    },
    {
      name: "Premium",
      price: "$9.99",
      features: [
        "Unlimited subjects",
        "Advanced analytics",
        "Priority support",
        "Custom recommendations",
        "Export reports",
      ],
      highlighted: true,
    },
    {
      name: "School",
      price: "$2/student",
      features: [
        "Full school integration",
        "Admin dashboard",
        "Bulk student management",
        "Custom branding",
        "API access",
      ],
      highlighted: false,
    },
  ];

  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div id="top" className="min-h-screen bg-white font-sans antialiased">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white font-bold shadow-md">
              S
            </div>
            <span className="text-lg font-bold text-gray-900">SmartStudy</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <button
              type="button"
              onClick={() => scrollToSection("features")}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("how-it-works")}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              How It Works
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("pricing")}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </button>
            <button
              onClick={() => navigate("/login")}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate("/login?mode=signup")}
              className="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white py-16 lg:py-24">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <div className="inline-flex rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 px-4 py-2 text-sm font-medium text-blue-700 border border-blue-200">
                🚀 AI-powered planning for academic growth
              </div>
              <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
                Study smarter with{" "}
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  adaptive schedules
                </span>{" "}
                and clear progress insights.
              </h1>
              <p className="mt-6 text-lg text-gray-600 max-w-2xl">
                Plan weekly study time, track your scores, and get a schedule
                that adjusts automatically as your performance changes.
              </p>
              <div className="mt-4 space-y-2 text-sm text-gray-700">
                <p>1. Add subjects and exam dates.</p>
                <p>2. Log scores each week.</p>
                <p>3. Follow your updated study schedule.</p>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl opacity-20 blur-2xl"></div>
              <div className="relative overflow-hidden rounded-2xl shadow-2xl aspect-[4/3] sm:aspect-[16/11] lg:aspect-[4/3] max-h-[520px]">
                <img
                  src={landingImages.hero}
                  alt="Students learning with computers in a classroom"
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4 lg:mt-20">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl bg-white p-6 text-center shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {stat.number}
                </p>
                <p className="mt-2 text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Features
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Everything you need to succeed
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Clear tools for students, school admins, and full-school use.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl bg-white p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-lg transition-transform duration-300 group-hover:scale-110">
                  <span className="material-symbols-outlined text-2xl">
                    {feature.icon}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-12 overflow-hidden rounded-2xl shadow-xl">
            <img
              src={landingImages.feature}
              alt="Students collaborating and studying with technology"
              className="h-56 sm:h-72 lg:h-80 w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Process
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Get started in 4 simple steps
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Start in minutes and learn with structure.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Create account",
                text: "Sign up as a student or connect with your school.",
              },
              {
                step: "02",
                title: "Add subjects",
                text: "Set up your subjects, difficulty level, and exam dates.",
              },
              {
                step: "03",
                title: "Track scores",
                text: "Log performance each week to update learning signals.",
              },
              {
                step: "04",
                title: "Follow schedule",
                text: "Use AI-generated study sessions and improve consistency.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl bg-white p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="absolute top-4 right-4 text-5xl font-bold text-blue-100">
                  {item.step}
                </div>
                <h3 className="relative text-xl font-semibold text-gray-900">
                  {item.title}
                </h3>
                <p className="relative mt-2 text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
              Pricing
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Simple, transparent pricing
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Choose a plan that matches your learning or school setup.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3 max-w-5xl mx-auto">
            {pricing.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-8 ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-blue-50 to-white border-2 border-blue-500 shadow-xl scale-105 lg:scale-110 hover:scale-[1.07] lg:hover:scale-[1.12]"
                    : "bg-white border border-gray-200 shadow-lg hover:-translate-y-1 hover:shadow-xl"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-1 text-sm font-semibold text-white shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-semibold text-gray-900">
                  {plan.name}
                </h3>
                <div className="mt-4 flex items-baseline">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.name === "Premium" && (
                    <span className="ml-1 text-sm text-gray-500">/month</span>
                  )}
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-gray-600"
                    >
                      <svg
                        className="h-5 w-5 text-green-500 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() =>
                    navigate(
                      plan.name === "Basic" ? "/login?mode=signup" : "/login",
                    )
                  }
                  className={`mt-8 w-full rounded-xl px-4 py-3 font-semibold transition-all duration-300 ${
                    plan.highlighted
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200 hover:-translate-y-0.5"
                  }`}
                >
                  {plan.name === "Basic" ? "Get Started Free" : "Get Started"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-600 py-20">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Ready to transform your study habits?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Join thousands of students who are already studying smarter with
            SmartStudy.
          </p>
          <button
            onClick={() => navigate("/login?mode=signup")}
            className="mt-8 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-blue-600 hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
          >
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-white font-bold">
                  S
                </div>
                <span className="text-lg font-bold text-white">SmartStudy</span>
              </div>
              <p className="mt-3 text-sm text-gray-400">
                Adaptive study planning and performance tracking for students
                and schools.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Product</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection("features")}
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection("how-it-works")}
                    className="hover:text-white transition-colors"
                  >
                    How It Works
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection("pricing")}
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Account</h4>
              <ul className="mt-3 space-y-2 text-sm">
                <li>
                  <Link
                    to="/login"
                    className="hover:text-white transition-colors"
                  >
                    Sign In
                  </Link>
                </li>
                <li>
                  <Link
                    to="/login?mode=signup"
                    className="hover:text-white transition-colors"
                  >
                    Get Started Free
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Contact</h4>
              <p className="mt-3 text-sm text-gray-400">
                support@smartstudy.app
              </p>
              <p className="text-sm text-gray-400">
                Mon - Fri, 9:00AM - 5:00PM
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-800 pt-6 text-center text-sm text-gray-400">
            © {new Date().getFullYear()} SmartStudy. All rights reserved.
          </div>
        </div>
      </footer>

      {/* Add this style for the grid pattern */}
      <style jsx>{`
        .bg-grid-pattern {
          background-image:
            linear-gradient(currentColor 1px, transparent 1px),
            linear-gradient(to right, currentColor 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
