export interface Meditation {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  category: 'Sonno' | 'Stress' | 'Focus' | 'Principianti';
  audioFile: any;
}

export const MEDITATIONS_DATA: Meditation[] = [
  {
    id: 'med101',
    title: 'Respiro Consapevole',
    description: 'Una breve meditazione per principianti per concentrarsi sul respiro e ritrovare la calma interiore.',
    durationMinutes: 5,
    category: 'Principianti',
    audioFile: require('../../assets/audio/respiro_consapevole_5min.mp3'),
  },
  {
    id: 'med102',
    title: 'Rilassamento Profondo Anti-Stress',
    description: 'Lascia andare le tensioni accumulate durante la giornata e immergiti in uno stato di profondo rilassamento.',
    durationMinutes: 10,
    category: 'Stress',
    audioFile: require('../../assets/audio/rilassamento_profondo_10min.mp3'),
  },
  {
    id: 'med103',
    title: 'Focus Mattutino Energizzante',
    description: 'Inizia la giornata con mente lucida, energia positiva e una maggiore capacità di concentrazione.',
    durationMinutes: 7,
    category: 'Focus',
    audioFile: require('../../assets/audio/focus_mattutino_7min.mp3'),
  },
  {
    id: 'med104',
    title: 'Meditazione per Dormire Sereni',
    description: 'Accompagnati dolcemente verso un sonno ristoratore e tranquillo, lasciando alle spalle le preoccupazioni.',
    durationMinutes: 15,
    category: 'Sonno',
    audioFile: require('../../assets/audio/meditazione_sonno_15min.mp3'),
  },
];