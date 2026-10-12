'use client';

import React, { useState } from 'react';
import { MedicineState, Medicine, MedicineFrequency } from '@/lib/types';
import { getTodayString, getDayNameBR } from '@/lib/storage';
import { sounds, triggerVibration } from '@/lib/sound';
import confetti from 'canvas-confetti';
import {
  Pill,
  Plus,
  CheckCircle2,
  Clock,
  Trash2,
  Edit2,
  Calendar,
  Info,
  X,
  Save,
  Check,
} from 'lucide-react';

interface MedicineHabitProps {
  medicineState: MedicineState;
  onUpdate: (updater: (prev: MedicineState) => MedicineState) => void;
  onTriggerTestAlert?: (med: Medicine, time: string) => void;
}

const daysOfWeekList = [
  { id: 1, label: 'Seg', fullName: 'Segunda' },
  { id: 2, label: 'Ter', fullName: 'Terça' },
  { id: 3, label: 'Qua', fullName: 'Quarta' },
  { id: 4, label: 'Qui', fullName: 'Quinta' },
  { id: 5, label: 'Sex', fullName: 'Sexta' },
  { id: 6, label: 'Sáb', fullName: 'Sábado' },
  { id: 0, label: 'Dom', fullName: 'Domingo' },
];

export function MedicineHabit({
  medicineState,
  onUpdate,
}: MedicineHabitProps) {
  const todayStr = getTodayString();
  const currentDayOfWeek = new Date().getDay();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [timeInput, setTimeInput] = useState('08:00');
  const [frequency, setFrequency] = useState<MedicineFrequency>('daily');
  const [intervalHours, setIntervalHours] = useState(8);
  const [specificDays, setSpecificDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#0284c7');

  const openAddModal = () => {
    setEditingMedId(null);
    setName('');
    setDosage('');
    setTimes(['08:00']);
    setFrequency('daily');
    setIntervalHours(8);
    setSpecificDays([1, 2, 3, 4, 5]);
    setNotes('');
    setColor('#0284c7');
    setIsModalOpen(true);
  };

  const openEditModal = (med: Medicine) => {
    setEditingMedId(med.id);
    setName(med.name);
    setDosage(med.dosage);
    setTimes(med.times);
    setFrequency(med.frequency);
    setIntervalHours(med.intervalHours || 8);
    setSpecificDays(med.specificDays && med.specificDays.length > 0 ? med.specificDays : [1, 2, 3, 4, 5]);
    setNotes(med.notes);
    setColor(med.color || '#0284c7');
    setIsModalOpen(true);
  };

  // Add a time to list
  const handleAddTime = () => {
    if (!timeInput || times.includes(timeInput)) return;
    setTimes([...times, timeInput].sort());
  };

  // Remove time
  const handleRemoveTime = (t: string) => {
    if (times.length > 1) {
      setTimes(times.filter((item) => item !== t));
    }
  };

  // Toggle specific day in modal
  // CRITICAL: Marcar os dias SOMENTE quando clicar e não acionar outra função
  const handleToggleSpecificDayInForm = (e: React.MouseEvent, dayId: number) => {
    e.preventDefault();
    e.stopPropagation();

    setSpecificDays((prev) => {
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

  // Save medicine
  const handleSaveMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingMedId) {
      // Edit
      onUpdate((prev) => ({
        ...prev,
        medicines: prev.medicines.map((m) =>
          m.id === editingMedId
            ? {
                ...m,
                name: name.trim(),
                dosage: dosage.trim() || '1 comprimido',
                times,
                frequency,
                intervalHours: frequency === 'interval' ? intervalHours : undefined,
                specificDays: frequency === 'specific_days' ? specificDays : undefined,
                notes: notes.trim(),
                color,
              }
            : m
        ),
      }));
    } else {
      // Create new
      const newMed: Medicine = {
        id: `med-${Date.now()}`,
        name: name.trim(),
        dosage: dosage.trim() || '1 comprimido',
        times,
        frequency,
        intervalHours: frequency === 'interval' ? intervalHours : undefined,
        specificDays: frequency === 'specific_days' ? specificDays : undefined,
        notes: notes.trim(),
        color,
        history: [],
      };
      onUpdate((prev) => ({
        ...prev,
        medicines: [...prev.medicines, newMed],
      }));
    }

    setIsModalOpen(false);
  };

  // Delete medicine
  const handleDeleteMedicine = (medId: string) => {
    if (confirm('Deseja excluir este lembrete de remédio?')) {
      onUpdate((prev) => ({
        ...prev,
        medicines: prev.medicines.filter((m) => m.id !== medId),
      }));
    }
  };

  // Mark dose as taken
  const handleMarkTaken = (medId: string, scheduledTime: string) => {
    const now = new Date();
    const currentClock = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    onUpdate((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m) => {
        if (m.id !== medId) return m;
        const filteredHistory = m.history.filter(
          (h) => !(h.date === todayStr && h.time === scheduledTime)
        );
        return {
          ...m,
          history: [
            ...filteredHistory,
            { date: todayStr, time: scheduledTime, takenAt: currentClock },
          ],
        };
      }),
    }));

    sounds.playGoalCelebration();
    triggerVibration([200, 100, 200]);
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#10b981', '#3b82f6'],
    });
  };

  // Unmark dose
  const handleUnmarkTaken = (medId: string, scheduledTime: string) => {
    onUpdate((prev) => ({
      ...prev,
      medicines: prev.medicines.map((m) => {
        if (m.id !== medId) return m;
        return {
          ...m,
          history: m.history.filter(
            (h) => !(h.date === todayStr && h.time === scheduledTime)
          ),
        };
      }),
    }));
  };

  // 7-day history list
  const getRecent7Days = () => {
    const list = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = getDayNameBR(d.getDay());
      list.push({ dateStr, dayName, isToday: dateStr === todayStr });
    }
    return list;
  };

  const recent7 = getRecent7Days();

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-xl mx-auto">
      {/* Header Info Banner */}
      <div className="p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 shadow-2xs flex items-center justify-between gap-3 transition-colors">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0 text-amber-700 dark:text-amber-300">
            <Pill className="w-5 h-5 fill-amber-400 stroke-amber-700 dark:stroke-amber-300" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white">
              Controle Pontual de Medicamentos
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              O aviso toca no horário até você apertar &quot;Tomei!&quot;.
            </p>
          </div>
        </div>

        <button
          onClick={openAddModal}
          className="shrink-0 px-3 py-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Adicionar
        </button>
      </div>

      {/* Medicines List */}
      <div className="space-y-4">
        {medicineState.medicines.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-center space-y-3 transition-colors">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Pill className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-700 dark:text-slate-200">
              Nenhum remédio cadastrado ainda
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Adicione seus medicamentos para receber alertas no horário correto e nunca esquecer uma dose.
            </p>
            <button
              onClick={openAddModal}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold hover:bg-amber-600 transition inline-flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar Primeiro Remédio
            </button>
          </div>
        ) : (
          medicineState.medicines.map((med) => {
            const isScheduledForToday =
              med.frequency !== 'specific_days' ||
              !med.specificDays ||
              med.specificDays.includes(currentDayOfWeek);

            return (
              <div
                key={med.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs space-y-4 transition-colors"
              >
                {/* Med Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: med.color || '#0284c7' }}
                    >
                      <Pill className="w-5 h-5 fill-white/80" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                        {med.name}
                      </h3>
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                        Dosagem: <span className="text-slate-800 dark:text-slate-200">{med.dosage}</span>
                        {med.frequency === 'specific_days' && (
                          <span className="ml-2 text-amber-600 dark:text-amber-400 font-semibold">
                            (Dias específicos)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(med)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                      title="Editar remédio"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMedicine(med.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                      title="Excluir remédio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Notes if any */}
                {med.notes && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700 flex items-start gap-1.5">
                    <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                    <span>
                      <strong>Observação:</strong> {med.notes}
                    </span>
                  </div>
                )}

                {/* Doses for today */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Doses programadas hoje:
                    </span>
                    {!isScheduledForToday && (
                      <span className="text-[11px] text-slate-400 font-normal italic">
                        Não programado para hoje
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {med.times.map((scheduledTime) => {
                      const log = med.history.find(
                        (h) => h.date === todayStr && h.time === scheduledTime
                      );
                      const isTaken = !!log;

                      return (
                        <div
                          key={scheduledTime}
                          className={`p-3 rounded-2xl border flex items-center justify-between gap-2 transition ${
                            isTaken
                              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                              : 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          <div>
                            <div className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-1">
                              <span>⏰</span> {scheduledTime}
                            </div>
                            <div className="text-[11px] font-bold mt-0.5">
                              {isTaken ? (
                                <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" /> Tomado às{' '}
                                  {log.takenAt || scheduledTime}
                                </span>
                              ) : (
                                <span className="text-amber-700 dark:text-amber-400">Pendente hoje</span>
                              )}
                            </div>
                          </div>

                          {isTaken ? (
                            <button
                              onClick={() => handleUnmarkTaken(med.id, scheduledTime)}
                              className="px-2.5 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-white dark:hover:bg-slate-800 transition cursor-pointer"
                            >
                              Desfazer
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkTaken(med.id, scheduledTime)}
                              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Tomei!
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 7-Day History Track */}
      {/* CRITICAL: Marcar os dias SOMENTE quando clicar e não acionar outra função */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 transition-colors">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-black text-amber-900 dark:text-amber-400 tracking-wide flex items-center gap-1.5 uppercase">
            <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            Histórico dos últimos 7 dias:
          </h4>
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            Toque para marcar / desmarcar
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          {recent7.map((d) => {
            let totalDoses = 0;
            let takenCount = 0;
            medicineState.medicines.forEach((m) => {
              m.times.forEach((t) => {
                totalDoses++;
                const taken = m.history.some(
                  (h) => h.date === d.dateStr && h.time === t
                );
                if (taken) takenCount++;
              });
            });

            const isCompleted = totalDoses > 0 ? takenCount >= totalDoses : false;

            return (
              <button
                key={d.dateStr}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onUpdate((prev) => {
                    const anyTaken = prev.medicines.some((m) =>
                      m.history.some((h) => h.date === d.dateStr)
                    );

                    if (anyTaken) {
                      // Unmark this day
                      return {
                        ...prev,
                        medicines: prev.medicines.map((m) => ({
                          ...m,
                          history: m.history.filter((h) => h.date !== d.dateStr),
                        })),
                      };
                    } else {
                      // Mark all doses for this day
                      return {
                        ...prev,
                        medicines: prev.medicines.map((m) => {
                          const otherHistory = m.history.filter((h) => h.date !== d.dateStr);
                          const dayLogs = m.times.map((t) => ({
                            date: d.dateStr,
                            time: t,
                            takenAt: t,
                          }));
                          return {
                            ...m,
                            history: [...otherHistory, ...dayLogs],
                          };
                        }),
                      };
                    }
                  });
                }}
                className={`p-2 sm:p-2.5 rounded-2xl border transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-between min-h-[82px] select-none ${
                  isCompleted
                    ? 'bg-emerald-50/90 dark:bg-emerald-950/60 border-2 border-emerald-400 text-emerald-950 dark:text-emerald-200 shadow-2xs'
                    : 'bg-slate-50/70 dark:bg-slate-800/60 hover:bg-slate-100/90 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                } ${d.isToday ? 'ring-2 ring-amber-500 border-2 border-amber-500' : ''}`}
                title={`Clique para ${isCompleted ? 'desmarcar' : 'marcar'} ${d.dayName} (${d.dateStr})`}
              >
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
                  {d.dayName}
                </span>

                <div className="my-1.5">
                  {isCompleted ? (
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-base select-none">💊</span>
                      <div className="w-5 h-5 rounded-md bg-emerald-500 border-2 border-emerald-600 flex items-center justify-center text-white shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 mx-auto rounded-full border-2 border-slate-400/80 dark:border-slate-600 bg-white dark:bg-slate-900" />
                  )}
                </div>

                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  {d.isToday ? 'Hoje' : d.dateStr.slice(8, 10)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Pill className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                {editingMedId ? 'Editar Remédio' : 'Novo Lembrete de Remédio'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMedicine} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Remédio: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Losartana, Dipirona, Vitamina C"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-white text-sm bg-white dark:bg-slate-800 focus:outline-amber-500"
                />
              </div>

              {/* Dosage */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Dosagem:
                </label>
                <input
                  type="text"
                  placeholder="Ex: 50mg, 1 comprimido, 10 gotas"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-white text-sm bg-white dark:bg-slate-800 focus:outline-amber-500"
                />
              </div>

              {/* Repetition */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Frequência / Repetição:
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as MedicineFrequency)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-white text-sm bg-white dark:bg-slate-800"
                >
                  <option value="daily">Diário (todos os dias)</option>
                  <option value="specific_days">Dias específicos da semana</option>
                  <option value="interval">A cada X horas (intervalo)</option>
                </select>
              </div>

              {/* Specific days selector */}
              {/* CRITICAL: Marcar os dias SOMENTE quando clicar e não acionar outra função */}
              {frequency === 'specific_days' && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Dias específicos para tomar:
                    </label>
                    <span className="text-[10px] font-semibold text-slate-400">
                      Toque para marcar
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {daysOfWeekList.map((day) => {
                      const isSelected = specificDays.includes(day.id);
                      return (
                        <button
                          key={day.id}
                          type="button"
                          onClick={(e) => handleToggleSpecificDayInForm(e, day.id)}
                          className={`py-2 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 select-none ${
                            isSelected
                              ? 'bg-amber-500 text-white shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-100 border border-slate-200 dark:border-slate-700'
                          }`}
                          title={`Clique para ${isSelected ? 'desmarcar' : 'marcar'} ${day.fullName}`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {frequency === 'interval' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Intervalo em horas:
                  </label>
                  <select
                    value={intervalHours}
                    onChange={(e) => setIntervalHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 font-bold text-slate-800 dark:text-white text-sm bg-white dark:bg-slate-800"
                  >
                    <option value={4}>A cada 4 horas (6 doses/dia)</option>
                    <option value={6}>A cada 6 horas (4 doses/dia)</option>
                    <option value={8}>A cada 8 horas (3 doses/dia)</option>
                    <option value={12}>A cada 12 horas (2 doses/dia)</option>
                  </select>
                </div>
              )}

              {/* Schedule times */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Horário(s) das doses:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {times.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl text-xs font-bold"
                    >
                      {t}
                      {times.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTime(t)}
                          className="text-amber-400 hover:text-red-500 ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="time"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddTime}
                    className="px-3 py-1.5 bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold hover:bg-slate-900 cursor-pointer"
                  >
                    + Adicionar hora
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Observações de uso:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Tomar com almoço, Em jejum com água"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-medium text-slate-800 dark:text-white text-sm bg-white dark:bg-slate-800 focus:outline-amber-500"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Cor do cartão:
                </label>
                <div className="flex gap-2">
                  {['#0284c7', '#059669', '#7c3aed', '#d97706', '#dc2626', '#e11d48'].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition cursor-pointer ${
                          color === c ? 'border-slate-900 scale-110 shadow-xs' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Save / Cancel buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  Salvar Remédio
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
