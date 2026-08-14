import React, { useState, useEffect } from 'react';
import { 
  GitCommit, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Play, 
  Award,
  Clock,
  MessageSquare
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import Card from '../components/UI/Card';
import Spinner from '../components/UI/Spinner';

const TimelineView = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await api.getDashboard();
        if (res && res.success) {
          setEvents(res.data.timelineEvents || []);
        }
      } catch (e) {
        showToast(e.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, []);

  const getEventStyles = (type) => {
    switch (type) {
      case 'medication_start':
        return {
          color: 'text-blue-500 bg-blue-500/10 border-blue-500',
          icon: Play
        };
      case 'medication_end':
        return {
          color: 'text-indigo-500 bg-indigo-500/10 border-indigo-500',
          icon: Award
        };
      case 'dose_taken':
        return {
          color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500',
          icon: CheckCircle
        };
      case 'dose_missed':
        return {
          color: 'text-red-500 bg-red-500/10 border-red-500',
          icon: XCircle
        };
      case 'dose_skipped':
        return {
          color: 'text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-400',
          icon: AlertCircle
        };
      default:
        return {
          color: 'text-primary-500 bg-primary-500/10 border-primary-500',
          icon: GitCommit
        };
    }
  };

  if (loading) return <Spinner fullPage />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Title Header */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          Treatment Timeline
        </h3>
        <p className="text-xs text-slate-400">
          Chronological breakdown of prescription milestones and daily log events.
        </p>
      </div>

      {/* Main Timeline Line container */}
      <Card className="relative p-6 overflow-hidden">
        {events.length > 0 ? (
          <div className="relative">
            {/* The vertical timeline connector bar */}
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-slate-800" />

            <div className="space-y-6">
              {events.map((event, index) => {
                const { color, icon: Icon } = getEventStyles(event.type);
                const eventDate = new Date(event.time).toLocaleDateString([], { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                });
                const eventTime = new Date(event.time).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                });

                return (
                  <div key={index} className="flex gap-4 relative animate-slide-in text-left">
                    
                    {/* Node circle on timeline */}
                    <div className={`
                      w-8 h-8 rounded-full border-2 flex items-center justify-center z-10 flex-shrink-0
                      ${color}
                    `}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Timeline Event Details Box */}
                    <div className="flex-1 bg-white/40 dark:bg-darkbg-850/40 p-4 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm hover:shadow-md transition-shadow">
                      
                      {/* Top time row */}
                      <div className="flex items-center justify-between flex-wrap gap-1 mb-2">
                        <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" /> {eventDate} at {eventTime}
                        </span>
                        
                        {event.type.startsWith('dose_') && (
                          <span className={`
                            text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded
                            ${event.type === 'dose_taken' ? 'bg-emerald-500/10 text-emerald-500' :
                              event.type === 'dose_missed' ? 'bg-red-500/10 text-red-500' :
                              'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }
                          `}>
                            {event.title}
                          </span>
                        )}
                      </div>

                      {/* Main title */}
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-slate-200">
                        {event.type.startsWith('medication_') ? event.title : event.medicineName}
                      </h4>
                      
                      <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                        {event.description}
                      </p>

                      {/* Notes indicator if present */}
                      {event.notes && (
                        <div className="mt-2.5 bg-slate-50 dark:bg-darkbg-900/60 p-2.5 rounded-xl border border-slate-200/20 flex items-start gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-primary-500 mt-0.5 flex-shrink-0" />
                          <p className="text-[11px] text-slate-450 dark:text-slate-450 italic leading-relaxed">
                            "{event.notes}"
                          </p>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400 text-xs">
            No events registered in your treatment history. Log some medications to populate.
          </div>
        )}
      </Card>
    </div>
  );
};

export default TimelineView;
