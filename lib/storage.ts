import { useSyncExternalStore } from 'react';
import { AppData, WaterState, ExerciseState, SleepState, MedicineState } from './types';

const STORAGE_KEY = 'habitos_simples_v1';

export function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}`;
}

export function getDayNameBR(dayIndex: number): string {
  const names = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  return names[dayIndex] || '';
}

export function calculateStreak(
  history: { date: string; completed: boolean }[],
  todayStr: string
): number {
  const completedSet = new Set(
    history.filter((h) => h.completed).map((h) => h.date)
  );

  const parts = todayStr.split('-').map(Number);
  const checkDate = new Date(parts[0], parts[1] - 1, parts[2]);
  let streak = 0;

  // If today is completed, count starting from today. If not, start from yesterday
  if (!completedSet.has(todayStr)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, '0');
    const d = String(checkDate.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;

    if (completedSet.has(dateKey)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export const defaultInitialData: AppData = {
  water: {
    weightKg: 70,
    dailyGoalMl: 2450, // 70 * 35 ml
    consumedMl: 0,
    reminderTimes: ['08:00', '10:30', '13:00', '15:30', '18:00', '20:30'],
    soundEnabled: true,
    vibrationEnabled: true,
    lastUpdatedDate: getTodayString(),
    history: [],
  },
  exercise: {
    type: 'caminhada',
    customTypeName: '',
    selectedDays: [1, 2, 3, 4, 5], // Seg a Sex
    reminderTime: '17:30',
    durationMinutes: 30,
    streakDays: 0,
    lastCompletedDate: null,
    soundEnabled: true,
    history: [],
  },
  sleep: {
    targetBedTime: '22:30',
    targetWakeTime: '06:30',
    windDownNoticeMinutes: 30,
    soundEnabled: true,
    history: [],
  },
  medicine: {
    medicines: [
      {
        id: 'med-1',
        name: 'Vitamina D / Cálcio',
        dosage: '1 comprimido',
        times: ['08:00'],
        frequency: 'daily',
        notes: 'Tomar junto ao café da manhã com água',
        color: '#0284c7',
        history: [],
      },
      {
        id: 'med-2',
        name: 'Pressão / Protetor',
        dosage: '1 dose',
        times: ['20:00'],
        frequency: 'daily',
        notes: 'Não deitar imediatamente após tomar',
        color: '#7c3aed',
        history: [],
      },
    ],
    soundEnabled: true,
  },
  settings: {
    userName: '',
    notificationsAllowed: false,
    theme: 'light',
  },
};

let cachedData: AppData = defaultInitialData;
let isLoaded = false;
let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeAppData(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function loadAppData(): AppData {
  if (typeof window === 'undefined') {
    return defaultInitialData;
  }

  if (isLoaded) {
    return cachedData;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedData = defaultInitialData;
      isLoaded = true;
      saveAppData(defaultInitialData);
      return cachedData;
    }

    const data: AppData = JSON.parse(raw);
    const today = getTodayString();

    // Clean mock history if present
    const mockDates = new Set(['2026-10-09', '2026-10-10', '2026-10-11']);
    let hadMocks = false;

    if (data.exercise?.history && data.exercise.history.some((h) => mockDates.has(h.date))) {
      data.exercise.history = data.exercise.history.filter((h) => !mockDates.has(h.date));
      data.exercise.streakDays = calculateStreak(data.exercise.history, today);
      if (data.exercise.lastCompletedDate && mockDates.has(data.exercise.lastCompletedDate)) {
        data.exercise.lastCompletedDate = null;
      }
      hadMocks = true;
    }

    if (data.sleep?.history && data.sleep.history.some((h) => mockDates.has(h.date))) {
      data.sleep.history = data.sleep.history.filter((h) => !mockDates.has(h.date));
      hadMocks = true;
    }

    if (data.medicine?.medicines) {
      data.medicine.medicines.forEach((med) => {
        if (med.history && med.history.some((h) => mockDates.has(h.date))) {
          med.history = med.history.filter((h) => !mockDates.has(h.date));
          hadMocks = true;
        }
      });
    }

    if (!data.settings) {
      data.settings = { notificationsAllowed: false, theme: 'light' };
      hadMocks = true;
    } else if (!data.settings.theme) {
      data.settings.theme = 'light';
      hadMocks = true;
    }

    if (hadMocks) {
      saveAppData(data);
    }

    // Check if new day for Water
    if (data.water.lastUpdatedDate !== today) {
      if (data.water.consumedMl > 0) {
        data.water.history = [
          ...(data.water.history || []).slice(-13),
          {
            date: data.water.lastUpdatedDate,
            amountMl: data.water.consumedMl,
            goalMl: data.water.dailyGoalMl,
          },
        ];
      }
      data.water.consumedMl = 0;
      data.water.lastUpdatedDate = today;
      saveAppData(data);
    }

    cachedData = data;
    isLoaded = true;
    return cachedData;
  } catch (err) {
    console.error('Failed to parse saved data:', err);
    cachedData = defaultInitialData;
    isLoaded = true;
    return cachedData;
  }
}

export function saveAppData(data: AppData): void {
  cachedData = data;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Failed to save data:', err);
    }
  }
  emitChange();
}

export function useAppData(): [AppData, (updater: (prev: AppData) => AppData) => void] {
  const data = useSyncExternalStore(
    subscribeAppData,
    () => loadAppData(),
    () => defaultInitialData
  );

  const update = (updater: (prev: AppData) => AppData) => {
    const next = updater(cachedData);
    saveAppData(next);
  };

  return [data, update];
}

export function exportDataAsJSON(data: AppData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `habitos-simples-backup-${getTodayString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function resetAllData(): AppData {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY);
  }
  cachedData = defaultInitialData;
  saveAppData(defaultInitialData);
  return defaultInitialData;
}
