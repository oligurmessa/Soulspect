import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="backdrop-blur-md bg-white/60 border-b border-gray-200/40 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
                <img 
                  src="/logo.png" 
                  alt="SoulSpect Logo"
                  className="h-8 w-8 rounded-lg"
                />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-600">
                SoulSpect
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                href="/login"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200"
              >
                Sign in
              </Link>
              <Link 
                href="/login"
                className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-5 py-2 rounded-lg font-medium text-sm transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            {/* Floating glass card */}
            <div className="backdrop-blur-xl bg-white/30 border border-gray-200/50 rounded-3xl p-12 shadow-2xl shadow-gray-500/10 mb-16">
              <div className="mb-8">
                <h1 className="text-5xl md:text-7xl font-bold text-gray-900 leading-tight mb-6">
                  Know Your
                  <span className="block bg-clip-text text-transparent bg-gradient-to-r from-gray-800 via-orange-500/80 to-blue-500/60">
                    Inner Self
                  </span>
                </h1>
                <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                  A minimal, thoughtful space for emotion tracking, inner transformation, and life alignment. 
                  Discover patterns, insights, and your authentic path forward.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
                <Link 
                  href="/login"
                  className="w-full sm:w-auto bg-gradient-to-r from-gray-900 to-gray-800 text-white px-8 py-4 rounded-xl font-medium text-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:from-gray-800 hover:to-gray-700"
                >
                  Begin Your Journey
                </Link>
                <button className="w-full sm:w-auto backdrop-blur-lg bg-white/40 border border-gray-300/60 hover:bg-white/60 text-gray-800 font-medium text-lg px-8 py-4 rounded-xl transition-all duration-300 hover:shadow-lg">
                  Learn More
                </button>
              </div>

              {/* Subtle trust indicators */}
              <div className="flex justify-center items-center space-x-8 text-gray-500 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-400/60"></div>
                  <span>Private & Secure</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400/60"></div>
                  <span>AI-Powered Insights</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-orange-400/60"></div>
                  <span>Personal Growth</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 relative">
        {/* Subtle floating orbs */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-orange-200/20 to-orange-300/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-gradient-to-br from-blue-200/20 to-blue-300/10 rounded-full blur-xl"></div>
        
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Three Paths to Self-Discovery
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Simple, powerful tools designed for deep personal insight and authentic growth
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="backdrop-blur-xl bg-white/25 border border-gray-200/40 rounded-2xl p-8 hover:bg-white/35 transition-all duration-500 group hover:scale-[1.02] hover:shadow-xl hover:shadow-gray-500/10"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100/80 to-gray-200/60 border border-gray-300/50 flex items-center justify-center mb-6 group-hover:shadow-lg transition-all duration-300">
                  <div className="text-gray-700 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                <div className="text-gray-800 font-medium flex items-center group-hover:text-orange-600 transition-colors duration-300">
                  Explore
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/40 to-gray-100/30 border border-gray-200/50 rounded-3xl p-12 shadow-xl shadow-gray-500/10">
            <blockquote className="text-2xl md:text-3xl font-light text-gray-800 italic mb-6 leading-relaxed">
              &ldquo;The curious paradox is that when I accept myself just as I am, 
              then I can change.&rdquo;
            </blockquote>
            <cite className="text-gray-600 font-medium">— Carl Rogers</cite>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="backdrop-blur-xl bg-gradient-to-br from-white/50 to-gray-100/40 border border-gray-200/50 rounded-3xl p-12 shadow-2xl shadow-gray-500/10">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Your Journey Starts Here
            </h2>
            <p className="text-gray-600 text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Take the first step toward deeper self-understanding and authentic personal growth.
            </p>
            <Link 
              href="/login"
              className="inline-block bg-gradient-to-r from-gray-900 to-gray-800 text-white px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:from-gray-800 hover:to-gray-700"
            >
              Begin Your Journey
            </Link>
          </div>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-gray-300/50 backdrop-blur-md bg-white/40 py-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="text-lg font-bold text-gray-800">SoulSpect</span>
            </div>
            <div className="text-gray-600 text-sm">
              © {new Date().getFullYear()} SoulSpect. A space for inner growth.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Feature data for SoulSpect
const features = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Analytics",
    description: "Gain deeper insights into your emotional patterns and personal growth through thoughtful self-discovery tools and meaningful data visualization."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
    title: "Soulspace",
    description: "A sacred digital space for inner transformation through guided exploration, emotional release, and intuitive decision-making practices."
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    ),
    title: "Purpose Compass",
    description: "Discover and align with your authentic values and life purpose through reflective exercises and personalized guidance for meaningful living."
  }
];