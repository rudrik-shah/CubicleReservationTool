import { Link, useLocation } from 'wouter';
import { Layout, Calendar, Settings, Building } from 'lucide-react';
import { cn } from '@/lib/utils';
import React from 'react';

interface SidebarProps {
  cecId?: string;
}

export function Sidebar({ cecId }: SidebarProps) {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <Layout className="mr-3 h-6 w-6" />,
    },
    {
      name: 'My Bookings',
      path: '/my-bookings',
      icon: <Calendar className="mr-3 h-6 w-6" />,
    },
    {
      name: 'Admin',
      path: '/admin',
      icon: <Settings className="mr-3 h-6 w-6" />,
    },
  ];

  return (
    <div className="bg-white w-full md:w-64 shadow-md md:min-h-screen">
      {/* App Logo */}
      <div className="flex items-center justify-center md:justify-start p-4 border-b border-gray-200">
        <Building className="h-8 w-8 text-primary" />
        <span className="ml-2 text-xl font-semibold text-gray-800">CubicleBook</span>
      </div>
      
      {/* Navigation Links */}
      <nav className="mt-5 px-2">
        {menuItems.map((item) => (
          <div key={item.path}>
            <Link href={item.path}>
              <div
                className={cn(
                  "group flex items-center px-2 py-2 text-base font-medium rounded-md",
                  isActive(item.path)
                    ? "bg-primary-50 text-primary"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                {React.cloneElement(item.icon, {
                  className: cn(
                    item.icon.props.className,
                    isActive(item.path) ? "text-primary" : "text-gray-400 group-hover:text-gray-500"
                  ),
                })}
                {item.name}
              </div>
            </Link>
          </div>
        ))}
      </nav>
      
      {/* User Section */}
      <div className="mt-auto border-t border-gray-200 p-4 hidden md:block">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
              {cecId ? cecId.slice(0, 2) : 'U'}
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">
              {cecId ? 'User' : 'Guest User'}
            </p>
            <p className="text-xs font-medium text-gray-500">
              {cecId || 'No CEC ID'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
