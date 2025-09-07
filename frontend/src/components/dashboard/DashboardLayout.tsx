import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  children, 
  title,
  className = '' 
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {title && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        </div>
      )}
      {children}
    </div>
  );
};

export default DashboardLayout;