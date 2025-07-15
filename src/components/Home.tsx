import React from 'react';
import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section with Gradient Background */}
      <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-32">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-block bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full text-sm font-medium mb-6">
                🐕 Miami's #1 Mobile Pet Grooming 🐱
              </span>
            </div>
            <h1 className="text-5xl sm:text-7xl font-bold mb-6 leading-tight">
              Premium Pet Care
              <span className="block bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                At Your Doorstep
              </span>
            </h1>
            <p className="text-xl sm:text-2xl mb-10 max-w-3xl mx-auto leading-relaxed text-blue-100">
              Professional mobile grooming services that come to you. No stress, no travel, 
              just pampered pets in the comfort of your home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                to="/book"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-8 py-4 rounded-full text-lg font-bold hover:shadow-2xl transform hover:scale-105 transition-all duration-300 min-w-[200px]"
              >
                📅 Book Now
              </Link>
              <button className="border-2 border-white text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-white hover:text-gray-900 transition-all duration-300 min-w-[200px]">
                📞 Call (305) 555-PETS
              </button>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-16 flex flex-wrap justify-center items-center gap-8 text-sm text-blue-200">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">⭐⭐⭐⭐⭐</span>
                <span>500+ Happy Customers</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✅</span>
                <span>Licensed & Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-purple-400">🚐</span>
                <span>Same-Day Service</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 animate-bounce">
          <div className="w-16 h-16 bg-yellow-400 rounded-full opacity-20"></div>
        </div>
        <div className="absolute bottom-20 right-10 animate-pulse">
          <div className="w-20 h-20 bg-pink-400 rounded-full opacity-20"></div>
        </div>
      </div>

      {/* Services Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Our Premium Services
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Professional grooming services tailored to your pet's needs
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Service 1 */}
            <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Full Service Spa</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Complete luxury treatment including wash, cut, nail trim, ear cleaning, and aromatherapy. 
                Your pet deserves the royal treatment!
              </p>
              <div className="text-2xl font-bold text-blue-600 mb-4">From $85</div>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>✓ Premium organic shampoo</li>
                <li>✓ Professional styling</li>
                <li>✓ Nail care & ear cleaning</li>
                <li>✓ Aromatherapy finish</li>
              </ul>
            </div>

            {/* Service 2 */}
            <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🛁</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Bath & Refresh</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Rejuvenating bath with premium products and thorough brushing. 
                Perfect for maintaining your pet's cleanliness and health.
              </p>
              <div className="text-2xl font-bold text-green-600 mb-4">From $55</div>
              <ul className="text-sm text-gray-500 space-y-2">
                <li>✓ Deep cleaning bath</li>
                <li>✓ Thorough brushing</li>
                <li>✓ Basic nail trim</li>
                <li>✓ Conditioning treatment</li>
              </ul>
            </div>

            {/* Service 3 */}
            <div className="group bg-white rounded-3xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">💅</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Express Touch-Up</h3>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Quick maintenance service for busy schedules. Nail trimming, 
                ear cleaning, and basic grooming essentials.
              </p>
              <div className="text-2xl font-bold text-pink-600 mb-4">From $35</div>
              <ul className="text-sm text-gray-500 space-y-2">
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
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Why Miami Loves Cely's Pets
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the difference with our premium mobile grooming service
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">🏠</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Convenient</h3>
              <p className="text-gray-600">We come to you! No stressful car rides or waiting in salons.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">👨‍⚕️</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Professional</h3>
              <p className="text-gray-600">Certified groomers with 10+ years of experience and love for pets.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">⚡</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Fast Service</h3>
              <p className="text-gray-600">Same-day appointments available. We respect your time.</p>
            </div>
            
            <div className="text-center group">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-rose-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl">❤️</span>
              </div>
              <h3 className="text-xl font-bold mb-3 text-gray-900">Pet-Focused</h3>
              <p className="text-gray-600">Your pet's comfort and happiness is our top priority.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to Pamper Your Pet?
          </h2>
          <p className="text-xl mb-10 text-purple-100">
            Book your appointment today and see why we're Miami's most trusted mobile pet grooming service!
          </p>
          <Link
            to="/book"
            className="inline-block bg-white text-purple-600 px-10 py-5 rounded-full text-xl font-bold hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
          >
            🐾 Book Your Pet's Spa Day
          </Link>
          
          <div className="mt-12 text-center">
            <div className="text-purple-200 mb-4">Follow us for daily pet care tips!</div>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-2xl hover:scale-110 transition-transform duration-300">📘</a>
              <a href="#" className="text-2xl hover:scale-110 transition-transform duration-300">📷</a>
              <a href="#" className="text-2xl hover:scale-110 transition-transform duration-300">🐦</a>
              <a href="#" className="text-2xl hover:scale-110 transition-transform duration-300">💼</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
