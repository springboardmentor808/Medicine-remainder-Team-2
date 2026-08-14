import React from 'react';
import { Link } from 'react-router-dom';
import { Pill, AlertCircle, Home } from 'lucide-react';
import Card from '../components/UI/Card';

const NotFound = () => {
  return (
    <div className="max-w-md mx-auto py-16 px-4 text-center">
      <Card className="flex flex-col items-center p-8 border border-slate-200/50 dark:border-slate-800/50">
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 text-red-500 flex items-center justify-center mb-6">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <h3 className="text-xl font-bold text-slate-850 dark:text-slate-100">
          Page Not Found (404)
        </h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          The requested URL path does not exist on this Medication Adherence System. Check your route spelling or go back home.
        </p>

        <Link
          to="/"
          className="mt-6 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold transition-all shadow flex items-center gap-2"
        >
          <Home className="w-4 h-4" /> Go to Dashboard
        </Link>
      </Card>
    </div>
  );
};

export default NotFound;
