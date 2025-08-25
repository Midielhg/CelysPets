import React from 'react';
import { Link } from 'react-router-dom';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Logo: React.FC<LogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16'
  };

  const textSizeClasses = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  return (
    <Link to="/" className={`flex items-center ${className}`}>
      <img 
        src="/logo-1.png" 
        alt="Cely's Pets Mobile Grooming" 
        className={`${sizeClasses[size]} w-auto hover:opacity-90 transition-opacity duration-300`}
        onError={(e) => {
          // Fallback to text logo if image fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          target.nextElementSibling?.classList.remove('hidden');
        }}
      />
      <div className={`hidden font-bold ${textSizeClasses[size]} text-rose-600 hover:text-rose-700 transition-colors duration-300`}>
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
