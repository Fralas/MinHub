import { PeriodData } from './cycleTypes';

export const getAverageCycleLength = (periods: PeriodData[]): number => {
    if (periods.length < 2) return 28;
    let totalCycleDays = 0;
    let completedCycles = 0;
    const sortedPeriods = [...periods].sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

    for (let i = 0; i < sortedPeriods.length - 1; i++) {
        const currentCycleStartDate = new Date(sortedPeriods[i].startDate);
        const nextCycleStartDate = new Date(sortedPeriods[i + 1].startDate);
        const diffTime = Math.abs(nextCycleStartDate.getTime() - currentCycleStartDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 15 && diffDays < 60) {
            totalCycleDays += diffDays;
            completedCycles++;
        }
    }
    return completedCycles > 0 ? Math.round(totalCycleDays / completedCycles) : 28;
};

export const getAveragePeriodLength = (periods: PeriodData[]): number => {
    if (periods.length === 0) return 5;
    let totalPeriodDays = 0;
    let numPeriodsWithEndDate = 0;
    periods.forEach(p => {
        if (p.endDate) {
            const start = new Date(p.startDate);
            const end = new Date(p.endDate);
            const diffTime = Math.abs(end.getTime() - start.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
             if (diffDays > 0 && diffDays < 15) {
                totalPeriodDays += diffDays;
                numPeriodsWithEndDate++;
            }
        }
    });
    return numPeriodsWithEndDate > 0 ? Math.round(totalPeriodDays / numPeriodsWithEndDate) : 5;
};

export const formatDateToYYYYMMDD = (date: Date): string => {
    return date.toISOString().split('T')[0];
};