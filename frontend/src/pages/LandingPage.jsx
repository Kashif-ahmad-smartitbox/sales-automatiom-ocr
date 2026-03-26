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
  Star,
  Quotes
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

  const steps = [
    { number: '01', title: 'Register & Configure', desc: 'Set up your company profile and add your field executives and territory mapping.' },
    { number: '02', title: 'Plan & Execute', desc: 'Create optimal routes and assign targets for your team to execute on the ground.' },
    { number: '03', title: 'Track & Analyze', desc: 'Monitor check-ins live and review automated reports to boost overall productivity.' }
  ];

  const testimonials = [
    { name: "Rahul Sharma", role: "Sales Director, FMCG Group", text: "Smart ITBox transformed how we track our field executives. The productivity jumped 40% in just two months!" },
    { name: "Priya Desai", role: "Operations Head, BuildCo", text: "The geo-fenced check-ins ensure high discipline. Finally, we have accurate visibility into daily visits." },
    { name: "Arun Verma", role: "VP Sales, PharmaCorp", text: "Route optimization alone saved us hours of administrative work every week. Highly recommend this platform." }
  ];
  const stats = [
    { value: '40%', label: 'More Visits Per Day' },
    { value: '2x', label: 'Sales Productivity' },
    { value: '98%', label: 'Location Accuracy' },
    { value: '60%', label: 'Less Admin Time' }
  ];

  const industries = ['FMCG', 'Pharmaceuticals', 'Building Materials', 'Electronics', 'Automotive', 'Agriculture', 'Consumer Goods', 'Retail', 'Logistics', 'Manufacturing'];
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer">
              <img 
                src="/logo.png" 
                alt="SMART ITBox Logo" 
                className="h-10 w-auto object-contain"
              />
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link to="/login">
                <Button variant="ghost" className="text-gray-600 hover:text-primary-700 hover:bg-primary-50 rounded-xl text-sm px-4">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-gradient-to-r from-primary-400 to-orange-400 hover:from-primary-500 hover:to-orange-500 text-white shadow-md rounded-xl text-sm px-5" data-testid="get-started-btn">
                  Start Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 overflow-hidden">
        {/* Abstract Background Blobs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200/10 rounded-full blur-3xl mix-blend-multiply filter animate-pulse duration-1000 hidden md:block"></div>
        <div className="absolute top-40 right-20 w-80 h-80 bg-orange-200/10 rounded-full blur-3xl mix-blend-multiply filter block"></div>
        
        <div className="max-w-7xl mx-auto relative z-10 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-50 to-orange-50 rounded-full mb-6 border border-primary-200 shadow-sm">
              <CheckCircle weight="fill" className="w-4 h-4 text-primary-600" />
              <span className="text-sm text-primary-800 font-bold tracking-wide">Trusted by 500+ Field Teams</span>
            </div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
              Smarter Field Sales<br />
              <span className="bg-gradient-to-r from-primary-500 to-orange-600 bg-clip-text text-transparent">Automation Platform</span>
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 mb-8 leading-relaxed font-medium">
              Track your field team in real-time, automate visit workflows, and boost sales productivity with intelligent route planning and geo-verified check-ins.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-primary-400 to-orange-400 hover:from-primary-500 hover:to-orange-500 text-white px-8 py-6 rounded-xl text-lg shadow-xl shadow-primary-500/20 transition-all font-bold border-0">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 px-8 py-6 text-lg font-semibold shadow-sm">
                  Watch Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Hero Illustration / Dashboard Preview */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="relative rounded-2xl bg-white border border-gray-200 shadow-2xl overflow-hidden p-4 transform rotate-1 hover:rotate-0 transition-transform duration-500">
              {/* Fake Dashboard UI */}
              <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-3">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="text-gray-400 text-xs font-bold uppercase">Active Execs</div>
                  <div className="text-2xl font-black text-gray-800 mt-1">42<span className="text-green-500 text-sm ml-2">↑ 12%</span></div>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="text-gray-400 text-xs font-bold uppercase">Total Visits</div>
                  <div className="text-2xl font-black text-gray-800 mt-1">1,204<span className="text-green-500 text-sm ml-2">↑ 8%</span></div>
                </div>
              </div>
              <div className="space-y-3">
                {[1, 2, 3].map((val) => (
                  <div key={val} className="flex items-center justify-between bg-white border border-gray-100 p-3 rounded-lg shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-100 to-orange-100 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary-700" />
                      </div>
                      <div>
                        <div className="w-24 h-2 bg-gray-200 rounded-full mb-1.5"></div>
                        <div className="w-16 h-2 bg-gray-100 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                       <div className="w-12 h-4 bg-primary-100 rounded-md"></div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Floating element */}
              <div className="absolute -right-3 -bottom-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="bg-orange-100 p-3 rounded-xl">
                  <Target weight="fill" className="text-orange-500 w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800">Target Reached!</p>
                  <p className="text-xs text-gray-500">Just now</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="max-w-7xl mx-auto relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-16"
        >
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-4 sm:p-6 bg-white/60 backdrop-blur-md rounded-2xl border border-primary-100 shadow-sm hover:border-primary-300 hover:shadow-md transition-all">
              <div className="text-2xl sm:text-4xl font-extrabold bg-gradient-to-r from-primary-600 to-orange-600 bg-clip-text text-transparent mb-1">{stat.value}</div>
              <div className="text-xs sm:text-sm text-gray-600 font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Marquee Section */}
      <section className="py-8 bg-white border-y border-gray-50 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 text-center mb-6">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-widest">Powering field forces across industries</p>
        </div>
        <div className="flex whitespace-nowrap overflow-hidden w-full relative">
           {/* Fade gradients on edges */}
           <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent z-10"></div>
           <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent z-10"></div>
           
           <div className="flex animate-marquee gap-8 sm:gap-16 px-4">
            {/* Double the array for seamless looping */}
            {[...industries, ...industries].map((industry, index) => (
              <div key={index} className="flex items-center text-gray-800 font-bold text-lg sm:text-xl tracking-wide opacity-50 hover:opacity-100 transition-opacity">
                 {industry}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-20 bg-gray-50 relative">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">Three simple steps to automate your field operations.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting Line (Desktop only) */}
            <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-gray-200 z-0 border-t-2 border-dashed border-gray-300"></div>
            
            {steps.map((step, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.2 }}
                viewport={{ once: true }}
                className="relative z-10 flex flex-col items-center text-center group"
              >
                <div className="w-24 h-24 rounded-full bg-white border-4 border-slate-50 shadow-xl shadow-slate-200/50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:border-primary-100 transition-all duration-300">
                  <span className="text-3xl font-black bg-gradient-to-r from-primary-400 to-orange-400 bg-clip-text text-transparent">{step.number}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">
              A complete toolkit built specifically for high-performing field sales teams.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="p-8 bg-gray-100 rounded-3xl border border-gray-100 shadow-sm hover:border-primary-200 hover:shadow-xl hover:bg-white transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-6 group-hover:bg-primary-50 transition-colors">
                  <feature.icon weight="duotone" className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white text-slate-900 relative overflow-hidden border-t border-gray-100">
        {/* Soft Background Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-100/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-100/20 rounded-full blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Loved by Sales Leaders</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg font-medium">Don't just take our word for it.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((test, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl shadow-slate-200/50 hover:border-primary-200 hover:shadow-primary-100/50 transition-all duration-300 group"
              >
                <div className="flex text-amber-400 mb-6">
                  {[...Array(5)].map((_, i) => <Star key={i} weight="fill" size={18} />)}
                </div>
                <p className="text-slate-600 text-base leading-relaxed mb-8 italic">"{test.text}"</p>
                <div className="flex items-center gap-4 border-t border-slate-50 pt-6">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-400 to-orange-400 flex items-center justify-center font-bold text-white shadow-md transform group-hover:rotate-6 transition-transform">
                    {test.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{test.name}</h4>
                    <p className="text-xs text-slate-500 font-semibold">{test.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-yellow-50 via-orange-50 to-amber-50 relative overflow-hidden">
         {/* Background pattern */}
         <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fed50a' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Ready to Transform Your Field Operations?
          </h2>
          <p className="text-slate-600 mb-10 text-lg sm:text-xl max-w-2xl mx-auto font-medium">
            Join thousands of field forces maximizing their sales productivity with Smart ITBox.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-gradient-to-r from-primary-400 to-orange-400 hover:from-primary-500 hover:to-orange-500 text-white rounded-xl px-10 py-7 text-xl font-bold shadow-2xl hover:scale-105 transition-all border-0">
              Start Your Free Trial
              <ArrowRight className="ml-3 w-6 h-6" />
            </Button>
          </Link>
          <p className="text-slate-600 text-sm mt-6 font-medium">No credit card required • Setup in 5 minutes</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-6 px-4 bg-white border-t border-slate-50">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-primary-400 to-orange-400 w-8 h-8 rounded-lg flex items-center justify-center shadow-sm">
              <MapPin weight="fill" className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-slate-800 tracking-tight">Smart ITBox</span>
          </div>
          <div className="flex items-center gap-6 text-sm font-semibold text-gray-500">
            <a href="#" className="hover:text-primary-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary-600 transition-colors">Contact</a>
          </div>
          <p className="text-sm text-gray-400 font-medium">
            © {new Date().getFullYear()} Smart ITBox. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
