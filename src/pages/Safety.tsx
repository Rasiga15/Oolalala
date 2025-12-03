import { Shield, CheckCircle, Phone, AlertTriangle, Users, Lock, Heart, MapPin, Eye, Bell, Radio, ShieldCheck, Zap, Globe, Award, AlertCircle } from "lucide-react";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";
import { Button } from "../components/common/Button";

// Custom Card components with enhanced styling
const Card = ({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) => (
  <div className={`bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${className}`} style={style}>
    {children}
  </div>
);

const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-8 ${className}`}>
    {children}
  </div>
);

const CardTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-xl font-bold text-gray-900 ${className}`}>
    {children}
  </h3>
);

const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-8 pt-0 ${className}`}>
    {children}
  </div>
);

const safetyFeatures = [
  {
    icon: Shield,
    title: "Verified Drivers",
    description: "All drivers go through comprehensive background checks including ID verification, driving license validation, and vehicle registration confirmation.",
    gradient: "from-[#21409A] to-[#3A5FCD]",
    color: "blue"
  },
  {
    icon: Lock,
    title: "Secure Payments",
    description: "All transactions are processed through encrypted payment gateways. Your financial information is never stored on our servers.",
    gradient: "from-[#21409A] to-[#3A5FCD]",
    color: "blue"
  },
  {
    icon: Phone,
    title: "24/7 Support",
    description: "Our support team is available round the clock to assist you with any concerns or emergencies during your journey.",
    gradient: "from-[#21409A] to-[#3A5FCD]",
    color: "blue"
  },
  {
    icon: Users,
    title: "Trusted Community",
    description: "Rating and review system ensures accountability. Both drivers and passengers can rate each other after every trip.",
    gradient: "from-[#21409A] to-[#3A5FCD]",
    color: "blue"
  },
  {
    icon: AlertTriangle,
    title: "Emergency SOS",
    description: "One-tap emergency button to alert authorities and your emergency contacts with your real-time location.",
    gradient: "from-[#21409A] to-[#3A5FCD]",
    color: "blue"
  },
  {
    icon: CheckCircle,
    title: "Insurance Coverage",
    description: "Every ride is covered under our insurance policy to provide additional protection during your journey.",
    gradient: "from-[#21409A] to-[#3A5FCD]",
    color: "blue"
  },
];

const safetyTips = [
  { 
    icon: ShieldCheck, 
    text: "Always verify driver details before starting your journey",
    category: "Verification"
  },
  { 
    icon: MapPin, 
    text: "Share your trip details with friends or family",
    category: "Sharing"
  },
  { 
    icon: Eye, 
    text: "Check vehicle number matches the booking details",
    category: "Verification"
  },
  { 
    icon: Users, 
    text: "Sit in the back seat when traveling alone",
    category: "Positioning"
  },
  { 
    icon: Zap, 
    text: "Keep your phone charged and accessible",
    category: "Preparedness"
  },
  { 
    icon: Heart, 
    text: "Trust your instincts - if something feels wrong, it probably is",
    category: "Intuition"
  },
  { 
    icon: Phone, 
    text: "Use in-app communication instead of sharing personal numbers",
    category: "Communication"
  },
  { 
    icon: Bell, 
    text: "Report any suspicious behavior immediately",
    category: "Reporting"
  },
];

const emergencyContacts = [
  { name: "Police", number: "100", icon: Shield, color: "from-[#21409A] to-[#3A5FCD]" },
  { name: "Ambulance", number: "108", icon: Heart, color: "from-[#21409A] to-[#3A5FCD]" },
  { name: "Fire Department", number: "101", icon: AlertTriangle, color: "from-[#21409A] to-[#3A5FCD]" },
  { name: "Women's Helpline", number: "1091", icon: Users, color: "from-[#21409A] to-[#3A5FCD]" },
];

const safetyStats = [
  { value: "99.9%", label: "Verified Drivers", icon: ShieldCheck },
  { value: "24/7", label: "Support Available", icon: Phone },
  { value: "2M+", label: "Safe Rides", icon: CheckCircle },
  { value: "< 0.1%", label: "Incident Rate", icon: Award },
];

export const Safety = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-[#21409A] via-[#2A4AB5] to-[#3A5FCD] text-white py-20">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-white rounded-full -translate-y-48"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white rounded-full translate-y-48"></div>
          </div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="inline-flex items-center justify-center p-6 bg-white/10 rounded-2xl backdrop-blur-sm mb-8">
              <Shield className="h-16 w-16" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 max-w-4xl mx-auto">
              Your Safety is Our <span className="bg-gradient-to-r from-[#21409A] to-[#3A5FCD] bg-clip-text text-transparent">Priority</span>
            </h1>
            <p className="text-xl opacity-95 max-w-3xl mx-auto mb-8">
              We're committed to making every ride safe and secure with comprehensive verification, real-time tracking, and 24/7 support.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
                <ShieldCheck className="h-5 w-5 mr-2" />
                Learn More
              </Button>
              <Button variant="hero" className="bg-gradient-to-r from-[#21409A] to-[#3A5FCD] hover:from-[#1A3480] hover:to-[#2A4AB5]">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Emergency Guide
              </Button>
            </div>
          </div>
        </section>

        {/* Information Section with Image */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#21409A]/10 text-[#21409A] rounded-full text-sm font-semibold mb-6">
                  <Shield className="h-4 w-4" />
                  About Our Safety
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Comprehensive Safety <span className="text-[#21409A]">Framework</span>
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  At our core, we believe that safety should never be compromised. Our comprehensive safety framework is built on three key pillars: prevention, protection, and response.
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  We've invested heavily in technology, processes, and training to create multiple layers of protection for every journey. From the moment you book a ride to when you reach your destination, our systems are actively working to ensure your safety.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-[#21409A] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Real-time Monitoring</h4>
                      <p className="text-gray-600">Advanced algorithms monitor every ride for anomalies and potential safety concerns.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-[#21409A] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Driver Verification</h4>
                      <p className="text-gray-600">Multi-step verification process including background checks and regular re-screening.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-[#21409A] flex-shrink-0 mt-1" />
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Emergency Response</h4>
                      <p className="text-gray-600">24/7 emergency support team ready to assist with immediate response protocols.</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-gradient-to-br from-[#21409A] to-[#3A5FCD] rounded-2xl p-8 text-white shadow-2xl">
                  <div className="absolute -top-6 -right-6 w-20 h-20 bg-gradient-to-r from-[#21409A] to-[#3A5FCD] rounded-2xl flex items-center justify-center shadow-lg">
                    <ShieldCheck className="h-10 w-10 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-6">Safety Metrics Dashboard</h3>
                  
                  <div className="space-y-6 mb-8">
                    <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <Shield className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-semibold">Verified Drivers</div>
                          <div className="text-2xl font-bold">100%</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-semibold">Safe Rides Completed</div>
                          <div className="text-2xl font-bold">2M+</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                          <Phone className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="font-semibold">Response Time</div>
                          <div className="text-2xl font-bold">Under 2min</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6 border-t border-white/20">
                    <p className="text-sm opacity-90 mb-4">Monthly safety report updated every 30 days</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Four Columns Section */}
        <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#21409A]/10 text-[#21409A] rounded-full text-sm font-semibold mb-4">
                <ShieldCheck className="h-4 w-4" />
                Safety Features
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Safety Protocols</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Four core safety features that work together to protect every journey
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="hover:shadow-xl transition-all duration-300 group">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-[#21409A] to-[#3A5FCD] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle>Driver Verification</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    Comprehensive background checks including ID verification, driving license validation, and vehicle registration confirmation.
                  </p>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#21409A]/10 text-[#21409A]">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Active & Monitored
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 group">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-[#21409A] to-[#3A5FCD] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Lock className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle>Secure Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    All transactions are processed through encrypted payment gateways. Your financial information is never stored on our servers.
                  </p>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#21409A]/10 text-[#21409A]">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Encrypted
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 group">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-[#21409A] to-[#3A5FCD] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <Phone className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle>24/7 Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    Our support team is available round the clock to assist you with any concerns or emergencies during your journey.
                  </p>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#21409A]/10 text-[#21409A]">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Always Available
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="hover:shadow-xl transition-all duration-300 group">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-r from-[#21409A] to-[#3A5FCD] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <AlertTriangle className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle>Emergency SOS</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">
                    One-tap emergency button to alert authorities and your emergency contacts with your real-time location.
                  </p>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#21409A]/10 text-[#21409A]">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Immediate Response
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Emergency Section */}
        <section className="py-20 bg-gradient-to-br from-[#21409A]/5 via-white to-[#3A5FCD]/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#21409A]/10 text-[#21409A] rounded-full text-sm font-semibold mb-4">
                <AlertTriangle className="h-4 w-4" />
                Emergency Contacts
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Immediate Assistance</h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Save these important numbers for immediate assistance during emergencies
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {emergencyContacts.map((contact, index) => (
                <a
                  key={index}
                  href={`tel:${contact.number}`}
                  className="group"
                >
                  <div className="bg-gradient-to-r from-[#21409A] to-[#3A5FCD] rounded-2xl p-6 text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                        <contact.icon className="h-6 w-6" />
                      </div>
                      <AlertCircle className="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="text-xl font-bold mb-2">{contact.name}</h3>
                    <div className="text-2xl font-bold mb-3">{contact.number}</div>
                    <div className="text-sm opacity-90">
                      Available 24/7 for emergencies
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20">
                      <div className="flex items-center justify-between text-sm">
                        <span>Tap to call</span>
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 rounded-full">
                          <Phone className="h-3 w-3" />
                          Call now
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <div className="mt-12 text-center">
              <div className="bg-gradient-to-r from-gray-50 to-[#21409A]/5 border border-gray-200 rounded-2xl p-8 max-w-3xl mx-auto">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-[#21409A]/10 rounded-xl flex items-center justify-center">
                    <Globe className="h-6 w-6 text-[#21409A]" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-lg font-bold text-gray-900">Global Safety Standards</h4>
                    <p className="text-gray-600">Our safety protocols meet international standards and are regularly updated</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 justify-center">
                  <span className="px-4 py-2 bg-[#21409A]/10 text-[#21409A] rounded-full text-sm font-medium">
                    ISO 27001 Certified
                  </span>
                  <span className="px-4 py-2 bg-[#21409A]/10 text-[#21409A] rounded-full text-sm font-medium">
                    GDPR Compliant
                  </span>
                  <span className="px-4 py-2 bg-[#21409A]/10 text-[#21409A] rounded-full text-sm font-medium">
                    Regular Audits
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Safety;