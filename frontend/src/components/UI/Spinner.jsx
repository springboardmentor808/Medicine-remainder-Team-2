import React from 'react';

const Spinner = ({ size = 'md', fullPage = false }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div 
        className={`
          animate-spin rounded-full 
          border-t-primary-500 border-r-transparent border-b-transparent border-l-transparent
          border-slate-200 dark:border-slate-700
          ${sizeClasses[size]}
        `}
      />
      {fullPage && (
        <p className="text-xs font-semibold tracking-wider text-slate-400 dark:text-slate-500 uppercase animate-pulse">
          Loading Health Data...
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/70 dark:bg-darkbg-950/70 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default Spinner;
