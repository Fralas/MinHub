export interface Meditation {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  category: 'Sleep' | 'Stress' | 'Focus' | 'Beginners';
  audioFile: any;
}

export const MEDITATIONS_DATA: Meditation[] = [
  {
    id: 'med101',
    title: 'Mindful Breathing',
    description: 'A short meditation for beginners to focus on breathing and find inner calm.',
    durationMinutes: 5,
    category: 'Beginners',
    audioFile: require('../../../assets/audio/meditationAUDIO/a.mp3'),
  },
  {
    id: 'med102',
    title: 'Deep Relaxation Anti-Stress',
    description: 'Release the tensions accumulated during the day and immerse yourself in a state of deep relaxation.',
    durationMinutes: 10,
    category: 'Stress',
    audioFile: require('../../../assets/audio/meditationAUDIO/b.mp3'),
  },
  {
    id: 'med103',
    title: 'Energizing Morning Focus',
    description: 'Start your day with a clear mind, positive energy, and improved concentration.',
    durationMinutes: 8,
    category: 'Focus',
    audioFile: require('../../../assets/audio/meditationAUDIO/c.mp3'),
  },
  {
    id: 'med104',
    title: 'Meditation for Peaceful Sleep',
    description: 'Gently guide yourself toward restorative and tranquil sleep, leaving worries behind.',
    durationMinutes: 16,
    category: 'Sleep',
    audioFile: require('../../../assets/audio/meditationAUDIO/d.mp3'),
  },
];