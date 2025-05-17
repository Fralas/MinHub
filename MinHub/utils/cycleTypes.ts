export interface PeriodData {
  id: string;
  startDate: string;
  endDate: string | null;
}

export interface CycleSettings {
  averageCycleLength: number;
  averagePeriodLength: number;
}