'use client';

import React, { useState } from 'react';
import { SleepState, SleepRating } from '@/lib/types';
import { getTodayString, getDayNameBR, formatDateBR } from '@/lib/storage';
import { timeToMinutes, minutesToTime } from '@/lib/notifications';
import { sounds, triggerVibration } from '@/lib/sound';
import {
  Moon,
  Sun,
  Clock,
  Sparkles,
  Lightbulb,
  Edit2,
  Save,
} from 'lucide-react';

interface SleepHabitProps {
  sleepState: SleepState;
  onUpdate: (updater: (prev: SleepState) => SleepState) => void;
}

export const variedSleepEmojis: { emoji: string; label: string; rating?: SleepRating }[] = [
  { emoji: '🤩', label: 'Excelente', rating: 'otimo' },
  { emoji: '😊', label: 'Dormi Bem', rating: 'bom' },
  { emoji: '😴', label: 'Sono Profundo', rating: 'bom' },
  { emoji: '🥱', label: 'Cansado', rating: 'regular' },
  { emoji: '😐', label: 'Mais ou menos', rating: 'regular' },
  { emoji: '😫', label: 'Dormi Mal', rating: 'ruim' },
  { emoji: '🌙', label: 'Madruguei', rating: 'regular' },
  { emoji: '🛌', label: 'Relaxei', rating: 'bom' },
  { emoji: '💤', label: 'Soneca', rating: 'bom' },
  { emoji: '🔋', label: '100% Recarregado', rating: 'otimo' },
  { emoji: '🦄', label: 'Bons Sonhos', rating: 'otimo' },
  { emoji: '☕', label: 'Café urgente', rating: 'ruim' },
];

const sleepTips = [
  'Desligue telas 20 min antes de dormir: a luz azul engana o cérebro e bloqueia o sono natural.',
  'Mantenha o quarto fresco e bem escuro: a temperatura mais amena induz o sono profundo.',
  'Evite cafeína, café ou refrigerantes escuros após as 16h.',
  'Crie um ritual calmo: um banho morno, uma leitura suave ou respirações lentas preparam a mente.',
];

export function SleepHabit({ sleepState, onUpdate }: SleepHabitProps) {
  const todayStr = getTodayString();
  const [tipIndex, setTipIndex] = useState(0);
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [bedTime, setBedTime] = useState(sleepState.targetBedTime);
  const [wakeTime, setWakeTime] = useState(sleepState.targetWakeTime);
  const [selectedSleepDayForEmoji, setSelectedSleepDayForEmoji] = useState<string | null>(null);

  // Today's rating if already logged
  const todayEntry = sleepState.history.find((h) => h.date === todayStr);

  // Calculate planned sleep duration
  const bedMinutes = timeToMinutes(sleepState.targetBedTime);
  const wakeMinutes = timeToMinutes(sleepState.targetWakeTime);
  let totalMinutes = wakeMinutes - bedMinutes;
  if (totalMinutes < 0) totalMinutes += 24 * 60;
  const hoursPlanned = (totalMinutes / 60).toFixed(1);

  // Calculate 30-min wind-down time
  const windDownMinutes = bedMinutes - sleepState.windDownNoticeMinutes;
  const windDownTime = minutesToTime(windDownMinutes);

  // Rate sleep today
  const handleRateSleep = (rating: SleepRating) => {
    onUpdate((prev) => {
      const existing = prev.history.filter((h) => h.date !== todayStr);
      return {
        ...prev,
        history: [
          ...existing,
          {
            date: todayStr,
            sleepTime: prev.targetBedTime,
            wakeTime: prev.targetWakeTime,
            rating,
          },
        ],
      };
    });

    sounds.playSleepBowl();
    triggerVibration([120, 80, 120]);
  };

  // Save target times
  const handleSaveSchedule = () => {
    onUpdate((prev) => ({
      ...prev,
      targetBedTime: bedTime,
      targetWakeTime: wakeTime,
    }));
    setIsEditingSchedule(false);
  };

  // Test wind-down bowl sound
  const handleTestBowl = () => {
    sounds.playSleepBowl();
  };

  // Next tip
  const handleNextTip = () => {
    setTipIndex((prev) => (prev + 1) % sleepTips.length);
  };

  // Set specific varied emoji for any chosen day in Sleep
  // CRITICAL: Marcar os dias SOMENTE quando clicar e não acionar outra função
  const handleSetSleepDayEmoji = (
    targetDate: string,
    chosenEmoji: string,
    rating?: SleepRating,
    e?: React.MouseEvent
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    onUpdate((prev) => {
      const existing = prev.history.find((h) => h.date === targetDate);
      const newRating = rating || existing?.rating || 'bom';
      let newHistory;
      if (existing) {
        newHistory = prev.history.map((h) =>
          h.date === targetDate
            ? { ...h, rating: newRating, emoji: chosenEmoji }
            : h
        );
      } else {
        newHistory = [
          ...prev.history.filter((h) => h.date !== targetDate),
          {
            date: targetDate,
            sleepTime: prev.targetBedTime,
            wakeTime: prev.targetWakeTime,
            rating: newRating,
            emoji: chosenEmoji,
          },
        ];
      }
      return {
        ...prev,
        history: newHistory,
      };
    });

    sounds.playSleepBowl();
    triggerVibration([100, 50]);
  };

  // Remove sleep entry for a day
  const handleRemoveSleepDay = (targetDate: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    onUpdate((prev) => ({
      ...prev,
      history: prev.history.filter((h) => h.date !== targetDate),
    }));

    setSelectedSleepDayForEmoji(null);
  };

  // Toggle specific date in the 7-day sleep history track with varied emojis
  // CRITICAL: Marcar os dias SOMENTE quando clicar e não acionar outra função
  const handleToggleSpecificSleepDay = (targetDate: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const existing = sleepState.history.find((h) => h.date === targetDate);
    if (!existing) {
      // Mark immediately with default emoji and open palette
      handleSetSleepDayEmoji(targetDate, '😊', 'bom');
      setSelectedSleepDayForEmoji(targetDate);
    } else {
      // Toggle emoji selector for this day
      setSelectedSleepDayForEmoji((curr) => (curr === targetDate ? null : targetDate));
    }
  };

  // 7-day sleep history with varied emoji support
  const getRecent7Days = () => {
    const list = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = getDayNameBR(d.getDay());
      const entry = sleepState.history.find((h) => h.date === dateStr);
      const ratingEmoji =
        entry?.rating === 'otimo'
          ? '🤩'
          : entry?.rating === 'bom'
          ? '😊'
          : entry?.rating === 'regular'
          ? '😐'
          : entry?.rating === 'ruim'
          ? '🥱'
          : undefined;
      list.push({
        dateStr,
        dayName,
        rating: entry?.rating,
        emoji: entry?.emoji || ratingEmoji,
        isToday: dateStr === todayStr,
      });
    }
    return list;
  };

  const recent7 = getRecent7Days();

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-xl mx-auto">
      {/* Featured Science Sleep Tip */}
      <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 shadow-2xs flex items-start gap-3 transition-colors">
        <div className="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center shrink-0 text-indigo-600 dark:text-indigo-300 mt-0.5">
          <Lightbulb className="w-5 h-5 text-indigo-600 dark:text-indigo-300" />
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-0.5">
            Dica para dormir bem
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug">
            {sleepTips[tipIndex]}
          </p>
          <button
            type="button"
            onClick={handleNextTip}
            className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            Ver outra dica →
          </button>
        </div>
      </div>

      {/* Target Schedule Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-indigo-100 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 fill-indigo-200 dark:fill-indigo-950" />
            Seu Horário Planejado
          </h3>
          <button
            type="button"
            onClick={() => setIsEditingSchedule(!isEditingSchedule)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Ajustar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-300 mb-1">
              <Moon className="w-3.5 h-3.5" />
              Hora de Dormir
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {sleepState.targetBedTime}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">
              <Sun className="w-3.5 h-3.5" />
              Hora de Acordar
            </div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {sleepState.targetWakeTime}
            </div>
          </div>
        </div>

        {/* Planned hours */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400 px-1">
          <span>Tempo de descanso estimado:</span>
          <span className="font-extrabold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
            ~{hoursPlanned} horas por noite
          </span>
        </div>

        {/* Edit inputs */}
        {isEditingSchedule && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dormir às:
                </label>
                <input
                  type="time"
                  value={bedTime}
                  onChange={(e) => setBedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Acordar às:
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveSchedule}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Save className="w-4 h-4" />
                Salvar Horários
              </button>
              <button
                type="button"
                onClick={() => setIsEditingSchedule(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Wind-Down Alert Card */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-3xl shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌙</span>
            <div>
              <h3 className="text-base font-black">
                Aviso: Hora de Desacelerar
              </h3>
              <p className="text-xs text-indigo-200">
                Toca 30 min antes de dormir: às <span className="font-bold text-amber-300">{windDownTime}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestBowl}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition cursor-pointer"
            title="Ouvir som relaxante"
          >
            Ouvir som 🔔
          </button>
        </div>

        <div className="p-3 bg-white/10 rounded-2xl border border-white/10 space-y-1 text-xs text-indigo-100">
          <div className="font-bold text-white mb-1">Checklist de 3 passos ao ouvir o aviso:</div>
          <div className="flex items-center gap-1.5">
            <span>📵</span> 1. Afaste celulares e desligue a TV
          </div>
          <div className="flex items-center gap-1.5">
            <span>💡</span> 2. Deixe apenas luzes fracas e quentes
          </div>
          <div className="flex items-center gap-1.5">
            <span>🫖</span> 3. Beba um gole d&apos;água e relaxe o corpo
          </div>
        </div>
      </div>

      {/* Fast Morning Check: "Como você dormiu hoje?" */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Registro rápido: Ao acordar, como você dormiu?
        </h3>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Dormi bem */}
          <button
            type="button"
            onClick={() => handleRateSleep('otimo')}
            className={`p-3.5 rounded-2xl border-2 text-center transition active:scale-95 cursor-pointer ${
              todayEntry?.rating === 'otimo' || todayEntry?.rating === 'bom'
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
            }`}
          >
            <div className="text-2xl mb-1">😊</div>
            <div className="text-xs sm:text-sm font-black">Dormi bem</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Descansado</div>
          </button>

          {/* Regular */}
          <button
            type="button"
            onClick={() => handleRateSleep('regular')}
            className={`p-3.5 rounded-2xl border-2 text-center transition active:scale-95 cursor-pointer ${
              todayEntry?.rating === 'regular'
                ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
            }`}
          >
            <div className="text-2xl mb-1">😐</div>
            <div className="text-xs sm:text-sm font-black">Regular</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Mais ou menos</div>
          </button>

          {/* Dormi mal */}
          <button
            type="button"
            onClick={() => handleRateSleep('ruim')}
            className={`p-3.5 rounded-2xl border-2 text-center transition active:scale-95 cursor-pointer ${
              todayEntry?.rating === 'ruim'
                ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-900 dark:text-rose-300 shadow-xs'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
            }`}
          >
            <div className="text-2xl mb-1">🥱</div>
            <div className="text-xs sm:text-sm font-black">Dormi mal</div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">Cansado</div>
          </button>
        </div>

        {todayEntry?.rating && (
          <p className="text-center text-xs font-bold text-indigo-700 dark:text-indigo-400 pt-1">
            ✅ Registrado com sucesso para hoje!
          </p>
        )}
      </div>

      {/* 7-Day Visual Graph with Varied Emojis */}
      {/* CRITICAL: Marcar os dias SOMENTE quando clicar e não acionar outra função */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-black text-indigo-900 dark:text-indigo-400 tracking-wide flex items-center gap-1.5 uppercase">
            <Clock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Últimos 7 dias (Emojis Variados de Sono):
          </h4>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            Toque para escolher o emoji
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {recent7.map((item) => {
            const isCompleted = !!item.emoji || !!item.rating;
            const isSelected = selectedSleepDayForEmoji === item.dateStr;

            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={(e) => handleToggleSpecificSleepDay(item.dateStr, e)}
                className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-between min-h-[86px] select-none ${
                  isSelected
                    ? 'ring-2 ring-indigo-500 border-2 border-indigo-500 bg-indigo-50 dark:bg-indigo-950/70 shadow-sm'
                    : isCompleted
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 shadow-2xs'
                    : 'bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                } ${item.isToday && !isSelected ? 'border-dashed border-indigo-400' : ''}`}
                title={`Clique para escolher o emoji de sono de ${item.dayName} (${item.dateStr})`}
              >
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  {item.dayName}
                </span>

                <div className="my-1.5">
                  {isCompleted ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center text-lg sm:text-xl shadow-2xs select-none">
                      {item.emoji || '😊'}
                    </div>
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 mx-auto rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center text-xs text-slate-400">
                      +
                    </div>
                  )}
                </div>

                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {item.isToday ? 'Hoje' : item.dateStr.slice(8, 10)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Varied Sleep Emoji Selector for Selected Day */}
        {selectedSleepDayForEmoji && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-slate-800/80 border border-indigo-200 dark:border-indigo-800 space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>🌙</span> Marcar emoji de sono para {formatDateBR(selectedSleepDayForEmoji)}:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleRemoveSleepDay(selectedSleepDayForEmoji, e)}
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Desmarcar dia
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedSleepDayForEmoji(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold px-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Palette of Varied Sleep Emojis */}
            <div className="grid grid-cols-6 sm:grid-cols-6 gap-2">
              {variedSleepEmojis.map((item) => {
                const currentEntry = sleepState.history.find((h) => h.date === selectedSleepDayForEmoji);
                const isCurrent = currentEntry?.emoji === item.emoji;
                return (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={(e) => handleSetSleepDayEmoji(selectedSleepDayForEmoji, item.emoji, item.rating, e)}
                    className={`p-2 rounded-xl transition active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400 scale-105'
                        : 'bg-white dark:bg-slate-700/80 hover:bg-indigo-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200'
                    }`}
                    title={item.label}
                  >
                    <span className="text-xl sm:text-2xl">{item.emoji}</span>
                    <span className="text-[10px] font-bold leading-tight truncate w-full text-center">
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Toque no emoji que melhor descreve a sua noite de sono para este dia!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
