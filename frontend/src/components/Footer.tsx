'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  
  // Don't show footer on auth pages, dashboard pages, or landing page (they have their own footer)
  const hideFooter = pathname === '/' || pathname === '/login' || pathname === '/register' || pathname.startsWith('/dashboard');
  
  if (hideFooter) {
    return null;
  }

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center mb-4">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-lg">E</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Exeloka</span>
            </div>
            <p className="text-gray-600 mb-4 max-w-md">
              AI-powered cultural wisdom recommendation system for Sampang, East Java. 
              Bridging traditional knowledge with modern project management for sustainable community development.
            </p>
            <p className="text-sm text-gray-500">
              Empowering communities through cultural understanding and intelligent recommendations.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Quick Links
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/dashboard/projects" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/dashboard/knowledge" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Knowledge Base
                </Link>
              </li>
              <li>
                <Link href="/dashboard/recommendations" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Recommendations
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
              Resources
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="/docs" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="/api" className="text-gray-600 hover:text-blue-600 transition-colors">
                  API Reference
                </a>
              </li>
              <li>
                <a href="/support" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Support
                </a>
              </li>
              <li>
                <a href="/privacy" className="text-gray-600 hover:text-blue-600 transition-colors">
                  Privacy Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-6 mb-4 md:mb-0">
              <p className="text-sm text-gray-500">
                © {currentYear} Exeloka. All rights reserved.
              </p>
            </div>
            
            <div className="flex items-center space-x-6">
              <span className="text-sm text-gray-500">
                Built with cultural wisdom in mind
              </span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-gray-500">System Status: Operational</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              This system is designed to respect and preserve the cultural heritage of Sampang, East Java, 
              while providing modern tools for community engagement and project management.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}