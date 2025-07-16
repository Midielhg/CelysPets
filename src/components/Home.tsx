import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Background */}
      <div className="relative text-amber-900 overflow-hidden">
        <div className="absolute inset-0"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-block bg-amber-100/80 backdrop-blur-sm px-6 py-2 rounded-full text-sm font-medium mb-6 text-amber-800">
                🐕 Miami's #1 Mobile Pet Grooming 🐱
              </span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-tight text-amber-900">
              Premium Pet Care
              <span className="block bg-gradient-to-r from-rose-400 to-orange-300 bg-clip-text text-transparent">
                At Your Doorstep
              </span>
            </h1>
            <p className="text-xl sm:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed text-amber-800">
              Professional mobile grooming services that come to you. No stress, no travel, 
              just pampered pets in the comfort of your home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/book"
                className="bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 px-10 py-4 rounded-full text-lg font-bold hover:shadow-lg hover:from-amber-300 hover:to-orange-300 transform hover:scale-105 transition-all duration-300 min-w-[220px] border border-amber-300/50"
              >
                📅 Book Now
              </Link>
              <button className="bg-white/80 backdrop-blur-sm border-2 border-amber-300 text-amber-800 px-10 py-4 rounded-full text-lg font-semibold hover:bg-amber-200 hover:text-amber-900 hover:border-amber-400 transform hover:scale-105 transition-all duration-300 min-w-[220px] shadow-md hover:shadow-lg">
                📞 Call (305) 555-PETS
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-sm text-amber-700">
              <div className="flex items-center gap-2">
                <span className="text-orange-400">⭐⭐⭐⭐⭐</span>
                <span>500+ Happy Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-400">✅</span>
                <span>Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-orange-300">🚐</span>
                <span>Same-Day Service</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-bounce">
          <div className="w-16 h-16 bg-orange-200 rounded-full opacity-50"></div>
        </div>
        <div className="absolute bottom-20 right-10 animate-pulse">
          <div className="w-20 h-20 bg-amber-200 rounded-full opacity-50"></div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-amber-900 mb-6">
              Our Premium Services
            </h2>
            <p className="text-xl text-amber-700 max-w-2xl mx-auto">
              Professional grooming services tailored to your pet's needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="group rounded-3xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-orange-100/50" style={{backgroundColor: 'rgba(250, 247, 240, 0.6)'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-rose-300 to-orange-300 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 border border-orange-200/50">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-amber-900">Full Service Spa</h3>
              <p className="text-amber-700 mb-6 leading-relaxed">
                Complete luxury treatment including wash, cut, nail trim, ear cleaning, and aromatherapy. 
                Your pet deserves the royal treatment!
              </p>
              <div className="text-2xl font-bold text-rose-500 mb-4">From $85</div>
              <ul className="text-sm text-amber-600 space-y-2">
                <li>✓ Premium organic shampoo</li>
                <li>✓ Professional styling</li>
                <li>✓ Nail care & ear cleaning</li>
                <li>✓ Aromatherapy finish</li>
              </ul>
            </div>

            {/* Service 2 */}
            <div className="group rounded-3xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-orange-100/50" style={{backgroundColor: 'rgba(250, 247, 240, 0.6)'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-200 to-amber-300 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 border border-orange-200/50">
                <span className="text-3xl">🛁</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-amber-900">Bath & Refresh</h3>
              <p className="text-amber-700 mb-6 leading-relaxed">
                Rejuvenating bath with premium products and thorough brushing. 
                Perfect for maintaining your pet's cleanliness and health.
              </p>
              <div className="text-2xl font-bold text-orange-500 mb-4">From $55</div>
              <ul className="text-sm text-amber-600 space-y-2">
                <li>✓ Deep cleaning bath</li>
                <li>✓ Thorough brushing</li>
                <li>✓ Basic nail trim</li>
                <li>✓ Conditioning treatment</li>
              </ul>
            </div>

            {/* Service 3 */}
            <div className="group rounded-3xl p-8 shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300 border border-orange-100/50" style={{backgroundColor: 'rgba(250, 247, 240, 0.6)'}}>
              <div className="w-16 h-16 bg-gradient-to-br from-amber-200 to-rose-300 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 border border-orange-200/50">
                <span className="text-3xl">💅</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-amber-900">Express Touch-Up</h3>
              <p className="text-amber-700 mb-6 leading-relaxed">
                Quick maintenance service for busy schedules. Nail trimming, 
                ear cleaning, and basic grooming essentials.
              </p>
              <div className="text-2xl font-bold text-amber-500 mb-4">From $35</div>
              <ul className="text-sm text-amber-600 space-y-2">
                <li>✓ Professional nail trim</li>
                <li>✓ Ear cleaning</li>
                <li>✓ Quick brush & tidy</li>
                <li>✓ Health check</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-amber-900 mb-6">
              Why Miami Loves Cely's Pets
            </h2>
            <p className="text-xl text-amber-700 max-w-2xl mx-auto">
              Experience the difference with our premium mobile grooming service
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-rose-300 to-orange-200 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 border border-orange-200/50 shadow-md">
                <span className="text-3xl">🏠</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-amber-900">Convenient</h3>
              <p className="text-amber-700">We come to you! No stressful car rides or waiting in salons.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-200 to-amber-300 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 border border-orange-200/50 shadow-md">
                <span className="text-3xl">👨‍⚕️</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-amber-900">Professional</h3>
              <p className="text-amber-700">Certified groomers with 10+ years of experience and love for pets.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 border border-orange-200/50 shadow-md">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-amber-900">Fast Service</h3>
              <p className="text-amber-700">Same-day appointments available. We respect your time.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-300 to-rose-300 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-300 border border-orange-200/50 shadow-md">
                <span className="text-3xl">❤️</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-amber-900">Pet-Focused</h3>
              <p className="text-amber-700">Your pet's comfort and happiness is our top priority.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 text-amber-900">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Pamper Your Pet?
          </h2>
          <p className="text-xl mb-10 text-amber-800">
            Book your appointment today and see why we're Miami's most trusted mobile pet grooming service!
          </p>
          <Link
            to="/book"
            className="inline-block bg-gradient-to-r from-amber-200 to-orange-200 text-amber-900 px-12 py-5 rounded-full text-xl font-bold hover:shadow-xl hover:from-amber-300 hover:to-orange-300 transform hover:scale-105 transition-all duration-300 border border-amber-300/50"
          >
            🐾 Book Your Pet's Spa Day
          </Link>
          
          <div className="mt-12 text-center">
            <div className="text-amber-700 mb-6">Follow us for daily pet care tips!</div>
            <div className="flex justify-center space-x-4">
              <a href="#" className="w-12 h-12 bg-gradient-to-br from-amber-200 to-orange-200 rounded-full flex items-center justify-center text-2xl hover:scale-110 hover:shadow-lg transition-all duration-300 border border-amber-300/50">📘</a>
              <a href="#" className="w-12 h-12 bg-gradient-to-br from-orange-200 to-rose-200 rounded-full flex items-center justify-center text-2xl hover:scale-110 hover:shadow-lg transition-all duration-300 border border-amber-300/50">📷</a>
              <a href="#" className="w-12 h-12 bg-gradient-to-br from-rose-200 to-amber-200 rounded-full flex items-center justify-center text-2xl hover:scale-110 hover:shadow-lg transition-all duration-300 border border-amber-300/50">🐦</a>
              <a href="#" className="w-12 h-12 bg-gradient-to-br from-amber-200 to-orange-300 rounded-full flex items-center justify-center text-2xl hover:scale-110 hover:shadow-lg transition-all duration-300 border border-amber-300/50">💼</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
