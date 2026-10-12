'use client';

import React, { useState } from 'react';
import { ExerciseState, ExerciseType } from '@/lib/types';
import { getTodayString, getDayNameBR, calculateStreak } from '@/lib/storage';
import { sounds, triggerVibration } from '@/lib/sound';
import confetti from 'canvas-confetti';
import {
  Flame,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Trophy,
  Volume2,
  ChevronRight,
  Edit2,
  Save,
  Check,
} from 'lucide-react';

interface ExerciseHabitProps {
  exerciseState: ExerciseState;
  onUpdate: (updater: (prev: ExerciseState) => ExerciseState) => void;
}

const exerciseOptions: { id: ExerciseType; label: string; icon: string }[] = [
  { id: 'caminhada', label: 'Caminhada', icon: '🚶‍♂️' },
  { id: 'alongamento', label: 'Alongamento', icon: '🧘‍♀️' },
  { id: 'academia', label: 'Academia', icon: '🏋️‍♂️' },
  { id: 'corrida', label: 'Corrida', icon: '🏃‍♂️' },
  { id: 'ciclismo', label: 'Ciclismo', icon: '🚴‍♂️' },
  { id: 'outro', label: 'Outro', icon: '⚡' },
];

const daysOfWeek = [
  { id: 0, label: 'Dom' },
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' },
];

export function ExerciseHabit({ exerciseState, onUpdate }: ExerciseHabitProps) {
  const todayStr = getTodayString();
  const isDoneToday = exerciseState.lastCompletedDate === todayStr;

  const [isEditing, setIsEditing] = useState(false);
  const [selectedType, setSelectedType] = useState<ExerciseType>(exerciseState.type);
  const [customName, setCustomName] = useState(exerciseState.customTypeName || '');
  const [selectedDays, setSelectedDays] = useState<number[]>(exerciseState.selectedDays);
  const [time, setTime] = useState(exerciseState.reminderTime);
  const [duration, setDuration] = useState(exerciseState.durationMinutes);

  // Toggle specific date when clicked directly in the 7-day row
  const handleToggleSpecificDay = (e: React.MouseEvent, targetDate: string) => {
    e.preventDefault();
    e.stopPropagation();

    onUpdate((prev) => {
      const alreadyCompleted =
        (prev.lastCompletedDate === targetDate && targetDate === todayStr) ||
        prev.history.some((h) => h.date === targetDate && h.completed);

      let newHistory;
      if (alreadyCompleted) {
        newHistory = prev.history.filter((h) => h.date !== targetDate);
      } else {
        newHistory = [
          ...prev.history.filter((h) => h.date !== targetDate),
          { date: targetDate, completed: true, type: prev.type },
        ];
      }

      const isTodayCompleted = newHistory.some(
        (h) => h.date === todayStr && h.completed
      );
      const newStreak = calculateStreak(newHistory, todayStr);

      return {
        ...prev,
        lastCompletedDate: isTodayCompleted ? todayStr : null,
        streakDays: newStreak,
        history: newHistory,
      };
    });
  };

  // Toggle "Fiz hoje!"
  const handleToggleDone = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    handleToggleSpecificDay(e, todayStr);

    if (!isDoneToday) {
      sounds.playExerciseChime();
      triggerVibration([150, 70, 150]);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#059669', '#f59e0b'],
      });
    }
  };

  // Toggle day of week
  const handleToggleDay = (dayId: number) => {
    if (selectedDays.includes(dayId)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayId));
      }
    } else {
      setSelectedDays([...selectedDays, dayId].sort());
    }
  };

  // Save settings
  const handleSaveSettings = () => {
    onUpdate((prev) => ({
      ...prev,
      type: selectedType,
      customTypeName: customName,
      selectedDays,
      reminderTime: time,
      durationMinutes: duration,
    }));
    setIsEditing(false);
  };

  // Generate 7-day display list
  const getRecentDays = () => {
    const list = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = getDayNameBR(d.getDay());
      const isCompleted =
        (exerciseState.lastCompletedDate === dateStr && dateStr === todayStr) ||
        exerciseState.history.some((h) => h.date === dateStr && h.completed);
      list.push({
        dateStr,
        dayName,
        isCompleted,
        isToday: dateStr === todayStr,
      });
    }
    return list;
  };

  const recentDays = getRecentDays();

  const currentTypeObj =
    exerciseOptions.find((o) => o.id === exerciseState.type) || exerciseOptions[0];

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-xl mx-auto">
      {/* Motivational Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-md text-center">
        <span className="text-3xl select-none inline-block mb-1">💪</span>
        <h2 className="text-2xl font-black tracking-tight">
          Hora de se mexer! Vai fazer bem 💪
        </h2>
        <p className="text-xs sm:text-sm font-medium text-emerald-100 mt-1 max-w-md mx-auto">
          Mesmo 15 minutos de movimento transformam seu humor, protegem suas articulações e diminuem o estresse.
        </p>
      </div>

      {/* Streak Counter Card */}
      <div className="bg-white p-5 rounded-3xl border-2 border-amber-100 shadow-xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-inner">
            <Flame className="w-8 h-8 fill-amber-500 stroke-amber-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-700 uppercase tracking-wider">
              Sequência de Consistência
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
              {exerciseState.streakDays} {exerciseState.streakDays === 1 ? 'dia' : 'dias'}{' '}
              <span className="text-base font-bold text-slate-500">seguidos</span>
            </div>
            <p className="text-xs text-slate-500">
              {exerciseState.streakDays >= 7
                ? '🏆 Uma semana inteira ou mais! Hábito sólido!'
                : 'Cada dia conta para sua saúde!'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-extrabold">
            <Trophy className="w-3.5 h-3.5 text-amber-600" />
            Meta ativa
          </span>
        </div>
      </div>

      {/* Big Action: "Fiz hoje!" Button */}
      <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentTypeObj.icon}</span>
            <div>
              <h3 className="text-base font-black text-slate-900 capitalize">
                {exerciseState.type === 'outro' && exerciseState.customTypeName
                  ? exerciseState.customTypeName
                  : currentTypeObj.label}
              </h3>
              <p className="text-xs text-slate-500">
                {exerciseState.durationMinutes} minutos • Lembrete às {exerciseState.reminderTime}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Alterar
          </button>
        </div>

        {/* Big Tap Button */}
        <button
          onClick={handleToggleDone}
          className={`w-full py-5 px-6 rounded-2xl font-black text-lg sm:text-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer ${
            isDoneToday
              ? 'bg-emerald-100 border-2 border-emerald-400 text-emerald-900 hover:bg-emerald-200'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-200/50'
          }`}
        >
          <CheckCircle2
            className={`w-7 h-7 ${isDoneToday ? 'text-emerald-700 fill-emerald-200' : 'text-white'}`}
          />
          {isDoneToday ? 'Concluído hoje! (Toque para desfazer)' : 'Fiz hoje! 💪'}
        </button>

        {isDoneToday && (
          <p className="text-center text-xs font-bold text-emerald-700">
            ✨ Excelente trabalho! Seu corpo e mente agradecem pelo esforço de hoje!
          </p>
        )}
      </div>

      {/* 7-Day History Track */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-black text-emerald-900 tracking-wide flex items-center gap-1.5 uppercase">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Seus últimos 7 dias:
          </h4>
          <span className="text-[11px] font-semibold text-slate-400">
            Toque para marcar / desmarcar
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {recentDays.map((d) => (
            <button
              key={d.dateStr}
              type="button"
              onClick={(e) => handleToggleSpecificDay(e, d.dateStr)}
              className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-between min-h-[82px] select-none ${
                d.isCompleted
                  ? 'bg-emerald-50/90 border-2 border-emerald-400 text-emerald-950 shadow-2xs'
                  : 'bg-slate-50/70 hover:bg-slate-100/90 border border-slate-200 text-slate-600'
              } ${d.isToday ? 'ring-2 ring-emerald-500 border-2 border-emerald-500' : ''}`}
              title={`Clique para ${d.isCompleted ? 'desmarcar' : 'marcar'} ${d.dayName} (${d.dateStr})`}
            >
              <span className="text-[11px] font-bold text-slate-400">
                {d.dayName}
              </span>

              <div className="my-1.5">
                {d.isCompleted ? (
                  <div className="w-6 h-6 rounded-md bg-emerald-500 border-2 border-emerald-600 flex items-center justify-center text-white shadow-xs">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-slate-400/80 bg-white" />
                )}
              </div>

              <span className="text-[11px] font-bold text-slate-700">
                {d.isToday ? 'Hoje' : d.dateStr.slice(8, 10)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-white p-5 rounded-3xl border-2 border-emerald-200 shadow-md space-y-4 animate-fade-in">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Edit2 className="w-4 h-4 text-emerald-600" />
            Configurar Seu Exercício
          </h4>

          {/* Exercise Types */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Tipo de Atividade:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {exerciseOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedType(opt.id)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    selectedType === opt.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <span className="text-xl">{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            {selectedType === 'outro' && (
              <input
                type="text"
                placeholder="Qual atividade? (Ex: Pilates, Dança)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="mt-2 w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              />
            )}
          </div>

          {/* Days of week */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">
              Dias da semana para lembrar:
            </label>
            <div className="grid grid-cols-7 gap-1">
              {daysOfWeek.map((day) => (
                <button
                  key={day.id}
                  type="button"
                  onClick={() => handleToggleDay(day.id)}
                  className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedDays.includes(day.id)
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Horário do aviso:
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Duração planejada:
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 bg-white"
              >
                <option value={15}>15 minutos</option>
                <option value={30}>30 minutos</option>
                <option value={45}>45 minutos</option>
                <option value={60}>1 hora (60 min)</option>
              </select>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleSaveSettings}
              className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Salvar Alterações
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2.5 border border-slate-300 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
