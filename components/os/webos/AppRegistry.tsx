'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  CreditCard, 
  FileText, 
  BrainCircuit, 
  Settings, 
  PieChart,
  Landmark,
  ShieldAlert,
  Tag,
  TrendingUp,
  ShoppingBag,
  BarChart3,
  Folder,
  Terminal as TerminalIcon,
  Activity,
  Search,
  Music,
  Sparkles,
  Database,
  Music2,
  Mic,
  Mail as MailIcon
} from 'lucide-react';

import Dashboard from '@/components/apps/Dashboard';
import SpendSense from '@/components/apps/SpendSense';
import PredictiveAR from '@/components/apps/PredictiveAR';
import AIBrain from '@/components/apps/AIBrain';
import BudgetBrain from '@/components/apps/BudgetBrain';
import Treasury from '@/components/apps/Treasury';
import TaxPilot from '@/components/apps/TaxPilot';
import VendorIQ from '@/components/apps/VendorIQ';
import InvestIQ from '@/components/apps/InvestIQ';
import DataMarket from '@/components/apps/DataMarket';
import SettingsApp from '@/components/apps/SettingsApp';
import AIFPNAStudio from '@/components/apps/AIFPNAStudio';
import FileExplorer from '@/components/apps/FileExplorer';
import Terminal from '@/components/apps/Terminal';
import Calculator from '@/components/apps/Calculator';
import Calendar from '@/components/apps/Calendar';
import TaskManager from '@/components/apps/TaskManager';
import GoogleApp from '@/components/apps/GoogleApp';
import NotesApp from '@/components/apps/NotesApp';
import SynapseMusic from '@/components/apps/SynapseMusic';
import MailApp from '@/components/apps/Mail';

export type AppId = 
  | 'dashboard' 
  | 'spendsense' 
  | 'predictivear' 
  | 'budgetbrain' 
  | 'treasury' 
  | 'taxpilot' 
  | 'vendoriq' 
  | 'investiq' 
  | 'datamarket' 
  | 'aibrain' 
  | 'settings' 
  | 'fpnastudio' 
  | 'explorer' 
  | 'terminal' 
  | 'calculator' 
  | 'calendar'
  | 'taskmanager'
  | 'google'
  | 'notes'
  | 'music'
  | 'voice'
  | 'mail';

export interface AppDefinition {
  id: AppId;
  name: string;
  icon: any;
  color: string;
  component: React.ComponentType<any>;
  hidden?: boolean;
}

/*
 * Gradient icon backgrounds — curated per-app instead of generic bg-blue-500.
 * Uses Tailwind's bg-gradient-to-br with handpicked stop colors.
 */
export const AppRegistry: AppDefinition[] = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, color: 'bg-gradient-to-br from-blue-500 to-blue-700', component: Dashboard },
  { id: 'spendsense', name: 'SpendSense', icon: CreditCard, color: 'bg-gradient-to-br from-emerald-400 to-emerald-600', component: SpendSense },
  { id: 'predictivear', name: 'PredictiveAR', icon: FileText, color: 'bg-gradient-to-br from-amber-400 to-orange-600', component: PredictiveAR },
  { id: 'budgetbrain', name: 'BudgetBrain', icon: PieChart, color: 'bg-gradient-to-br from-violet-500 to-purple-700', component: BudgetBrain, hidden: true },
  { id: 'treasury', name: 'Treasury', icon: Landmark, color: 'bg-gradient-to-br from-indigo-500 to-indigo-700', component: Treasury, hidden: true },
  { id: 'taxpilot', name: 'TaxPilot', icon: ShieldAlert, color: 'bg-gradient-to-br from-rose-500 to-red-700', component: TaxPilot },
  { id: 'vendoriq', name: 'VendorIQ', icon: Tag, color: 'bg-gradient-to-br from-teal-400 to-teal-600', component: VendorIQ },
  { id: 'investiq', name: 'InvestIQ', icon: TrendingUp, color: 'bg-gradient-to-br from-cyan-400 to-cyan-600', component: InvestIQ },
  { id: 'datamarket', name: 'DataMarket', icon: ShoppingBag, color: 'bg-gradient-to-br from-pink-400 to-pink-600', component: DataMarket, hidden: true },
  { id: 'fpnastudio', name: 'FP&A Studio', icon: BarChart3, color: 'bg-gradient-to-br from-orange-400 to-orange-600', component: AIFPNAStudio },
  { id: 'explorer', name: 'Files', icon: Folder, color: 'bg-gradient-to-br from-blue-400 to-blue-600', component: FileExplorer },
  { id: 'terminal', name: 'Terminal', icon: TerminalIcon, color: 'bg-gradient-to-br from-zinc-600 to-zinc-800', component: Terminal },
  { id: 'calculator', name: 'Calculator', icon: PieChart, color: 'bg-gradient-to-br from-emerald-500 to-emerald-700', component: Calculator },
  { id: 'calendar', name: 'Calendar', icon: LayoutDashboard, color: 'bg-gradient-to-br from-rose-400 to-rose-600', component: Calendar },
  { id: 'taskmanager', name: 'Task Manager', icon: Activity, color: 'bg-gradient-to-br from-zinc-500 to-zinc-700', component: TaskManager },
  { id: 'google', name: 'Google', icon: Search, color: 'bg-gradient-to-br from-slate-100 to-slate-300', component: GoogleApp },
  { id: 'notes', name: 'Notes', icon: FileText, color: 'bg-gradient-to-br from-amber-500 to-amber-700', component: NotesApp },
  { id: 'music', name: 'Music', icon: Music, color: 'bg-gradient-to-br from-indigo-500 to-purple-600', component: SynapseMusic },
  { id: 'voice', name: 'Voice', icon: Mic, color: 'bg-gradient-to-br from-blue-400 to-indigo-500', component: () => null },
  { id: 'aibrain', name: 'Velyra', icon: Sparkles, color: 'bg-gradient-to-br from-violet-400 to-indigo-500', component: AIBrain },
  { id: 'settings', name: 'Settings', icon: Settings, color: 'bg-gradient-to-br from-zinc-500 to-zinc-700', component: SettingsApp },
  { id: 'mail', name: 'Mail', icon: MailIcon, color: 'bg-gradient-to-br from-red-400 to-red-600', component: MailApp },
];
