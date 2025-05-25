export interface PeriodData {
  id: string;
  startDate: string;
  endDate: string | null;
  dailyLogs?: DailyLog[]; 
}

export interface CycleSettings {
  averageCycleLength: number;
  averagePeriodLength: number;
}

export type FlowIntensity = 'spotting' | 'light' | 'medium' | 'heavy';

export interface DailyLog {
  date: string;
  flow?: FlowIntensity;
  symptoms?: string[];
  notes?: string;
}