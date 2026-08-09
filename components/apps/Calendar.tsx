'use client';

import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Clock, Type, X, AlignLeft } from 'lucide-react';

interface CalendarEvent {
  id: string;
  date: number; // Day of the month
  month: number; // 0-11
  year: number;
  title: string;
  type: 'meeting' | 'deadline' | 'payroll' | 'other';
  time: string;
  description: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<'meeting' | 'deadline' | 'payroll' | 'other'>('meeting');
  const [formTime, setFormTime] = useState('10:00');
  const [formDesc, setFormDesc] = useState('');

  // Initial load
  useEffect(() => {
    const saved = localStorage.getItem('synapse-calendar-events');
    if (saved) {
      setEvents(JSON.parse(saved));
    } else {
      // Mock Data
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      setEvents([
        { id: '1', date: 15, month: currentMonth, year: currentYear, title: 'Board Meeting', type: 'meeting', time: '14:00', description: 'Q3 Earnings Review' },
        { id: '2', date: 22, month: currentMonth, year: currentYear, title: 'Tax Deadline', type: 'deadline', time: '17:00', description: 'File state taxes' },
        { id: '3', date: 28, month: currentMonth, year: currentYear, title: 'Payroll Run', type: 'payroll', time: '09:00', description: 'Monthly payroll processing' },
      ]);
    }
  }, []);

  // Save to local storage
  useEffect(() => {
    if (events.length > 0) {
      localStorage.setItem('synapse-calendar-events', JSON.stringify(events));
    }
  }, [events]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const openAddEvent = (day?: number) => {
    setSelectedDay(day || currentDate.getDate());
    setFormTitle('');
    setFormType('meeting');
    setFormTime('10:00');
    setFormDesc('');
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !selectedDay) return;

    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      date: selectedDay,
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
      title: formTitle,
      type: formType,
      time: formTime,
      description: formDesc
    };

    setEvents([...events, newEvent]);
    setIsModalOpen(false);
  };

  const deleteEvent = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setEvents(events.filter(ev => ev.id !== id));
  };

  const getEventColors = (type: string) => {
    switch(type) {
      case 'meeting': return { bg: 'var(--accent-primary-dim)', text: 'var(--accent-primary)' };
      case 'deadline': return { bg: 'var(--accent-danger-dim)', text: 'var(--accent-danger)' };
      case 'payroll': return { bg: 'var(--accent-success-dim)', text: 'var(--accent-success)' };
      default: return { bg: 'var(--surface-3)', text: 'var(--text-secondary)' };
    }
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  return (
    <div className="h-full flex flex-col p-6 bg-transparent text-white font-sans relative">
      
      {/* ── Header ── */}
      <div className="flex justify-between items-end mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
               style={{ background: 'linear-gradient(135deg, var(--accent-danger), var(--accent-purple))' }}>
            <span className="text-xl font-black">{currentDate.getDate()}</span>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
            </h2>
            <p className="text-sm font-medium mt-1" style={{ color: 'var(--text-ghost)' }}>
              Financial Calendar
            </p>
          </div>
        </div>
        
        <div className="flex gap-4">
          <div className="flex gap-1" style={{ background: 'var(--surface-2)', borderRadius: '12px', padding: '4px', border: '1px solid var(--glass-border)' }}>
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><ChevronLeft size={16} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 rounded-lg hover:bg-white/10 text-xs font-bold transition-colors">Today</button>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/10 transition-colors"><ChevronRight size={16} /></button>
          </div>
          <button 
            onClick={() => openAddEvent()}
            className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-md"
            style={{ background: 'var(--accent-primary)', color: 'white', boxShadow: '0 4px 14px var(--accent-primary-glow)' }}
          >
            <Plus size={16} /> New Event
          </button>
        </div>
      </div>

      {/* ── Grid ── */}
      <div 
        className="flex-1 rounded-2xl overflow-hidden flex flex-col shadow-xl"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--glass-border)' }}
      >
        {/* Days of week */}
        <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-2)' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-3 text-center text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-ghost)' }}>
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Body */}
        <div className="flex-1 grid grid-cols-7 grid-rows-5 bg-transparent">
          {blanks.map(i => (
            <div key={`blank-${i}`} className="p-2 border-r border-b opacity-50" style={{ borderColor: 'var(--glass-border)', background: 'rgba(0,0,0,0.2)' }} />
          ))}
          
          {days.map(day => {
            const dayEvents = events.filter(e => e.date === day && e.month === currentDate.getMonth() && e.year === currentDate.getFullYear());
            const today = isToday(day);
            
            return (
              <div 
                key={day} 
                onClick={() => openAddEvent(day)}
                className="p-2 border-r border-b flex flex-col gap-1 hover:bg-white/[0.02] transition-colors cursor-pointer group"
                style={{ borderColor: 'var(--glass-border)' }}
              >
                <div className="flex justify-between items-start">
                  <span 
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${today ? 'text-white' : ''}`}
                    style={{ 
                      background: today ? 'var(--accent-primary)' : 'transparent',
                      color: today ? 'white' : 'var(--text-secondary)',
                      boxShadow: today ? '0 2px 8px var(--accent-primary-glow)' : 'none'
                    }}
                  >
                    {day}
                  </span>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                  {dayEvents.map(event => {
                    const colors = getEventColors(event.type);
                    return (
                      <div 
                        key={event.id} 
                        className="text-[10px] font-semibold px-2 py-1 rounded truncate relative group/event transition-all hover:brightness-110"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        <span className="mr-1 opacity-75">{event.time}</span>
                        {event.title}
                        
                        <button 
                          onClick={(e) => deleteEvent(e, event.id)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/event:opacity-100 p-0.5 rounded-full hover:bg-black/20"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Add Event Modal ── */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div 
            className="w-[400px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in"
            style={{ 
              background: 'var(--surface-1)', 
              border: '1px solid var(--glass-border)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05) inset'
            }}
          >
            <div className="px-6 py-4 flex justify-between items-center border-b" style={{ borderColor: 'var(--glass-border)', background: 'var(--surface-2)' }}>
              <h3 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>Add Event</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={16} style={{ color: 'var(--text-ghost)' }} />
              </button>
            </div>
            
            <form onSubmit={handleSaveEvent} className="p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b pb-2" style={{ borderColor: 'var(--glass-border)' }}>
                <Type size={16} style={{ color: 'var(--text-ghost)' }} />
                <input 
                  type="text" 
                  placeholder="Event title" 
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-base font-semibold"
                  style={{ color: 'var(--text-primary)' }}
                  autoFocus
                  required
                />
              </div>

              <div className="flex gap-4">
                <div className="flex-1 flex items-center gap-3 border-b pb-2" style={{ borderColor: 'var(--glass-border)' }}>
                  <CalendarIcon size={16} style={{ color: 'var(--text-ghost)' }} />
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {currentDate.toLocaleString('default', { month: 'short' })} {selectedDay}, {currentDate.getFullYear()}
                  </span>
                </div>
                <div className="flex-1 flex items-center gap-3 border-b pb-2" style={{ borderColor: 'var(--glass-border)' }}>
                  <Clock size={16} style={{ color: 'var(--text-ghost)' }} />
                  <input 
                    type="time" 
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-sm font-medium"
                    style={{ color: 'var(--text-primary)' }}
                    required
                  />
                </div>
              </div>

              <div className="flex items-start gap-3 border-b pb-2" style={{ borderColor: 'var(--glass-border)' }}>
                <AlignLeft size={16} style={{ color: 'var(--text-ghost)', marginTop: '4px' }} />
                <textarea 
                  placeholder="Description..." 
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-sm resize-none h-20 custom-scrollbar"
                  style={{ color: 'var(--text-secondary)' }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-ghost)' }}>Type</span>
                <div className="flex gap-2">
                  {['meeting', 'deadline', 'payroll', 'other'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormType(type as any)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                      style={{
                        background: formType === type ? 'var(--surface-3)' : 'transparent',
                        color: formType === type ? 'var(--text-primary)' : 'var(--text-ghost)',
                        border: formType === type ? '1px solid var(--glass-border)' : '1px solid transparent'
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-bold transition-colors hover:bg-white/5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 rounded-xl text-sm font-bold transition-transform active:scale-95 shadow-md"
                  style={{ background: 'var(--accent-primary)', color: 'white' }}
                >
                  Save Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
