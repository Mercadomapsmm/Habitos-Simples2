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
  AlertCircle,
  Trash2,
  Edit2,
  Calendar,
  Volume2,
  Info,
  X,
  Save,
} from 'lucide-react';

interface MedicineHabitProps {
  medicineState: MedicineState;
  onUpdate: (updater: (prev: MedicineState) => MedicineState) => void;
  onTriggerTestAlert?: (med: Medicine, time: string) => void;
}

export function MedicineHabit({
  medicineState,
  onUpdate,
  onTriggerTestAlert,
}: MedicineHabitProps) {
  const todayStr = getTodayString();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [times, setTimes] = useState<string[]>(['08:00']);
  const [timeInput, setTimeInput] = useState('08:00');
  const [frequency, setFrequency] = useState<MedicineFrequency>('daily');
  const [intervalHours, setIntervalHours] = useState(8);
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('#0284c7');

  const openAddModal = () => {
    setEditingMedId(null);
    setName('');
    setDosage('');
    setTimes(['08:00']);
    setFrequency('daily');
    setIntervalHours(8);
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
      <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-900 shadow-2xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
            <Pill className="w-5 h-5 fill-amber-400 stroke-amber-700" />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900">
              Controle Pontual de Medicamentos
            </h2>
            <p className="text-xs text-slate-600">
              O aviso toca repetidamente no horário até você apertar &quot;Tomei!&quot;.
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
          <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Pill className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-700">
              Nenhum remédio cadastrado ainda
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
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
          medicineState.medicines.map((med) => (
            <div
              key={med.id}
              className="bg-white p-5 rounded-3xl border-2 border-slate-100 hover:border-slate-300 shadow-xs space-y-4 transition"
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
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {med.name}
                    </h3>
                    <div className="text-xs font-bold text-slate-500 mt-0.5">
                      Dosagem: <span className="text-slate-800">{med.dosage}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(med)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                    title="Editar remédio"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteMedicine(med.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                    title="Excluir remédio"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notes if any */}
              {med.notes && (
                <div className="p-2.5 bg-slate-50 rounded-xl text-xs font-medium text-slate-600 border border-slate-100 flex items-start gap-1.5">
                  <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Observação:</strong> {med.notes}
                  </span>
                </div>
              )}

              {/* Doses for today */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Doses programadas hoje:
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
                            ? 'bg-emerald-50/70 border-emerald-300'
                            : 'bg-amber-50/50 border-amber-200'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-black text-slate-900">
                            ⏰ {scheduledTime}
                          </div>
                          <div className="text-[11px] font-semibold text-slate-500">
                            {isTaken
                              ? `Tomado às ${log.takenAt} ✅`
                              : 'Pendente'}
                          </div>
                        </div>

                        {isTaken ? (
                          <button
                            onClick={() => handleUnmarkTaken(med.id, scheduledTime)}
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 transition cursor-pointer"
                            title="Desfazer marcação"
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
          ))
        )}
      </div>

      {/* 7-Day History Track */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-amber-600" />
          Histórico dos últimos 7 dias:
        </h4>

        <div className="grid grid-cols-7 gap-1.5 text-center">
          {recent7.map((d) => {
            // Check how many medicines taken on that day
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

            const allDone = totalDoses > 0 && takenCount >= totalDoses;
            const partiallyDone = takenCount > 0 && !allDone;

            return (
              <div
                key={d.dateStr}
                className={`p-2 rounded-2xl border transition ${
                  allDone
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                    : partiallyDone
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                } ${d.isToday ? 'ring-2 ring-amber-500' : ''}`}
              >
                <div className="text-[10px] font-bold text-slate-400">{d.dayName}</div>
                <div className="text-lg my-1 select-none">
                  {allDone ? '💊✅' : partiallyDone ? '💊⏳' : '⚪'}
                </div>
                <div className="text-[10px] font-semibold">
                  {d.isToday ? 'Hoje' : d.dateStr.slice(8, 10)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Pill className="w-5 h-5 text-amber-600" />
                {editingMedId ? 'Editar Remédio' : 'Novo Lembrete de Remédio'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMedicine} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Remédio: *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Losartana, Dipirona, Vitamina C"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-sm focus:outline-amber-500"
                />
              </div>

              {/* Dosage */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dosagem:
                </label>
                <input
                  type="text"
                  placeholder="Ex: 50mg, 1 comprimido, 10 gotas"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-sm focus:outline-amber-500"
                />
              </div>

              {/* Repetition */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Frequência / Repetição:
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as MedicineFrequency)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 text-sm bg-white"
                >
                  <option value="daily">Diário (todos os dias)</option>
                  <option value="interval">A cada X horas (intervalo)</option>
                  <option value="specific_days">Dias específicos da semana</option>
                </select>
              </div>

              {frequency === 'interval' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Intervalo em horas:
                  </label>
                  <select
                    value={intervalHours}
                    onChange={(e) => setIntervalHours(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-800 text-sm bg-white"
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
                <label className="block text-xs font-bold text-slate-700">
                  Horário(s) das doses:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {times.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold"
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
                    className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddTime}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 cursor-pointer"
                  >
                    + Adicionar hora
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observações de uso:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Tomar com almoço, Em jejum com água"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-800 text-sm focus:outline-amber-500"
                />
              </div>

              {/* Color */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Cor do cartão:
                </label>
                <div className="flex gap-2">
                  {['#0284c7', '#059669', '#7c3aed', '#d97706', '#dc2626', '#e11d48'].map(
                    (c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-7 h-7 rounded-full border-2 transition ${
                          color === c ? 'border-slate-900 scale-110' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    )
                  )}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  Salvar Remédio
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-3 border border-slate-300 text-slate-600 rounded-2xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
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
