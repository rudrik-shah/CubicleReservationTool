import { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  onToggleSidebar?: () => void;
}

export function Header({ title, onToggleSidebar }: HeaderProps) {
  const [hasNotifications, setHasNotifications] = useState(false);
  
  return (
    <header className="bg-white shadow-sm">
      <div className="flex justify-between items-center px-4 py-4 sm:px-6 lg:px-8">
        <div className="md:hidden flex items-center">
          <button 
            type="button" 
            onClick={onToggleSidebar}
            className="text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
          <h1 className="ml-2 text-xl font-bold text-gray-800">CubicleBook</h1>
        </div>
        <div className="hidden md:block">
          <h1 className="text-xl font-bold text-gray-800">{title}</h1>
        </div>
        <div className="flex items-center">
          <div className="relative">
            <button 
              type="button" 
              className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6 text-gray-400" />
              {hasNotifications && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
