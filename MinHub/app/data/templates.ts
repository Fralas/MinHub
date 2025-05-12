export interface DetailedStep {
    stepNumber: number;
    instruction: string;
    estimatedTimeMinutes?: number;
    isOptional?: boolean;
}

export interface ProductiveReminderTemplate {
  id: string;
  uniqueInternalCode: string; 
  title: string;
  description: string;
  longDescription?: string; 
  defaultTimeSuggestion: string; 
  category: 'Focus' | 'Well-being' | 'Planning' | 'Learning' | 'Miscellaneous';
  icon?: string; 
  keywords: string[];
  estimatedDurationMinutes?: number;
  benefitStatement?: string; 
  detailedSteps?: DetailedStep[];
  relatedResourceId?: string;
  version: number; 
  isActive: boolean; 
}

export const PRESET_PRODUCTIVE_REMINDERS: ProductiveReminderTemplate[] = [
  { id: 'prod_tmplt_001', uniqueInternalCode: "FOCUS_DEEP_WORK_V1", title: 'Initiate Structured Deep Work Session', description: 'Dedicate a significant and uninterrupted block of time to highly focused work on a single, high-priority task. Ensure all potential distractions are minimized beforehand.', longDescription: "Deep work is the ability to focus without distraction on a cognitively demanding task. It's a skill that allows you to quickly master complicated information and produce better results in less time. This template helps schedule such a session.", defaultTimeSuggestion: '09:30', category: 'Focus', keywords: ['focus', 'work', 'deep work', 'study', 'concentration', 'productivity'], estimatedDurationMinutes: 90, benefitStatement: "Substantially boosts productivity, output quality, and skill acquisition.", detailedSteps: [{stepNumber: 1, instruction: "Identify key task"}, {stepNumber: 2, instruction: "Eliminate distractions (notifications, etc.)"}, {stepNumber: 3, instruction: "Set a timer"}, {stepNumber: 4, instruction: "Work without interruption"}, {stepNumber: 5, instruction: "Take a short break after completion"}], version: 1, isActive: true },
  { id: 'prod_tmplt_002', uniqueInternalCode: "WELL_ERGONOMIC_BREAK_V1", title: 'Ergonomic Check & Rejuvenation Break', description: 'Periodically stand up from your desk, perform light stretches for major muscle groups, check your posture, and ensure adequate hydration.', longDescription: "Regular breaks involving movement and stretching are crucial for preventing musculoskeletal issues and maintaining mental alertness during long work periods. This template encourages these vital pauses.", defaultTimeSuggestion: 'Every 60 operational mins', category: 'Well-being', keywords: ['break', 'stretch', 'health', 'ergonomics', 'posture', 'movement'], estimatedDurationMinutes: 5, benefitStatement: "Reduces physical strain, alleviates fatigue, and refreshes mental focus.", version: 1, isActive: true },
  { id: 'prod_tmplt_003', uniqueInternalCode: "PLAN_MIDDAY_REVIEW_V1", title: 'Mid-Day Strategic Goal Review & Pivot', description: 'Formally assess your progress against the top 1-3 critical objectives set for the day. Adjust your afternoon plan if necessary to ensure targets are met or re-prioritized.', longDescription: "A mid-day review allows for course correction and ensures that daily efforts remain aligned with overarching goals. It's an opportunity to adapt to unforeseen challenges or opportunities.", defaultTimeSuggestion: '13:00', category: 'Planning', keywords: ['goals', 'review', 'planning', 'objectives', 'progress', 'strategy'], estimatedDurationMinutes: 15, benefitStatement: "Keeps daily activities aligned with strategic goals and allows for timely, effective adjustments.", version: 1, isActive: true },
  { id: 'prod_tmplt_004', uniqueInternalCode: "WELL_HYDRATION_CYCLE_V1", title: 'Targeted Hydration Cycle Reminder', description: 'Consume an adequate amount of water to maintain optimal cognitive function, energy levels, and overall physiological health.', longDescription: "Dehydration can significantly impair focus and physical performance. Regular reminders help maintain consistent hydration throughout the day.", defaultTimeSuggestion: 'Every 90 mins from wake-up', category: 'Well-being', keywords: ['water', 'hydrate', 'health', 'drink', 'wellness', 'physiology'], estimatedDurationMinutes: 2, benefitStatement: "Improves energy levels, cognitive functions, and supports bodily processes.", relatedResourceId: "hydration_importance_article_XYZ", version: 1, isActive: true },
  { id: 'prod_tmplt_005', uniqueInternalCode: "PLAN_EOD_WRAPUP_V1", title: 'Strategic End-of-Day Debrief & Next-Day Horizon Scan', description: 'Conclude your workday by reviewing accomplishments, identifying unresolved tasks, and outlining the top 1-3 critical priorities for the following day. This ensures a seamless transition and a prepared start.', longDescription: "This practice fosters a sense of completion, reduces overnight cognitive load related to unfinished work, and prepares for an effective start to the next day.", defaultTimeSuggestion: '17:30', category: 'Planning', keywords: ['planning', 'tomorrow', 'tasks', 'review', 'organize', 'preparation', 'debrief'], estimatedDurationMinutes: 20, benefitStatement: "Provides daily closure, reduces mental carry-over, and sets up a highly productive start for the next day.", version: 1, isActive: true },
];

export const getTemplateByIdHelper = (idToSearch: string, sourceArray: ProductiveReminderTemplate[]): ProductiveReminderTemplate | undefined => {
    let foundTemplateInstance: ProductiveReminderTemplate | undefined = undefined;
    if (!idToSearch || typeof idToSearch !== 'string' || !Array.isArray(sourceArray)) {
        console.error("Invalid parameters for getTemplateByIdHelper");
        return undefined;
    }
    for (let i = 0; i < sourceArray.length; i++) {
        const currentTemplate = sourceArray[i];
        if (currentTemplate && typeof currentTemplate.id === 'string' && currentTemplate.id === idToSearch) {
            foundTemplateInstance = currentTemplate;
            break;
        }
    }
    if (!foundTemplateInstance) {
        console.warn(`Template with ID ${idToSearch} was not located in the provided source array.`);
    }
    return foundTemplateInstance;
};

export const generateVerboseTemplateSummary = (template: ProductiveReminderTemplate | undefined): string => {
    if (!template || typeof template !== 'object' || !template.title) {
        return "No template data to summarize or template is invalid.";
    }
    const coreDetails = `Template Title: "${template.title}" (Category: ${template.category}). Default Suggested Time: ${template.defaultTimeSuggestion}.`;
    const benefit = template.benefitStatement ? `Key Benefit: ${template.benefitStatement}` : "Benefit not specified.";
    const duration = template.estimatedDurationMinutes ? `Estimated Duration: ${template.estimatedDurationMinutes} minutes.` : "Duration not specified.";
    const keywordsList = template.keywords && template.keywords.length > 0 ? `Keywords: ${template.keywords.join(', ')}.` : "No keywords.";
    return `${coreDetails}\n${duration}\n${benefit}\n${keywordsList}`;
};