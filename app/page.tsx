'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HabitTab, WaterState, ExerciseState, SleepState, MedicineState } from '@/lib/types';
import { useAppData, getTodayString } from '@/lib/storage';
import {
  checkActiveAlerts,
  ActiveAlert,
  triggerAlertEffects,
  sendBrowserNotification,
  hasNotificationPermission,
} from '@/lib/notifications';
import { sounds, triggerVibration } from '@/lib/sound';
import { Header } from '@/components/Header';
import { HomeScreen } from '@/components/HomeScreen';
import { WaterHabit } from '@/components/WaterHabit';
import { ExerciseHabit } from '@/components/ExerciseHabit';
import { SleepHabit } from '@/components/SleepHabit';
import { MedicineHabit } from '@/components/MedicineHabit';
import { AboutModal } from '@/components/AboutModal';
import { ActiveAlertBanner } from '@/components/ActiveAlertBanner';
import { AnimatePresence, motion } from 'motion/react';
import { WifiOff } from 'lucide-react';

export default function Page() {
  const [data, updateData] = useAppData();
  const [currentTab, setCurrentTab] = useState<HabitTab>('home');
  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() =>
    hasNotificationPermission()
  );
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  const alertedSetRef = useRef<Set<string>>(new Set());

  // Listen to connectivity changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Specific state updaters
  const updateWater = (updater: (prev: WaterState) => WaterState) => {
    updateData((prev) => ({ ...prev, water: updater(prev.water) }));
  };

  const updateExercise = (updater: (prev: ExerciseState) => ExerciseState) => {
    updateData((prev) => ({ ...prev, exercise: updater(prev.exercise) }));
  };

  const updateSleep = (updater: (prev: SleepState) => SleepState) => {
    updateData((prev) => ({ ...prev, sleep: updater(prev.sleep) }));
  };

  const updateMedicine = (updater: (prev: MedicineState) => MedicineState) => {
    updateData((prev) => ({ ...prev, medicine: updater(prev.medicine) }));
  };

  // Periodic alarm verification
  useEffect(() => {
    if (!data) return;

    const interval = setInterval(() => {
      const todayStr = getTodayString();
      const currentAlerts = checkActiveAlerts(data, todayStr);

      for (const alert of currentAlerts) {
        if (!alertedSetRef.current.has(alert.id)) {
          alertedSetRef.current.add(alert.id);
          setActiveAlert(alert);
          triggerAlertEffects(alert.type);
          sendBrowserNotification(alert.title, alert.message);
          break;
        }
      }
    }, 20000); // Check every 20 seconds

    return () => clearInterval(interval);
  }, [data]);

  // Quick drink 250ml
  const handleQuickDrinkWater = (amountMl: number) => {
    updateWater((prev) => ({
      ...prev,
      consumedMl: prev.consumedMl + amountMl,
    }));
  };

  // Quick toggle exercise
  const handleQuickToggleExercise = () => {
    const todayStr = getTodayString();
    updateExercise((prev) => {
      const alreadyDone = prev.lastCompletedDate === todayStr;
      if (alreadyDone) {
        return {
          ...prev,
          lastCompletedDate: null,
          streakDays: Math.max(0, prev.streakDays - 1),
          history: prev.history.filter((h) => h.date !== todayStr),
        };
      } else {
        return {
          ...prev,
          lastCompletedDate: todayStr,
          streakDays: prev.streakDays + 1,
          history: [
            ...prev.history.filter((h) => h.date !== todayStr),
            { date: todayStr, completed: true, type: prev.type },
          ],
        };
      }
    });
  };

  // Confirm active alert action
  const handleConfirmAlertAction = (alert: ActiveAlert) => {
    const todayStr = getTodayString();

    if (alert.type === 'water') {
      handleQuickDrinkWater(250);
    } else if (alert.type === 'exercise') {
      handleQuickToggleExercise();
    } else if (alert.type === 'medicine' && alert.medicineId) {
      const now = new Date();
      const currentClock = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      updateMedicine((prev) => ({
        ...prev,
        medicines: prev.medicines.map((m) => {
          if (m.id !== alert.medicineId) return m;
          return {
            ...m,
            history: [
              ...m.history.filter(
                (h) => !(h.date === todayStr && h.time === alert.time)
              ),
              { date: todayStr, time: alert.time, takenAt: currentClock },
            ],
          };
        }),
      }));
    }

    setActiveAlert(null);
  };

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center animate-spin text-sky-600">
            💧
          </div>
          <p className="text-sm font-bold text-slate-600">Carregando Hábitos Simples...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col selection:bg-sky-200">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={() => setNotificationsEnabled((prev) => !prev)}
      />

      {/* Active Floating Alert (Alarm Simulator & Trigger) */}
      <ActiveAlertBanner
        alert={activeAlert}
        onDismiss={() => setActiveAlert(null)}
        onConfirmAction={handleConfirmAlertAction}
      />

      {/* Offline Toast Indicator */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-slate-800 text-white px-3.5 py-2 text-xs font-bold shadow-lg border border-slate-700">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>Modo Offline: tudo salvo no aparelho.</span>
        </div>
      )}

      {/* Main Content Area with Smooth Page Transitions */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-4 sm:py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {currentTab === 'home' && (
              <HomeScreen
                data={data}
                onSelectTab={setCurrentTab}
                onQuickDrinkWater={handleQuickDrinkWater}
                onQuickToggleExercise={handleQuickToggleExercise}
              />
            )}

            {currentTab === 'water' && (
              <WaterHabit waterState={data.water} onUpdate={updateWater} />
            )}

            {currentTab === 'exercise' && (
              <ExerciseHabit
                exerciseState={data.exercise}
                onUpdate={updateExercise}
              />
            )}

            {currentTab === 'sleep' && (
              <SleepHabit sleepState={data.sleep} onUpdate={updateSleep} />
            )}

            {currentTab === 'medicine' && (
              <MedicineHabit
                medicineState={data.medicine}
                onUpdate={updateMedicine}
              />
            )}

            {currentTab === 'about' && (
              <AboutModal
                appData={data}
                onRestoreData={(newData) => {
                  updateData(() => newData);
                }}
                onClose={() => setCurrentTab('home')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Sticky Bottom Quick Navigation Bar (always 1 tap away) */}
      <nav className="sticky bottom-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-md">
        <div className="max-w-md mx-auto px-2 py-2 flex items-center justify-around gap-1">
          {/* Home */}
          <button
            onClick={() => setCurrentTab('home')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition cursor-pointer ${
              currentTab === 'home'
                ? 'text-sky-600 font-black bg-sky-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="text-xl">🏠</span>
            <span className="text-[11px] font-bold">Início</span>
          </button>

          {/* Water */}
          <button
            onClick={() => setCurrentTab('water')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition cursor-pointer ${
              currentTab === 'water'
                ? 'text-sky-600 font-black bg-sky-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="text-xl">💧</span>
            <span className="text-[11px] font-bold">Água</span>
          </button>

          {/* Exercise */}
          <button
            onClick={() => setCurrentTab('exercise')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition cursor-pointer ${
              currentTab === 'exercise'
                ? 'text-emerald-600 font-black bg-emerald-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="text-xl">🏃</span>
            <span className="text-[11px] font-bold">Exercício</span>
          </button>

          {/* Sleep */}
          <button
            onClick={() => setCurrentTab('sleep')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition cursor-pointer ${
              currentTab === 'sleep'
                ? 'text-indigo-600 font-black bg-indigo-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="text-xl">😴</span>
            <span className="text-[11px] font-bold">Sono</span>
          </button>

          {/* Medicine */}
          <button
            onClick={() => setCurrentTab('medicine')}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition cursor-pointer ${
              currentTab === 'medicine'
                ? 'text-amber-600 font-black bg-amber-50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="text-xl">💊</span>
            <span className="text-[11px] font-bold">Remédios</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
