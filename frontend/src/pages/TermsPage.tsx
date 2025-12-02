import { motion } from 'framer-motion';
import { Fade, Slide } from 'react-awesome-reveal';
import { useNavigate } from 'react-router-dom';

const TermsPage = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing and using this Fleet Tracking Dashboard, you accept and agree to be bound by the terms and provision of this agreement.',
    },
    {
      title: '2. Use License',
      content: 'Permission is granted to temporarily use this service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title.',
    },
    {
      title: '3. User Account',
      content: 'You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.',
    },
    {
      title: '4. Data Privacy',
      content: 'We are committed to protecting your privacy. Your personal information and fleet data will be handled in accordance with our Privacy Policy.',
    },
    {
      title: '5. Service Availability',
      content: 'We strive to provide continuous service availability but do not guarantee uninterrupted access. We reserve the right to modify or discontinue the service at any time.',
    },
    {
      title: '6. Limitation of Liability',
      content: 'In no event shall Fleet Tracking Dashboard or its suppliers be liable for any damages arising out of the use or inability to use the service.',
    },
    {
      title: '7. Intellectual Property',
      content: 'All content, features, and functionality of the service are owned by Fleet Tracking Dashboard and are protected by international copyright, trademark, and other intellectual property laws.',
    },
    {
      title: '8. Prohibited Uses',
      content: 'You may not use the service for any unlawful purpose or to solicit others to perform unlawful acts. You may not violate any local, state, national, or international law or regulation.',
    },
    {
      title: '9. Termination',
      content: 'We may terminate or suspend your account and access to the service immediately, without prior notice, for conduct that we believe violates these Terms of Service or is harmful to other users.',
    },
    {
      title: '10. Changes to Terms',
      content: 'We reserve the right to modify these terms at any time. We will notify users of any changes by posting the new Terms of Service on this page.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-teal-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Fade>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-xl p-8 md:p-12"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms & Conditions</h1>
                <p className="text-gray-600">Last updated: {new Date().toLocaleDateString()}</p>
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

            <div className="prose max-w-none space-y-8">
              {sections.map((section, index) => (
                <Slide key={index} delay={index * 100}>
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border-l-4 border-green-500"
                  >
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
                    <p className="text-gray-700 leading-relaxed">{section.content}</p>
                  </motion.div>
                </Slide>
              ))}
            </div>

            <Fade delay={1000}>
              <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Questions?</h3>
                <p className="text-gray-700">
                  If you have any questions about these Terms & Conditions, please contact us at{' '}
                  <a href="mailto:support@fleet-tracking.com" className="text-blue-600 hover:underline">
                    support@fleet-tracking.com
                  </a>
                </p>
              </div>
            </Fade>
          </motion.div>
        </Fade>
      </div>
    </div>
  );
};

export default TermsPage;

