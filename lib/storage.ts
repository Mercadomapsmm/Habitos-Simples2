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

export const defaultInitialData: AppData = {
  water: {
    weightKg: 70,
    dailyGoalMl: 2450, // 70 * 35 ml
    consumedMl: 1000,
    reminderTimes: ['08:00', '10:30', '13:00', '15:30', '18:00', '20:30'],
    soundEnabled: true,
    vibrationEnabled: true,
    lastUpdatedDate: getTodayString(),
    history: [
      { date: '2026-10-09', amountMl: 2200, goalMl: 2450 },
      { date: '2026-10-10', amountMl: 2500, goalMl: 2450 },
      { date: '2026-10-11', amountMl: 2450, goalMl: 2450 },
    ],
  },
  exercise: {
    type: 'caminhada',
    customTypeName: '',
    selectedDays: [1, 2, 3, 4, 5], // Seg a Sex
    reminderTime: '17:30',
    durationMinutes: 30,
    streakDays: 3,
    lastCompletedDate: '2026-10-11',
    soundEnabled: true,
    history: [
      { date: '2026-10-09', completed: true, type: 'caminhada' },
      { date: '2026-10-10', completed: true, type: 'caminhada' },
      { date: '2026-10-11', completed: true, type: 'caminhada' },
    ],
  },
  sleep: {
    targetBedTime: '22:30',
    targetWakeTime: '06:30',
    windDownNoticeMinutes: 30,
    soundEnabled: true,
    history: [
      { date: '2026-10-09', sleepTime: '22:40', wakeTime: '06:30', rating: 'bom', note: 'Dormi rápido' },
      { date: '2026-10-10', sleepTime: '23:00', wakeTime: '07:00', rating: 'otimo', note: 'Noite tranquila' },
      { date: '2026-10-11', sleepTime: '22:30', wakeTime: '06:20', rating: 'bom', note: 'Descansei bem' },
    ],
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
        history: [
          { date: '2026-10-10', time: '08:00', takenAt: '08:05' },
          { date: '2026-10-11', time: '08:00', takenAt: '08:00' },
        ],
      },
      {
        id: 'med-2',
        name: 'Pressão / Protetor',
        dosage: '1 dose',
        times: ['20:00'],
        frequency: 'daily',
        notes: 'Não deitar imediatamente após tomar',
        color: '#7c3aed',
        history: [
          { date: '2026-10-10', time: '20:00', takenAt: '20:10' },
          { date: '2026-10-11', time: '20:00', takenAt: '20:02' },
        ],
      },
    ],
    soundEnabled: true,
  },
  settings: {
    userName: '',
    notificationsAllowed: false,
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
