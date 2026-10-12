'use client';

import React, { useState } from 'react';
import { ExerciseState, ExerciseActivity, ExerciseType } from '@/lib/types';
import { getTodayString, getDayNameBR, formatDateBR, calculateStreak, defaultActivities } from '@/lib/storage';
import { sounds, triggerVibration } from '@/lib/sound';
import confetti from 'canvas-confetti';
import {
  Flame,
  CheckCircle2,
  Clock,
  Calendar,
  Sparkles,
  Trophy,
  Edit2,
  Save,
  Check,
  Plus,
  Trash2,
  X,
  Power,
  ChevronRight,
  Info,
  Smile,
} from 'lucide-react';

interface ExerciseHabitProps {
  exerciseState: ExerciseState;
  onUpdate: (updater: (prev: ExerciseState) => ExerciseState) => void;
}

const exerciseTypeIcons: { type: ExerciseType; label: string; icon: string }[] = [
  { type: 'caminhada', label: 'Caminhada', icon: '🚶‍♂️' },
  { type: 'alongamento', label: 'Alongamento', icon: '🧘‍♀️' },
  { type: 'academia', label: 'Academia', icon: '🏋️‍♂️' },
  { type: 'corrida', label: 'Corrida', icon: '🏃‍♂️' },
  { type: 'ciclismo', label: 'Ciclismo', icon: '🚴‍♂️' },
  { type: 'outro', label: 'Outro', icon: '⚡' },
];

export const variedExerciseEmojis: { emoji: string; label: string }[] = [
  { emoji: '💪', label: 'Força' },
  { emoji: '🏃‍♂️', label: 'Corrida' },
  { emoji: '🚶‍♂️', label: 'Caminhada' },
  { emoji: '🏋️‍♂️', label: 'Academia' },
  { emoji: '🚴‍♂️', label: 'Ciclismo' },
  { emoji: '🧘‍♀️', label: 'Alongamento' },
  { emoji: '🏊‍♂️', label: 'Natação' },
  { emoji: '⚽', label: 'Futebol' },
  { emoji: '🥊', label: 'Luta' },
  { emoji: '🔥', label: 'Queima' },
  { emoji: '⚡', label: 'Energia' },
  { emoji: '🏆', label: 'Campeão' },
  { emoji: '✅', label: 'Feito' },
  { emoji: '🎯', label: 'Superação' },
  { emoji: '🕺', label: 'Dança' },
  { emoji: '🌟', label: 'Excelente' },
];

const daysOfWeek = [
  { id: 1, label: 'Seg', fullName: 'Segunda-feira' },
  { id: 2, label: 'Ter', fullName: 'Terça-feira' },
  { id: 3, label: 'Qua', fullName: 'Quarta-feira' },
  { id: 4, label: 'Qui', fullName: 'Quinta-feira' },
  { id: 5, label: 'Sex', fullName: 'Sexta-feira' },
  { id: 6, label: 'Sáb', fullName: 'Sábado' },
  { id: 0, label: 'Dom', fullName: 'Domingo' },
];

export function ExerciseHabit({ exerciseState, onUpdate }: ExerciseHabitProps) {
  const todayStr = getTodayString();
  const currentDayOfWeek = new Date().getDay(); // 0 = Domingo, 1 = Segunda...

  // Ensure activities exist with fallback to defaultActivities
  const activities: ExerciseActivity[] =
    exerciseState.activities && exerciseState.activities.length > 0
      ? exerciseState.activities
      : defaultActivities;

  // Modal for editing an activity's separate agenda
  const [editingActivity, setEditingActivity] = useState<ExerciseActivity | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Selected day for varied emoji selection in the 7-day track
  const [selectedDayForEmoji, setSelectedDayForEmoji] = useState<string | null>(null);

  // Form states for editing agenda
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<ExerciseType>('caminhada');
  const [formIcon, setFormIcon] = useState('🚶‍♂️');
  const [formDays, setFormDays] = useState<number[]>([1, 3, 5]);
  const [formTime, setFormTime] = useState('07:00');
  const [formDuration, setFormDuration] = useState(30);
  const [formEnabled, setFormEnabled] = useState(true);

  // Check if an activity is completed today
  const isActivityCompletedToday = (act: ExerciseActivity) => {
    return exerciseState.history.some(
      (h) =>
        h.date === todayStr &&
        h.completed &&
        (h.activityId === act.id || (!h.activityId && h.type === act.type))
    );
  };

  // Toggle completion of a specific activity today with its own emoji
  const handleToggleActivityDone = (act: ExerciseActivity, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const wasCompleted = isActivityCompletedToday(act);

    onUpdate((prev) => {
      const currentActs = prev.activities && prev.activities.length > 0 ? prev.activities : defaultActivities;
      let newHistory;

      if (wasCompleted) {
        // Remove today's completion for this activity
        newHistory = prev.history.filter(
          (h) => !(h.date === todayStr && (h.activityId === act.id || (!h.activityId && h.type === act.type)))
        );
      } else {
        // Add completion with specific activity icon as emoji
        newHistory = [
          ...prev.history.filter(
            (h) => !(h.date === todayStr && (h.activityId === act.id || (!h.activityId && h.type === act.type)))
          ),
          {
            date: todayStr,
            completed: true,
            type: act.type,
            activityId: act.id,
            emoji: act.icon || '💪',
          },
        ];
      }

      const anyTodayCompleted = newHistory.some((h) => h.date === todayStr && h.completed);
      const newStreak = calculateStreak(newHistory, todayStr);

      return {
        ...prev,
        activities: currentActs,
        lastCompletedDate: anyTodayCompleted ? todayStr : null,
        streakDays: newStreak,
        history: newHistory,
      };
    });

    if (!wasCompleted) {
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

  // Set specific varied emoji for any chosen day
  // CRITICAL: Marcar os dias SOMENTE quando clicar e não acionar outra função
  const handleSetDayEmoji = (targetDate: string, chosenEmoji: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    onUpdate((prev) => {
      const existing = prev.history.find((h) => h.date === targetDate);
      let newHistory;
      if (existing) {
        newHistory = prev.history.map((h) =>
          h.date === targetDate ? { ...h, completed: true, emoji: chosenEmoji } : h
        );
      } else {
        newHistory = [
          ...prev.history.filter((h) => h.date !== targetDate),
          {
            date: targetDate,
            completed: true,
            type: prev.type || 'caminhada',
            emoji: chosenEmoji,
          },
        ];
      }

      const isTodayCompleted = newHistory.some((h) => h.date === todayStr && h.completed);
      const newStreak = calculateStreak(newHistory, todayStr);

      return {
        ...prev,
        lastCompletedDate: isTodayCompleted ? todayStr : (targetDate === todayStr ? null : prev.lastCompletedDate),
        streakDays: newStreak,
        history: newHistory,
      };
    });

    sounds.playExerciseChime();
    triggerVibration([100, 50]);
  };

  // Remove day marking
  const handleRemoveDay = (targetDate: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    onUpdate((prev) => {
      const newHistory = prev.history.filter((h) => h.date !== targetDate);
      const isTodayCompleted = newHistory.some((h) => h.date === todayStr && h.completed);
      const newStreak = calculateStreak(newHistory, todayStr);

      return {
        ...prev,
        lastCompletedDate: isTodayCompleted ? todayStr : null,
        streakDays: newStreak,
        history: newHistory,
      };
    });

    setSelectedDayForEmoji(null);
  };

  // Toggle specific date in the 7-day history track with varied emojis
  // CRITICAL: Marcar os dias SOMENTE quando clicar e não acionar outra função
  const handleToggleSpecificDay = (e: React.MouseEvent, targetDate: string) => {
    e.preventDefault();
    e.stopPropagation();

    const existing = exerciseState.history.find((h) => h.date === targetDate && h.completed);
    if (!existing) {
      // Mark immediately with default emoji and open picker for varied options
      handleSetDayEmoji(targetDate, '💪');
      setSelectedDayForEmoji(targetDate);
    } else {
      // If already marked, toggle open the emoji selector to change emoji or unmark
      setSelectedDayForEmoji((curr) => (curr === targetDate ? null : targetDate));
    }
  };

  // Open modal to configure agenda for an activity
  const openEditAgenda = (act: ExerciseActivity) => {
    setEditingActivity(act);
    setIsAddingNew(false);
    setFormName(act.name);
    setFormType(act.type);
    setFormIcon(act.icon);
    setFormDays([...act.selectedDays]);
    setFormTime(act.reminderTime);
    setFormDuration(act.durationMinutes);
    setFormEnabled(act.enabled);
  };

  // Open modal to add a brand new activity with its own agenda
  const openAddNewActivity = () => {
    setEditingActivity(null);
    setIsAddingNew(true);
    setFormName('');
    setFormType('caminhada');
    setFormIcon('🚶‍♂️');
    setFormDays([1, 3, 5]);
    setFormTime('07:00');
    setFormDuration(30);
    setFormEnabled(true);
  };

  // Toggle day in schedule form
  // CRITICAL: Marcar o dia SOMENTE quando clicar e NÃO acionar outra função (sem submeter formulário)
  const handleToggleDayInForm = (e: React.MouseEvent, dayId: number) => {
    e.preventDefault();
    e.stopPropagation();

    setFormDays((prev) => {
      if (prev.includes(dayId)) {
        if (prev.length > 1) {
          return prev.filter((d) => d !== dayId);
        }
        return prev;
      } else {
        return [...prev, dayId].sort();
      }
    });
  };

  // Toggle activity enabled/disabled directly from the card
  const handleToggleActivityEnabled = (actId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    onUpdate((prev) => {
      const currentActs = prev.activities && prev.activities.length > 0 ? prev.activities : defaultActivities;
      return {
        ...prev,
        activities: currentActs.map((a) => (a.id === actId ? { ...a, enabled: !a.enabled } : a)),
      };
    });
  };

  // Save agenda settings for this activity
  const handleSaveAgenda = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const trimmedName = formName.trim() || 'Atividade';

    if (isAddingNew) {
      const newAct: ExerciseActivity = {
        id: `act-${Date.now()}`,
        name: trimmedName,
        type: formType,
        icon: formIcon,
        selectedDays: formDays,
        reminderTime: formTime,
        durationMinutes: formDuration,
        enabled: formEnabled,
      };

      onUpdate((prev) => {
        const currentActs = prev.activities && prev.activities.length > 0 ? prev.activities : defaultActivities;
        return {
          ...prev,
          activities: [...currentActs, newAct],
        };
      });
    } else if (editingActivity) {
      onUpdate((prev) => {
        const currentActs = prev.activities && prev.activities.length > 0 ? prev.activities : defaultActivities;
        return {
          ...prev,
          activities: currentActs.map((a) =>
            a.id === editingActivity.id
              ? {
                  ...a,
                  name: trimmedName,
                  type: formType,
                  icon: formIcon,
                  selectedDays: formDays,
                  reminderTime: formTime,
                  durationMinutes: formDuration,
                  enabled: formEnabled,
                }
              : a
          ),
        };
      });
    }

    setEditingActivity(null);
    setIsAddingNew(false);
  };

  // Delete activity
  const handleDeleteActivity = (actId: string) => {
    if (confirm('Deseja excluir esta atividade e sua agenda?')) {
      onUpdate((prev) => {
        const currentActs = prev.activities && prev.activities.length > 0 ? prev.activities : defaultActivities;
        return {
          ...prev,
          activities: currentActs.filter((a) => a.id !== actId),
        };
      });
      setEditingActivity(null);
      setIsAddingNew(false);
    }
  };

  // Generate 7-day display list for history with varied emoji support
  const getRecentDays = () => {
    const list = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = getDayNameBR(d.getDay());
      const entry = exerciseState.history.find((h) => h.date === dateStr && h.completed);
      const isCompleted =
        (exerciseState.lastCompletedDate === dateStr && dateStr === todayStr) ||
        !!entry;
      const emoji = entry?.emoji || (isCompleted ? '💪' : undefined);
      list.push({
        dateStr,
        dayName,
        isCompleted,
        emoji,
        isToday: dateStr === todayStr,
      });
    }
    return list;
  };

  const recentDays = getRecentDays();

  // Activities scheduled for today
  const todaysScheduledActivities = activities.filter(
    (act) => act.enabled && act.selectedDays.includes(currentDayOfWeek)
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-xl mx-auto">
      {/* Motivational Banner */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-white shadow-md text-center">
        <span className="text-3xl select-none inline-block mb-1">💪</span>
        <h2 className="text-2xl font-black tracking-tight">
          Hora de se mexer! Vai fazer bem 💪
        </h2>
        <p className="text-xs sm:text-sm font-medium text-emerald-100 mt-1 max-w-md mx-auto">
          Configure a agenda de cada atividade separadamente para manter sua rotina fácil e organizada.
        </p>
      </div>

      {/* Streak Counter Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-amber-100 dark:border-slate-800 shadow-xs flex items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
            <Flame className="w-8 h-8 fill-amber-500 stroke-amber-600 dark:stroke-amber-400" />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
              Sequência de Consistência
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight">
              {exerciseState.streakDays} {exerciseState.streakDays === 1 ? 'dia' : 'dias'}{' '}
              <span className="text-base font-bold text-slate-500 dark:text-slate-400">seguidos</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {exerciseState.streakDays >= 7
                ? '🏆 Mais de uma semana! Hábito sólido!'
                : 'Qualquer movimento hoje mantém sua sequência viva!'}
            </p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-full text-xs font-extrabold">
            <Trophy className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Em dia
          </span>
        </div>
      </div>

      {/* Section 1: Hoje na Sua Agenda */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-emerald-100 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📅</span>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Hoje na sua agenda ({getDayNameBR(currentDayOfWeek)})
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Toque no botão para marcar como feito hoje
              </p>
            </div>
          </div>
        </div>

        {todaysScheduledActivities.length === 0 ? (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
              Nenhuma atividade agendada para hoje! Dia de descanso planejado. 🛌
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-400 mt-1">
              Se você fez alguma atividade extra, pode marcar abaixo em &quot;Todas as Atividades&quot;.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {todaysScheduledActivities.map((act) => {
              const isDone = isActivityCompletedToday(act);
              return (
                <div
                  key={act.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isDone
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                      : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-3xl select-none">{act.icon}</span>
                    <div>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white capitalize">
                        {act.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>⏰ {act.reminderTime}</span>
                        <span>•</span>
                        <span>⏳ {act.durationMinutes} min</span>
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleToggleActivityDone(act, e)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition active:scale-95 cursor-pointer flex items-center gap-1.5 shadow-xs ${
                      isDone
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200/50'
                        : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isDone ? 'fill-white text-emerald-600' : 'text-white'}`} />
                    <span>{isDone ? 'Fiz hoje! ✅' : 'Fiz hoje! 💪'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section 2: Configurar Agenda de Cada Atividade Separadamente */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-slate-100 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>🏃‍♂️</span> Agenda de Cada Atividade
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure dias, horário e duração de cada uma separadamente:
            </p>
          </div>

          <button
            type="button"
            onClick={openAddNewActivity}
            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            + Atividade
          </button>
        </div>

        {/* List of all activities with separate schedules */}
        <div className="space-y-3">
          {activities.map((act) => {
            const isDoneToday = isActivityCompletedToday(act);
            return (
              <div
                key={act.id}
                className={`p-4 rounded-2xl border transition-all ${
                  act.enabled
                    ? 'bg-slate-50/70 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                    : 'bg-slate-100/50 dark:bg-slate-850/50 border-slate-200/60 dark:border-slate-800 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl select-none">{act.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white capitalize">
                          {act.name}
                        </h4>
                        {!act.enabled && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            Pausada
                          </span>
                        )}
                        {isDoneToday && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 flex items-center gap-0.5">
                            <Check className="w-3 h-3" /> Feito hoje
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                        <span>⏰ Lembrete: {act.reminderTime}</span>
                        <span>•</span>
                        <span>⏳ Duração: {act.durationMinutes} min</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions for this activity */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggleActivityEnabled(act.id, e)}
                      className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                        act.enabled
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600'
                      }`}
                      title={act.enabled ? 'Pausar esta atividade' : 'Ativar esta atividade'}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditAgenda(act)}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-bold rounded-lg transition cursor-pointer shadow-2xs"
                    >
                      <Edit2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Configurar Agenda</span>
                    </button>
                  </div>
                </div>

                {/* Days of week display for this activity's agenda */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-750 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-1">
                      Dias:
                    </span>
                    {daysOfWeek.map((day) => {
                      const isSelected = act.selectedDays.includes(day.id);
                      return (
                        <span
                          key={day.id}
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200/70 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500'
                          }`}
                        >
                          {day.label}
                        </span>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleToggleActivityDone(act, e)}
                    className={`text-xs font-bold px-2 py-0.5 rounded-md transition cursor-pointer ${
                      isDoneToday
                        ? 'text-emerald-700 dark:text-emerald-400 hover:underline'
                        : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                    }`}
                  >
                    {isDoneToday ? 'Desmarcar hoje' : 'Marcar hoje'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 3: Visual Weekly Schedule Timetable */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200 tracking-wide flex items-center gap-1.5 uppercase">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          Cronograma Semanal Consolidado
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Veja o que está programado para cada dia da sua semana:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {daysOfWeek.map((day) => {
            const scheduled = activities.filter((a) => a.enabled && a.selectedDays.includes(day.id));
            const isToday = currentDayOfWeek === day.id;

            return (
              <div
                key={day.id}
                className={`p-2.5 rounded-xl border text-xs ${
                  isToday
                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/40'
                }`}
              >
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className={`${isToday ? 'text-emerald-700 dark:text-emerald-400 font-black' : 'text-slate-700 dark:text-slate-300'}`}>
                    {day.fullName} {isToday && '(Hoje)'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {scheduled.length} {scheduled.length === 1 ? 'atividade' : 'atividades'}
                  </span>
                </div>

                {scheduled.length === 0 ? (
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">Descanso</span>
                ) : (
                  <div className="space-y-1">
                    {scheduled.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between text-[11px] text-slate-700 dark:text-slate-300"
                      >
                        <span className="flex items-center gap-1 font-medium">
                          <span>{a.icon}</span> {a.name}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400 font-semibold">
                          {a.reminderTime} ({a.durationMinutes}m)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 4: 7-Day History Track with Varied Emojis */}
      {/* CRITICAL: Marcar os dias SOMENTE quando clicar e não acionar outra função */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-black text-emerald-900 dark:text-emerald-400 tracking-wide flex items-center gap-1.5 uppercase">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Seus últimos 7 dias (Emojis Variados):
          </h4>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            Toque para escolher o emoji
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {recentDays.map((d) => {
            const isSelected = selectedDayForEmoji === d.dateStr;
            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={(e) => handleToggleSpecificDay(e, d.dateStr)}
                className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-between min-h-[86px] select-none ${
                  isSelected
                    ? 'ring-2 ring-emerald-500 border-2 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/70 shadow-sm'
                    : d.isCompleted
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/50 border-2 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-200 shadow-2xs'
                    : 'bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                } ${d.isToday && !isSelected ? 'border-dashed border-emerald-400' : ''}`}
                title={`Clique para escolher o emoji de ${d.dayName} (${d.dateStr})`}
              >
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  {d.dayName}
                </span>

                <div className="my-1.5">
                  {d.isCompleted ? (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center text-lg sm:text-xl shadow-2xs select-none">
                      {d.emoji || '💪'}
                    </div>
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-slate-300 dark:border-slate-600 bg-white/60 dark:bg-slate-900/60 flex items-center justify-center text-xs text-slate-400">
                      +
                    </div>
                  )}
                </div>

                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {d.isToday ? 'Hoje' : d.dateStr.slice(8, 10)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Varied Emoji Selector for Selected Day */}
        {selectedDayForEmoji && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-slate-800/80 border border-emerald-200 dark:border-emerald-800 space-y-2.5 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                <span>🎨</span> Marcar emoji para {formatDateBR(selectedDayForEmoji)}:
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={(e) => handleRemoveDay(selectedDayForEmoji, e)}
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  Desmarcar dia
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedDayForEmoji(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer font-bold px-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick Palette of Varied Emojis */}
            <div className="grid grid-cols-8 gap-1.5 sm:gap-2">
              {variedExerciseEmojis.map((item) => {
                const currentEntry = exerciseState.history.find((h) => h.date === selectedDayForEmoji);
                const isCurrent = currentEntry?.emoji === item.emoji;
                return (
                  <button
                    key={item.emoji}
                    type="button"
                    onClick={(e) => handleSetDayEmoji(selectedDayForEmoji, item.emoji, e)}
                    className={`p-1.5 sm:p-2 rounded-xl text-lg sm:text-2xl transition active:scale-95 cursor-pointer flex flex-col items-center justify-center ${
                      isCurrent
                        ? 'bg-emerald-500 text-white shadow-xs ring-2 ring-emerald-400 scale-105'
                        : 'bg-white dark:bg-slate-700/80 hover:bg-emerald-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600'
                    }`}
                    title={item.label}
                  >
                    <span>{item.emoji}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Toque no emoji desejado para marcar esse dia com a sua atividade específica!
            </p>
          </div>
        )}
      </div>

      {/* Modal / Overlay to Configure Agenda Separately */}
      {(editingActivity || isAddingNew) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                {isAddingNew ? 'Nova Atividade & Agenda' : `Configurar Agenda: ${editingActivity?.name}`}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setEditingActivity(null);
                  setIsAddingNew(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAgenda} className="space-y-4">
              {/* Activity Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome da Atividade: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Caminhada no parque, Alongamento matinal, Academia"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-white text-sm bg-white dark:bg-slate-800 focus:outline-emerald-500"
                />
              </div>

              {/* Icon / Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tipo e Ícone:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {exerciseTypeIcons.map((opt) => (
                    <button
                      key={opt.type}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setFormType(opt.type);
                        setFormIcon(opt.icon);
                        if (!formName || formName === 'Caminhada' || formName === 'Alongamento' || formName === 'Academia' || formName === 'Corrida' || formName === 'Ciclismo') {
                          setFormName(opt.label);
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                        formType === opt.type
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-300 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800'
                      }`}
                    >
                      <span className="text-xl">{opt.icon}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Days of week for this activity's agenda */}
              {/* CRITICAL: Marcar os dias SOMENTE quando clicar e não acionar outra função */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Dias da semana da agenda:
                  </label>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Toque para marcar/desmarcar
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {daysOfWeek.map((day) => {
                    const isSelected = formDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={(e) => handleToggleDayInForm(e, day.id)}
                        className={`py-2 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 select-none ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                        title={`Clique para ${isSelected ? 'desmarcar' : 'marcar'} ${day.fullName}`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time & Duration */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Horário do aviso:
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Duração planejada:
                  </label>
                  <select
                    value={formDuration}
                    onChange={(e) => setFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={45}>45 minutos</option>
                    <option value={60}>1 hora (60 min)</option>
                    <option value={90}>1 hora e meia (90 min)</option>
                  </select>
                </div>
              </div>

              {/* Enabled toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Lembrete ativo na agenda:
                </span>
                <button
                  type="button"
                  onClick={() => setFormEnabled(!formEnabled)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    formEnabled
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {formEnabled ? 'Ativo' : 'Pausado'}
                </button>
              </div>

              {/* Modal buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Salvar Agenda
                </button>

                {editingActivity && activities.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleDeleteActivity(editingActivity.id)}
                    className="p-3 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/40 transition cursor-pointer"
                    title="Excluir esta atividade"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setEditingActivity(null);
                    setIsAddingNew(false);
                  }}
                  className="px-4 py-3 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
