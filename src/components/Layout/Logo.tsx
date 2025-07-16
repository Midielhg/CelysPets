import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <Link to="/" className={`flex items-center space-x-2 ${className}`}>
      <div className={`font-bold ${sizeClasses[size]} text-rose-600 hover:text-rose-700 transition-colors duration-300`}>
        <span className="italic">Cely's</span>
        <span className="font-extrabold ml-1 text-rose-700">Pets</span>
        <div className="text-sm font-medium text-rose-600 mt-0 tracking-wide">
          MOBILE GROOMING
        </div>
      </div>
    </Link>
  );
};

export default Logo;
