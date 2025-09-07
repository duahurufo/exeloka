'use client';

import Link from 'next/link';
import { ArrowRightIcon, BeakerIcon, DocumentTextIcon, GlobeAsiaAustraliaIcon } from '@heroicons/react/24/outline';

const features = [
  {
    icon: GlobeAsiaAustraliaIcon,
    title: 'Cultural Wisdom Database',
    description: 'Comprehensive knowledge base of Sampang\'s traditions, customs, and local practices for informed decision-making.',
  },
  {
    icon: BeakerIcon,
    title: 'AI-Powered Analysis',
    description: 'Advanced AI analyzes cultural context to generate tailored engagement strategies for your specific project.',
  },
  {
    icon: DocumentTextIcon,
    title: 'Professional Deliverables',
    description: 'Generate comprehensive reports in DOCX, XLSX, and PPTX formats ready for stakeholder presentations.',
  },
];

const testimonials = [
  {
    name: 'PT Pembangunan Jaya',
    role: 'Infrastructure Development',
    content: 'Exeloka helped us achieve 95% community acceptance for our road development project. The cultural insights were invaluable.',
  },
  {
    name: 'Indocement',
    role: 'Manufacturing',
    content: 'The AI recommendations guided our community engagement perfectly. We avoided cultural missteps and built strong relationships.',
  },
  {
    name: 'BNI Regional Office',
    role: 'Financial Services',
    content: 'Understanding local customs helped us design culturally appropriate services. Highly recommend for any Sampang operations.',
  },
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="relative px-4 py-4 flex justify-between items-center bg-white border-b border-gray-200">
        <div className="text-2xl font-bold text-blue-600">
          Exeloka
        </div>
        <div className="lg:hidden">
          <button className="navbar-burger flex items-center text-blue-600 p-3">
            <svg className="block h-4 w-4 fill-current" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"></path>
            </svg>
          </button>
        </div>
        <ul className="hidden lg:flex lg:items-center lg:w-auto lg:space-x-6">
          <li><a className="text-sm text-gray-600 hover:text-gray-900" href="#features">Features</a></li>
          <li><a className="text-sm text-gray-600 hover:text-gray-900" href="#testimonials">Success Stories</a></li>
          <li><a className="text-sm text-gray-600 hover:text-gray-900" href="#about">About</a></li>
        </ul>
        <div className="hidden lg:flex space-x-3">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            Sign In
          </Link>
          <Link href="/register" className="btn-primary text-sm">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Cultural Wisdom for
              <span className="text-blue-600"> Successful </span>
              Community Engagement
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Leverage AI-powered insights from Sampang's rich cultural heritage to ensure your projects 
              gain community acceptance and achieve lasting success in East Java.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="inline-flex items-center btn-primary text-lg px-8 py-3">
                Start Your Project
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <Link href="/demo" className="btn-secondary text-lg px-8 py-3">
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powered by Cultural Intelligence
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our AI system combines deep cultural knowledge with modern technology to guide your community engagement strategy.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 mb-6 bg-blue-100 rounded-lg">
                  <feature.icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple. Smart. Successful.
            </h2>
            <p className="text-xl text-gray-600">
              Get cultural recommendations in minutes, not months
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                1
              </div>
              <h3 className="font-semibold mb-2">Describe Your Project</h3>
              <p className="text-gray-600 text-sm">Tell us about your plans, location, and stakeholders</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                2
              </div>
              <h3 className="font-semibold mb-2">AI Analyzes Context</h3>
              <p className="text-gray-600 text-sm">Our system matches your project with relevant cultural insights</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                3
              </div>
              <h3 className="font-semibold mb-2">Get Recommendations</h3>
              <p className="text-gray-600 text-sm">Receive detailed strategy with cultural considerations</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl mx-auto mb-4">
                4
              </div>
              <h3 className="font-semibold mb-2">Download & Execute</h3>
              <p className="text-gray-600 text-sm">Get professional documents ready for implementation</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20 px-4 bg-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Leading Companies
            </h2>
            <p className="text-xl text-gray-600">
              See how Exeloka has helped companies succeed in Sampang
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white rounded-lg p-8 shadow-sm">
                <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-sm text-gray-500">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Engage with Confidence?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join hundreds of companies who trust Exeloka for culturally-informed community engagement in Sampang.
          </p>
          <Link href="/register" className="inline-flex items-center bg-white text-blue-600 font-semibold px-8 py-3 rounded-md hover:bg-gray-50 transition-colors">
            Start Your Project Today
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="text-2xl font-bold text-white mb-4">Exeloka</div>
              <p className="text-gray-400 text-sm">
                Cultural wisdom for successful community engagement in Sampang, East Java.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-400 hover:text-white">Features</a></li>
                <li><a href="/demo" className="text-gray-400 hover:text-white">Demo</a></li>
                <li><a href="/pricing" className="text-gray-400 hover:text-white">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/about" className="text-gray-400 hover:text-white">About</a></li>
                <li><a href="/contact" className="text-gray-400 hover:text-white">Contact</a></li>
                <li><a href="/privacy" className="text-gray-400 hover:text-white">Privacy</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/help" className="text-gray-400 hover:text-white">Help Center</a></li>
                <li><a href="/docs" className="text-gray-400 hover:text-white">Documentation</a></li>
                <li><a href="/support" className="text-gray-400 hover:text-white">Contact Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 Exeloka. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 sm:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}