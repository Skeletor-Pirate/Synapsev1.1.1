'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface CalendarEvent {
  id: string;
  date: number;
  title: string;
  type: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('calendar-events');
      if (saved) return JSON.parse(saved);
    }
    return [
      { id: '1', date: 15, title: 'Board Meeting', type: 'meeting' },
      { id: '2', date: 22, title: 'Tax Deadline', type: 'deadline' },
      { id: '3', date: 28, title: 'Payroll Run', type: 'payroll' },
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('calendar-events', JSON.stringify(events));
  }, [events]);

  const handleAddEvent = () => {
    const title = prompt('Enter event title:');
    if (!title) return;
    const dateStr = prompt('Enter date (1-31):');
    const date = parseInt(dateStr || '1');
    if (isNaN(date) || date < 1 || date > 31) return;
    
    const type = prompt('Enter type (meeting, deadline, payroll):') || 'meeting';
    
    setEvents([...events, { id: Date.now().toString(), date, title, type }]);
  };

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  return (
    <div className="h-full bg-transparent text-zinc-300 font-sans flex flex-col p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-black tracking-tighter text-white">
            {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
          </h2>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Financial Schedule</p>
        </div>
        <div className="flex gap-4">
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><ChevronLeft size={20} /></button>
            <button onClick={nextMonth} className="p-2 hover:bg-white/5 rounded-xl transition-colors"><ChevronRight size={20} /></button>
          </div>
          <button 
            onClick={handleAddEvent}
            className="px-4 py-2 bg-white text-black rounded-xl text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center gap-2"
          >
            <Plus size={14} /> New Event
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-7 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-zinc-900/50 p-4 text-center text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-white/5">
            {day}
          </div>
        ))}
        {blanks.map(i => (
          <div key={`blank-${i}`} className="bg-zinc-900/20 p-4 h-32" />
        ))}
        {days.map(day => {
          const dayEvents = events.filter(e => e.date === day);
          return (
            <div key={day} className="bg-zinc-900/50 p-4 h-32 border-r border-b border-white/5 hover:bg-zinc-900 transition-colors group cursor-pointer relative">
              <span className="text-sm font-bold text-zinc-400 group-hover:text-white transition-colors">{day}</span>
              <div className="mt-2 space-y-1">
                {dayEvents.map((event, i) => (
                  <div 
                    key={i} 
                    className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-tighter truncate ${
                      event.type === 'meeting' ? 'bg-blue-500/10 text-blue-500' :
                      event.type === 'deadline' ? 'bg-rose-500/10 text-rose-500' :
                      'bg-emerald-500/10 text-emerald-500'
                    }`}
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
