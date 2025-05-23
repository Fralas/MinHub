export type Milestone = {
  id: string;
  title: string;
  description: string;
  condition: (score: number, streak: number) => boolean;
};

export const MILESTONES: Milestone[] = [
  {
    id: 'first-correct',
    title: 'Getting Started',
    description: 'Answer your first question correctly.',
    condition: (score, streak) => score >= 1,
  },
  {
    id: 'streak-5',
    title: 'On a Roll',
    description: 'Reach a 5-answer streak.',
    condition: (score, streak) => streak >= 5,
  },
  {
    id: 'streak-10',
    title: 'Unstoppable',
    description: 'Reach a 10-answer streak.',
    condition: (score, streak) => streak >= 10,
  },
  {
    id: 'score-20',
    title: 'Ears of Steel',
    description: 'Reach a high score of 20.',
    condition: (score, streak) => score >= 20,
  },
];
