
import React from 'react';
import { User } from '../types';
import { FilmIcon, LogoutIcon } from './icons';

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  return (
    <header className="bg-gray-800/80 backdrop-blur-sm sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <FilmIcon className="h-8 w-8 text-blue-500"/>
            <span className="text-xl font-bold ml-3 text-white">SyncStream</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center font-bold text-white">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-gray-300 hidden sm:block">{user.name}</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center px-3 py-2 bg-gray-700 hover:bg-red-600 text-white rounded-md text-sm font-medium transition-colors"
              aria-label="Logout"
            >
              <LogoutIcon className="h-5 w-5" />
               <span className="ml-2 hidden sm:block">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
