export type HabitTab = 'home' | 'water' | 'exercise' | 'sleep' | 'medicine' | 'about';

export interface WaterState {
  weightKg: number;
  dailyGoalMl: number;
  consumedMl: number;
  reminderTimes: string[]; // ['08:00', '10:00', '12:00', ...]
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  lastUpdatedDate: string; // 'YYYY-MM-DD'
  history: { date: string; amountMl: number; goalMl: number }[];
}

export type ExerciseType = 'caminhada' | 'alongamento' | 'academia' | 'corrida' | 'ciclismo' | 'outro';

export interface ExerciseActivity {
  id: string;
  name: string;
  type: ExerciseType;
  icon: string;
  selectedDays: number[]; // 0 = Domingo, 1 = Segunda, ... 6 = Sábado
  reminderTime: string; // '07:30'
  durationMinutes: number;
  enabled: boolean;
}

export interface ExerciseState {
  type: ExerciseType;
  customTypeName?: string;
  selectedDays: number[]; // 0 = Domingo, 1 = Segunda, ... 6 = Sábado
  reminderTime: string; // '18:00'
  durationMinutes: number;
  streakDays: number;
  lastCompletedDate: string | null; // 'YYYY-MM-DD'
  history: {
    date: string;
    completed: boolean;
    type: string;
    activityId?: string;
    emoji?: string;
  }[];
  soundEnabled: boolean;
  activities: ExerciseActivity[];
}

export type SleepRating = 'otimo' | 'bom' | 'regular' | 'ruim';

export interface SleepEntry {
  date: string; // 'YYYY-MM-DD'
  sleepTime: string; // '22:30'
  wakeTime: string; // '06:30'
  rating?: SleepRating;
  emoji?: string;
  note?: string;
}

export interface SleepState {
  targetBedTime: string; // '22:30'
  targetWakeTime: string; // '06:30'
  windDownNoticeMinutes: number; // 30 min
  soundEnabled: boolean;
  history: SleepEntry[];
}

export type MedicineFrequency = 'daily' | 'interval' | 'specific_days';

export interface Medicine {
  id: string;
  name: string;
  dosage: string; // ex: '50mg' ou '1 comprimido'
  times: string[]; // ex: ['08:00', '20:00']
  frequency: MedicineFrequency;
  intervalHours?: number; // ex: 8 (a cada 8 horas)
  specificDays?: number[]; // [1, 3, 5] (seg, qua, sex)
  notes: string; // ex: 'Tomar com almoço'
  color: string; // hex
  history: { date: string; time: string; takenAt: string }[];
}

export interface MedicineState {
  medicines: Medicine[];
  soundEnabled: boolean;
}

export interface AppSettings {
  userName?: string;
  notificationsAllowed: boolean;
  theme?: 'light' | 'dark';
  dailyEmojis?: Record<string, string>; // date (YYYY-MM-DD) -> emoji
}

export interface AppData {
  water: WaterState;
  exercise: ExerciseState;
  sleep: SleepState;
  medicine: MedicineState;
  settings: AppSettings;
  dailyEmojis?: Record<string, string>;
}
