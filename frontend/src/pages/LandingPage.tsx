import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

// Animated Stat Card Component
interface StatCardProps {
  stat: {
    targetValue: number | null;
    suffix: string;
    label: string;
    icon: string;
    isPercentage: boolean;
    displayValue?: string;
  };
  index: number;
}

const AnimatedStatCard = ({ stat, index }: StatCardProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAnimatedRef = useRef(false);

  useEffect(() => {
    if (stat.displayValue || stat.targetValue === null) {
      return;
    }

    const startAnimation = () => {
      if (hasAnimatedRef.current) return;
      hasAnimatedRef.current = true;

      const duration = 2000; // 2 seconds
      const steps = 60;
      const increment = stat.targetValue! / steps;
      let current = 0;

      timerRef.current = setInterval(() => {
        current += increment;
        if (current >= stat.targetValue!) {
          setDisplayValue(stat.targetValue!);
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        } else {
          setDisplayValue(current);
        }
      }, duration / steps);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimatedRef.current) {
            startAnimation();
          }
        });
      },
      { threshold: 0.1 }
    );

    const currentCard = cardRef.current;
    if (currentCard) {
      // Check if already visible on mount
      const rect = currentCard.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (isVisible) {
        // Start animation immediately if already visible
        setTimeout(startAnimation, 300 + index * 100);
      } else {
        observer.observe(currentCard);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (currentCard) {
        observer.unobserve(currentCard);
      }
    };
  }, [stat.targetValue, stat.displayValue, index]);

  const formatValue = () => {
    if (stat.displayValue) return stat.displayValue;
    if (stat.isPercentage) {
      return `${displayValue.toFixed(1)}${stat.suffix}`;
    }
    if (stat.targetValue !== null && stat.targetValue >= 1000000) {
      return `${(displayValue / 1000000).toFixed(0)}M${stat.suffix}`;
    }
    if (stat.targetValue !== null && stat.targetValue >= 1000) {
      return `${(displayValue / 1000).toFixed(0)}K${stat.suffix}`;
    }
    return `${Math.floor(displayValue)}${stat.suffix}`;
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.6 + index * 0.1 }}
      className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center border border-white/20"
    >
      <div className="text-3xl mb-2">{stat.icon}</div>
      <div className="text-3xl font-bold text-white mb-1">{formatValue()}</div>
      <div className="text-sm text-indigo-100">{stat.label}</div>
    </motion.div>
  );
};

const LandingPage = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const element = document.querySelector(location.hash);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6">
              Real-Time Fleet Tracking
              <br />
              <span className="text-indigo-200">Made Simple</span>
            </h1>
            <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
              Monitor your entire fleet in real-time. Optimize routes, reduce
              costs, and improve safety with our comprehensive fleet management
              platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/register"
                  className="inline-block px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-all shadow-xl"
                >
                  Get Started Free
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  to="/login"
                  className="inline-block px-8 py-4 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white/10 transition-all"
                >
                  Sign In
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Dashboard Preview Image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mt-16 relative"
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 shadow-2xl border border-white/20">
              <img
                src="https://www.loginextsolutions.com/blog/wp-content/uploads/2021/05/image.png"
                alt="Fleet Tracking Dashboard"
                className="w-full h-auto rounded-lg shadow-2xl"
                loading="lazy"
              />
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {[
              {
                targetValue: 10000,
                suffix: "+",
                label: "Active Vehicles",
                icon: "🚛",
                isPercentage: false,
              },
              {
                targetValue: 99.9,
                suffix: "%",
                label: "Uptime",
                icon: "⚡",
                isPercentage: true,
              },
              {
                targetValue: 50000000,
                suffix: "+",
                label: "Trips Tracked",
                icon: "📍",
                isPercentage: false,
              },
              {
                targetValue: null,
                suffix: "",
                label: "Support",
                icon: "🛡️",
                displayValue: "24/7",
                isPercentage: false,
              },
            ].map((stat, index) => (
              <AnimatedStatCard key={index} stat={stat} index={index} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-gradient-to-br from-green-50 to-teal-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              The benefits of using{" "}
              <span className="text-indigo-600">fleet tracking software</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Improve Visibility */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <img
                    src="https://smartroutes.io/img/2023/features/benefit-icons/improve-visibility.png"
                    alt="Improved visibility icon"
                    className="w-16 h-16"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Improve Visibility
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Gain oversight of your drivers when they have left the depot
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Increased Efficiency */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <img
                    src="https://smartroutes.io/img/2023/features/benefit-icons/increased-efficiency.png"
                    alt="Increased Efficiency icon"
                    className="w-16 h-16"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Increased Efficiency
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    By monitoring driver behavior you can reduce idle time,
                    increase productivity and decrease fuel consumption
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Accurate ETAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <img
                    src="https://smartroutes.io/img/2023/features/benefit-icons/accurate-eta.png"
                    alt="Accurate ETAs icon"
                    className="w-16 h-16"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Accurate ETAs
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Once drivers mark a delivery as completed, automatically
                    update the next customer with an accurate ETA
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Reduce Tacho Hours */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <img
                    src="https://smartroutes.io/img/2023/features/benefit-icons/reduce-tacho-hours.png"
                    alt="Reduced Tacho Hours icon"
                    className="w-16 h-16"
                    loading="lazy"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Reduce Tacho Hours
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    By optimizing routes, driving hours can be reduced thus
                    reducing Tacho hours and ensuring compliance with
                    regulations
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Benefits Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              See what our end-to-end TMS can do for you
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Streamline transportation from planning to execution with
              AI-powered insights
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: "💰",
                title: "Reduce freight costs",
                subtitle: "with intelligent spot and contract bidding",
                description:
                  "AI automatically selects the best transporter for each trip based on cost, risk score, availability and more.",
                color: "from-blue-500 to-cyan-500",
              },
              {
                icon: "💳",
                title: "Improve cashflow by 5x",
                subtitle: "with instant payment settlements",
                description:
                  "Capture OTPs, digital signatures or image-based proof of delivery for instant confirmation and automated real-time payment settlements.",
                color: "from-purple-500 to-pink-500",
              },
              {
                icon: "✅",
                title: "Prevent delays and compliance bottlenecks",
                subtitle: "with automated checks",
                description:
                  "Verify transporters in real-time using advanced AI. Eliminate delays and ensure regulatory compliance with 10+ automated checks.",
                color: "from-green-500 to-emerald-500",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all border border-gray-100"
              >
                <div
                  className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-3xl mb-6`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-indigo-600 font-medium mb-4">
                  {feature.subtitle}
                </p>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Additional Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: "📍",
                title: "Real-Time GPS Tracking",
                description:
                  "Track all your vehicles in real-time with GPS accuracy. Get instant updates on location, speed, and route progress.",
              },
              {
                icon: "📊",
                title: "Advanced Analytics",
                description:
                  "Comprehensive dashboards and reports to help you make data-driven decisions and optimize fleet performance.",
              },
              {
                icon: "🚨",
                title: "Smart Alerts",
                description:
                  "Get notified instantly about speed violations, route deviations, maintenance needs, and emergency situations.",
              },
              {
                icon: "🛣️",
                title: "Route Optimization",
                description:
                  "Plan and optimize routes to reduce fuel costs, improve delivery times, and increase customer satisfaction.",
              },
              {
                icon: "📱",
                title: "Mobile Access",
                description:
                  "Access your fleet data anywhere, anytime with our responsive web dashboard that works on all devices.",
              },
              {
                icon: "🔒",
                title: "Secure & Reliable",
                description:
                  "Enterprise-grade security with encrypted data transmission and 99.9% uptime guarantee.",
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index % 3) * 0.1 }}
                whileHover={{ y: -3 }}
                className="bg-gray-50 p-6 rounded-xl hover:bg-white hover:shadow-md transition-all"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-16 bg-gray-50 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-8">
              Trusted by leading companies
            </p>
          </motion.div>
          <div className="relative overflow-hidden">
            <div className="flex gap-12 items-center">
              <motion.div
                className="flex gap-12 items-center"
                animate={{
                  x: [0, -800],
                }}
                transition={{
                  x: {
                    repeat: Infinity,
                    repeatType: "loop",
                    duration: 20,
                    ease: "linear",
                  },
                }}
              >
                {[
                  "Logistics Co",
                  "Transport Inc",
                  "Fleet Solutions",
                  "Delivery Pro",
                  "Logistics Co",
                  "Transport Inc",
                  "Fleet Solutions",
                  "Delivery Pro",
                ].map((company, i) => (
                  <div
                    key={i}
                    className="text-2xl font-bold text-gray-700 whitespace-nowrap flex-shrink-0 min-w-[200px] text-center"
                  >
                    {company}
                  </div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that's right for your fleet size
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                name: "Free",
                price: "$0",
                vehicles: "Up to 3 vehicles",
                features: [
                  "Real-time tracking",
                  "Basic analytics",
                  "Community support",
                  "Mobile access",
                ],
                isFree: true,
              },
              {
                name: "Starter",
                price: "$29",
                vehicles: "Up to 10 vehicles",
                features: [
                  "Real-time tracking",
                  "Basic analytics",
                  "Email support",
                  "Mobile access",
                ],
              },
              {
                name: "Professional",
                price: "$99",
                vehicles: "Up to 50 vehicles",
                features: [
                  "Everything in Starter",
                  "Advanced analytics",
                  "Route optimization",
                  "Priority support",
                  "API access",
                ],
                popular: true,
              },
              {
                name: "Enterprise",
                price: "Custom",
                vehicles: "Unlimited vehicles",
                features: [
                  "Everything in Professional",
                  "Custom integrations",
                  "Dedicated support",
                  "SLA guarantee",
                  "On-premise option",
                ],
              },
            ].map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white p-8 rounded-2xl shadow-lg border-2 ${
                  plan.popular
                    ? "border-indigo-500 scale-105"
                    : plan.isFree
                    ? "border-green-500"
                    : "border-gray-200"
                }`}
              >
                {plan.popular && (
                  <div className="bg-indigo-500 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    Most Popular
                  </div>
                )}
                {plan.isFree && (
                  <div className="bg-green-500 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                    Free Forever
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {plan.price}
                  </span>
                  {plan.price !== "Custom" && (
                    <span className="text-gray-600">/month</span>
                  )}
                </div>
                <p className="text-gray-600 mb-6">{plan.vehicles}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.isFree ? "/register" : "/register"}
                  className={`block w-full text-center py-3 px-4 rounded-lg font-semibold transition-all ${
                    plan.popular
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : plan.isFree
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {plan.isFree ? "Get Started Free" : "Get Started"}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Fleet Management?
            </h2>
            <p className="text-xl text-indigo-100 mb-8">
              Join thousands of companies already using FleetTrack to optimize
              their operations.
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/register"
                className="inline-block px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 transition-all shadow-xl"
              >
                Start Free Trial
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LandingPage;
