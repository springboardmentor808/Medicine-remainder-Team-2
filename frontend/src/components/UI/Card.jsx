import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  hoverable = false, 
  glow = false,
  onClick 
}) => {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-2xl p-5 
        glass-card 
        ${hoverable ? 'glass-card-hover cursor-pointer' : ''} 
        ${glow ? 'animate-pulse-glow border-primary-500/30' : ''} 
        transition-all duration-300
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default Card;
