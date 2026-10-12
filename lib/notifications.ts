import { AppData, Medicine } from './types';
import { sounds, triggerVibration } from './sound';

export interface ActiveAlert {
  id: string;
  type: 'water' | 'exercise' | 'sleep' | 'medicine';
  title: string;
  message: string;
  medicineId?: string;
  time: string;
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  try {
    const res = await Notification.requestPermission();
    return res === 'granted';
  } catch {
    return false;
  }
}

export function hasNotificationPermission(): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  return Notification.permission === 'granted';
}

export function sendBrowserNotification(title: string, body: string, icon = '/icon.svg') {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body,
        icon,
        badge: '/icon.svg',
      });
    } catch {
      // ignore
    }
  }
}

// Convert "HH:mm" to minutes from 00:00
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

// Format minutes from 00:00 to "HH:mm"
export function minutesToTime(totalMinutes: number): string {
  let mins = totalMinutes % (24 * 60);
  if (mins < 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

// Checks which habit alerts are due right now
export function checkActiveAlerts(data: AppData, todayStr: string): ActiveAlert[] {
  const alerts: ActiveAlert[] = [];
  const now = new Date();
  const currentHour = String(now.getHours()).padStart(2, '0');
  const currentMinute = String(now.getMinutes()).padStart(2, '0');
  const currentTime = `${currentHour}:${currentMinute}`;
  const currentDayOfWeek = now.getDay(); // 0 to 6

  // 1. Water
  if (data.water.reminderTimes.includes(currentTime) && data.water.consumedMl < data.water.dailyGoalMl) {
    alerts.push({
      id: `water-${currentTime}`,
      type: 'water',
      title: '💧 Hora de beber água!',
      message: 'Mantenha seu corpo hidratado. Beba um copo de água agora.',
      time: currentTime,
    });
  }

  // 2. Exercise
  if (
    data.exercise.selectedDays.includes(currentDayOfWeek) &&
    data.exercise.reminderTime === currentTime &&
    data.exercise.lastCompletedDate !== todayStr
  ) {
    const typeLabel = data.exercise.type === 'outro' && data.exercise.customTypeName 
      ? data.exercise.customTypeName 
      : data.exercise.type;
    alerts.push({
      id: `exercise-${currentTime}`,
      type: 'exercise',
      title: '🏃 Hora de se mexer!',
      message: `Momento do seu exercício (${typeLabel}). Vai fazer muito bem! 💪`,
      time: currentTime,
    });
  }

  // 3. Sleep wind-down (30 min before target bedtime)
  const bedMinutes = timeToMinutes(data.sleep.targetBedTime);
  const windDownMinutes = bedMinutes - data.sleep.windDownNoticeMinutes;
  const windDownTime = minutesToTime(windDownMinutes);
  if (currentTime === windDownTime) {
    alerts.push({
      id: `sleep-${currentTime}`,
      type: 'sleep',
      title: '🌙 Hora de desacelerar',
      message: 'Faltam 30 minutos para dormir. Desligue telas e relaxe sua mente.',
      time: currentTime,
    });
  }

  // 4. Medicine check
  data.medicine.medicines.forEach((med: Medicine) => {
    med.times.forEach((t) => {
      // Check if matches current time
      if (t === currentTime) {
        // Check if already taken today at this time
        const alreadyTaken = med.history.some(
          (h) => h.date === todayStr && h.time === t
        );
        if (!alreadyTaken) {
          alerts.push({
            id: `med-${med.id}-${t}`,
            type: 'medicine',
            title: `💊 Hora do remédio: ${med.name}`,
            message: `Dosagem: ${med.dosage}. ${med.notes ? `(${med.notes})` : ''}`,
            medicineId: med.id,
            time: t,
          });
        }
      }
    });
  });

  return alerts;
}

// Trigger alert sound & vibration
export function triggerAlertEffects(type: 'water' | 'exercise' | 'sleep' | 'medicine') {
  if (type === 'water') {
    sounds.playWaterDrop();
    triggerVibration([100, 80, 100]);
  } else if (type === 'exercise') {
    sounds.playExerciseChime();
    triggerVibration([150, 60, 150]);
  } else if (type === 'sleep') {
    sounds.playSleepBowl();
    triggerVibration([200, 100, 200]);
  } else if (type === 'medicine') {
    sounds.playMedicineAlert();
    triggerVibration([300, 100, 300, 100, 300]);
  }
}
