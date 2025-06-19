import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, MessageSquarePlus, Inbox, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Home', icon: Home, path: '/dashboard' },
  { name: 'Send', icon: MessageSquarePlus, path: '/send-message' },
  { name: 'Messages', icon: Inbox, path: '/messages' },
  { name: 'Profile', icon: User, path: '/edit-profile' },
];

const BottomNavigationBar: React.FC = () => {
  const location = useLocation();

  // Hide navigation on specific routes
  const hideOnRoutes = ['/', '/login', '/register', '/404'];
  if (hideOnRoutes.includes(location.pathname)) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-lg md:hidden">
      <div className="flex justify-around h-16 items-center">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center text-xs font-medium transition-colors duration-200",
                isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              )}
            >
              <item.icon className={cn("w-6 h-6 mb-1", isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400")} />
              {item.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigationBar;