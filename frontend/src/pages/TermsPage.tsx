import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const TermsPage = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content:
        "By accessing and using this Fleet Tracking Dashboard, you accept and agree to be bound by the terms and provision of this agreement.",
    },
    {
      title: "2. Use License",
      content:
        "Permission is granted to temporarily use this service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.",
    },
    {
      title: "3. User Account",
      content:
        "You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.",
    },
    {
      title: "4. Data Privacy",
      content:
        "We are committed to protecting your privacy. Your personal information and fleet data will be handled in accordance with our Privacy Policy.",
    },
    {
      title: "5. Service Availability",
      content:
        "We strive to provide continuous service availability but do not guarantee uninterrupted access. We reserve the right to modify or discontinue the service at any time.",
    },
    {
      title: "6. Limitation of Liability",
      content:
        "In no event shall Fleet Tracking Dashboard or its suppliers be liable for any damages arising out of the use or inability to use the service.",
    },
    {
      title: "7. Intellectual Property",
      content:
        "All content, features, and functionality of the service are owned by Fleet Tracking Dashboard and are protected by international copyright, trademark, and other intellectual property laws.",
    },
    {
      title: "8. Prohibited Uses",
      content:
        "You may not use the service for any unlawful purpose or to solicit others to perform unlawful acts. You may not violate any local, state, national, or international law or regulation.",
    },
    {
      title: "9. Termination",
      content:
        "We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users.",
    },
    {
      title: "10. Changes to Terms",
      content:
        "We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page.",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Terms & Conditions
              </h1>
              <p className="text-gray-600">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ← Back
            </motion.button>
          </div>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-6 bg-gray-50 rounded-lg border-l-4 border-indigo-500 hover:shadow-md transition-shadow"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-3">
                  {section.title}
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {section.content}
                </p>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="mt-12 p-6 bg-indigo-50 rounded-lg border border-indigo-200"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Questions?
            </h3>
            <p className="text-gray-700">
              If you have any questions about these Terms & Conditions, please
              contact us at{" "}
              <a
                href="mailto:support@fleet-tracking.com"
                className="text-indigo-600 hover:underline font-medium"
              >
                support@fleet-tracking.com
              </a>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default TermsPage;
