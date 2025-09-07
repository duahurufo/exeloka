'use client';

import { useAuth } from '@/lib/auth';

export default function DashboardFooter() {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500 space-y-2 md:space-y-0">
        <div className="flex items-center space-x-4">
          <span>© {currentYear} Exeloka - Cultural Wisdom Recommendations</span>
          {user && (
            <span className="hidden md:inline">
              Logged in as: {user.full_name}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="hidden sm:inline">System Status:</span>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs">Online</span>
          </div>
        </div>
      </div>
    </footer>
  );
}