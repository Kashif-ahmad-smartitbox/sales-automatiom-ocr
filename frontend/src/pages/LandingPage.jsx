import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { 
  MapPin, 
  Users, 
  ChartLineUp, 
  CheckCircle,
  ArrowRight,
  Target,
  Path,
  Clock
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const LandingPage = () => {
  const features = [
    {
      icon: MapPin,
      title: 'GPS Live Tracking',
      description: 'Monitor your field team in real-time with precise GPS location tracking and geo-fencing.'
    },
    {
      icon: Path,
      title: 'Smart Route Planning',
      description: 'Auto-generate optimized routes for dealers within configurable radius parameters.'
    },
    {
      icon: Target,
      title: 'Visit Management',
      description: 'Track check-ins, check-outs, and visit outcomes with automated geo-verification.'
    },
    {
      icon: ChartLineUp,
      title: 'Performance Analytics',
      description: 'Comprehensive reports on targets, achievements, and effort scores.'
    }
  ];

  const stats = [
    { value: '40%', label: 'More Visits Per Day' },
    { value: '2x', label: 'Sales Productivity' },
    { value: '98%', label: 'Location Accuracy' },
    { value: '60%', label: 'Less Admin Time' }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-primary-500 to-orange-500 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm">
                <MapPin weight="fill" className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-sm bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Smart ITBox</span>
                <div className="text-[10px] text-gray-500">Field Sales Automation</div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-700 hover:text-primary-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-orange-50">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white shadow-md" data-testid="get-started-btn">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section pt-32 pb-20 px-4">
        <div className="hero-pattern" />
        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-orange-100 rounded-full mb-6 border border-primary-200">
              <CheckCircle weight="fill" className="w-4 h-4 text-primary-600" />
              <span className="text-sm text-primary-700 font-medium">Trusted by 500+ Field Teams</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
              Field Sales<br />
              <span className="bg-gradient-to-r from-primary-500 to-orange-500 bg-clip-text text-transparent">Automation Platform</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-8">
              Track your field team in real-time, automate visit workflows, and boost sales productivity with intelligent route planning and geo-verified check-ins.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-gradient-to-r from-primary-500 to-orange-500 hover:from-primary-600 hover:to-orange-600 text-white px-8 py-6 text-lg shadow-lg" data-testid="hero-cta-btn">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-orange-50 hover:border-primary-300 px-8 py-6 text-lg">
                  Watch Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16"
          >
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-primary-300 hover:shadow-md transition-all">
                <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent mb-1 font-mono">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need for Field Operations
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              A complete solution for managing your field sales team, from route planning to performance tracking.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-6 bg-white rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-primary-100 to-orange-100 flex items-center justify-center mb-4">
                  <feature.icon weight="duotone" className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-500 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Built for Field-Heavy Industries</h2>
            <p className="text-gray-500">Trusted by leading companies in FMCG, Pharma, and Building Materials</p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {['FMCG', 'Pharmaceuticals', 'Building Materials', 'Electronics', 'Automotive', 'Agriculture'].map((industry) => (
              <div key={industry} className="px-6 py-3 bg-gradient-to-r from-primary-50 to-orange-50 rounded-full text-gray-700 border border-primary-200 font-medium hover:shadow-sm transition-all">
                {industry}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-primary-500 to-orange-500">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Transform Your Field Operations?
          </h2>
          <p className="text-white/80 mb-8 text-lg">
            Join 500+ companies already using Smart ITBox to maximize their sales team productivity.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-white text-gray-800 hover:bg-gray-50 px-8 py-6 text-lg font-semibold shadow-lg">
              Start Your Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-primary-500 to-orange-500 w-6 h-6 rounded flex items-center justify-center">
              <MapPin weight="fill" className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent">Smart ITBox</span>
          </div>
          <p className="text-sm text-gray-500">
            © 2026{' '}
            <span className="bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent font-semibold">SMART ITBOX</span>
            . All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
