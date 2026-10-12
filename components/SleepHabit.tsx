'use client';

import React, { useState } from 'react';
import { SleepState, SleepRating } from '@/lib/types';
import { getTodayString, getDayNameBR } from '@/lib/storage';
import { timeToMinutes, minutesToTime } from '@/lib/notifications';
import { sounds, triggerVibration } from '@/lib/sound';
import {
  Moon,
  Sun,
  Clock,
  Sparkles,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
  BellRing,
  Lightbulb,
  Edit2,
  Save,
} from 'lucide-react';

interface SleepHabitProps {
  sleepState: SleepState;
  onUpdate: (updater: (prev: SleepState) => SleepState) => void;
}

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

  // 7-day sleep history
  const getRecent7Days = () => {
    const list = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = getDayNameBR(d.getDay());
      const entry = sleepState.history.find((h) => h.date === dateStr);
      list.push({
        dateStr,
        dayName,
        rating: entry?.rating,
        isToday: dateStr === todayStr,
      });
    }
    return list;
  };

  const recent7 = getRecent7Days();

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-xl mx-auto">
      {/* Featured Science Sleep Tip */}
      <div className="p-4 rounded-3xl bg-indigo-50 border border-indigo-200 text-indigo-900 shadow-2xs flex items-start gap-3">
        <div className="w-9 h-9 rounded-2xl bg-indigo-100 flex items-center justify-center shrink-0 text-indigo-600 mt-0.5">
          <Lightbulb className="w-5 h-5 text-indigo-600" />
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-black uppercase tracking-wider text-indigo-600 mb-0.5">
            Dica para dormir bem
          </div>
          <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
            {sleepTips[tipIndex]}
          </p>
          <button
            onClick={handleNextTip}
            className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
          >
            Ver outra dica →
          </button>
        </div>
      </div>

      {/* Target Schedule Card */}
      <div className="bg-white p-5 rounded-3xl border-2 border-indigo-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Moon className="w-4 h-4 text-indigo-600 fill-indigo-200" />
            Seu Horário Planejado
          </h3>
          <button
            onClick={() => setIsEditingSchedule(!isEditingSchedule)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Ajustar
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 mb-1">
              <Moon className="w-3.5 h-3.5" />
              Hora de Dormir
            </div>
            <div className="text-2xl font-black text-slate-900">
              {sleepState.targetBedTime}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-100">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 mb-1">
              <Sun className="w-3.5 h-3.5" />
              Hora de Acordar
            </div>
            <div className="text-2xl font-black text-slate-900">
              {sleepState.targetWakeTime}
            </div>
          </div>
        </div>

        {/* Planned hours */}
        <div className="flex items-center justify-between text-xs font-semibold text-slate-600 px-1">
          <span>Tempo de descanso estimado:</span>
          <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
            ~{hoursPlanned} horas por noite
          </span>
        </div>

        {/* Edit inputs */}
        {isEditingSchedule && (
          <div className="pt-3 border-t border-slate-100 space-y-3 animate-fade-in">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dormir às:
                </label>
                <input
                  type="time"
                  value={bedTime}
                  onChange={(e) => setBedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Acordar às:
                </label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={(e) => setWakeTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveSchedule}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Salvar Horários
              </button>
              <button
                onClick={() => setIsEditingSchedule(false)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
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
      <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-xs space-y-3">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Registro rápido: Ao acordar, como você dormiu?
        </h3>

        <div className="grid grid-cols-3 gap-2.5">
          {/* Dormi bem */}
          <button
            onClick={() => handleRateSleep('otimo')}
            className={`p-3.5 rounded-2xl border-2 text-center transition active:scale-95 cursor-pointer ${
              todayEntry?.rating === 'otimo' || todayEntry?.rating === 'bom'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="text-2xl mb-1">😊</div>
            <div className="text-xs sm:text-sm font-black">Dormi bem</div>
            <div className="text-[10px] text-slate-500">Descansado</div>
          </button>

          {/* Regular */}
          <button
            onClick={() => handleRateSleep('regular')}
            className={`p-3.5 rounded-2xl border-2 text-center transition active:scale-95 cursor-pointer ${
              todayEntry?.rating === 'regular'
                ? 'border-amber-500 bg-amber-50 text-amber-900 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="text-2xl mb-1">😐</div>
            <div className="text-xs sm:text-sm font-black">Regular</div>
            <div className="text-[10px] text-slate-500">Mais ou menos</div>
          </button>

          {/* Dormi mal */}
          <button
            onClick={() => handleRateSleep('ruim')}
            className={`p-3.5 rounded-2xl border-2 text-center transition active:scale-95 cursor-pointer ${
              todayEntry?.rating === 'ruim'
                ? 'border-rose-500 bg-rose-50 text-rose-900 shadow-xs'
                : 'border-slate-200 hover:border-slate-300 text-slate-700'
            }`}
          >
            <div className="text-2xl mb-1">🥱</div>
            <div className="text-xs sm:text-sm font-black">Dormi mal</div>
            <div className="text-[10px] text-slate-500">Cansado</div>
          </button>
        </div>

        {todayEntry?.rating && (
          <p className="text-center text-xs font-bold text-indigo-700 pt-1">
            ✅ Registrado com sucesso para hoje!
          </p>
        )}
      </div>

      {/* 7-Day Visual Graph */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-black text-indigo-900 tracking-wide flex items-center gap-1.5 uppercase">
            <Clock className="w-4 h-4 text-indigo-600" />
            Gráfico simples dos últimos 7 dias:
          </h4>
          <span className="text-[11px] font-semibold text-slate-400">
            Toque para marcar / desmarcar
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {recent7.map((item) => {
            const isCompleted = !!item.rating;

            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpdate((prev) => {
                    const exists = prev.history.some((h) => h.date === item.dateStr);
                    if (exists) {
                      return {
                        ...prev,
                        history: prev.history.filter((h) => h.date !== item.dateStr),
                      };
                    } else {
                      return {
                        ...prev,
                        history: [
                          ...prev.history.filter((h) => h.date !== item.dateStr),
                          {
                            date: item.dateStr,
                            sleepTime: prev.targetBedTime,
                            wakeTime: prev.targetWakeTime,
                            rating: 'bom',
                          },
                        ],
                      };
                    }
                  });
                }}
                className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-between min-h-[82px] select-none ${
                  isCompleted
                    ? 'bg-emerald-50/90 border-2 border-emerald-400 text-emerald-950 shadow-2xs'
                    : 'bg-slate-50/70 hover:bg-slate-100/90 border border-slate-200 text-slate-600'
                } ${item.isToday ? 'ring-2 ring-indigo-500 border-2 border-indigo-500' : ''}`}
                title={`Clique para ${isCompleted ? 'desmarcar' : 'marcar'} ${item.dayName} (${item.dateStr})`}
              >
                <span className="text-[11px] font-bold text-slate-400">
                  {item.dayName}
                </span>

                <div className="my-1.5">
                  {isCompleted ? (
                    <div className="w-7 h-7 mx-auto rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-lg select-none">
                      😊
                    </div>
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 mx-auto rounded-full border-2 border-slate-400/80 bg-white" />
                  )}
                </div>

                <span className="text-[11px] font-bold text-slate-700">
                  {item.isToday ? 'Hoje' : item.dateStr.slice(8, 10)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
