'use client';

import React from 'react';
import { ArrowLeft, Bell, BellOff, Info, Download, Sparkles, Sun, Moon } from 'lucide-react';
import { HabitTab } from '@/lib/types';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { requestNotificationPermission } from '@/lib/notifications';
import { Logo } from '@/components/Logo';

interface HeaderProps {
  currentTab: HabitTab;
  onSelectTab: (tab: HabitTab) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export function Header({
  currentTab,
  onSelectTab,
  notificationsEnabled,
  onToggleNotifications,
  theme,
  onToggleTheme,
}: HeaderProps) {
  const { isInstallable, install, isIOS } = usePWAInstall();

  const handleNotificationClick = async () => {
    if (!notificationsEnabled) {
      const granted = await requestNotificationPermission();
      if (granted) {
        onToggleNotifications();
      } else {
        onToggleNotifications();
      }
    } else {
      onToggleNotifications();
    }
  };

  const getTabTitle = () => {
    switch (currentTab) {
      case 'water':
        return { title: 'Lembrete de Água', subtitle: 'Hidratação e Saúde', icon: '💧' };
      case 'exercise':
        return { title: 'Lembrete de Exercício', subtitle: 'Corpo Ativo e Disposição', icon: '🏃' };
      case 'sleep':
        return { title: 'Hábito de Sono', subtitle: 'Noites Calmas e Reparadoras', icon: '😴' };
      case 'medicine':
        return { title: 'Lembrete de Remédio', subtitle: 'Doses e Horários Certos', icon: '💊' };
      case 'about':
        return { title: 'Sobre o App & Instalação', subtitle: 'Versão 1.0.0 • 100% Offline', icon: 'ℹ️' };
      default:
        return { title: 'Hábitos Simples', subtitle: 'Cuidado diário sem complicação', icon: null };
    }
  };

  const tabInfo = getTabTitle();

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 shadow-xs transition-colors">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: Back button or Logo */}
        <div className="flex items-center gap-3">
          {currentTab !== 'home' ? (
            <button
              onClick={() => onSelectTab('home')}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-sm transition active:scale-95 cursor-pointer"
              aria-label="Voltar para o início"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              <span className="font-semibold text-slate-800 dark:text-slate-100">Início</span>
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              <Logo className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none flex items-center gap-1.5">
                  Hábitos Simples
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" title="Offline e seguro" />
                </h1>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                  Leve • Sem cadastro • 100% Offline
                </p>
              </div>
            </div>
          )}

          {currentTab !== 'home' && (
            <div className="hidden sm:block">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{tabInfo.icon}</span> {tabInfo.title}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{tabInfo.subtitle}</p>
            </div>
          )}
        </div>

        {/* Right Actions: Theme Toggle, Install Button, Notifications, About */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow-xs hover:from-sky-700 hover:to-teal-700 transition active:scale-95"
              title="Instalar no celular"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Instalar App</span>
              <span className="sm:hidden">Instalar</span>
            </button>
          )}

          {isIOS && !isInstallable && (
            <button
              onClick={() => onSelectTab('about')}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-xl text-xs font-semibold hover:bg-sky-100 transition active:scale-95"
              title="Como instalar no iPhone"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Instalar</span>
            </button>
          )}

          {/* Theme Toggle Button (Branco / Dark) */}
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition active:scale-95 cursor-pointer ${
              theme === 'dark'
                ? 'bg-slate-800 border-slate-700 text-amber-300 hover:bg-slate-750'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
            title={theme === 'dark' ? 'Mudar para modo Branco' : 'Mudar para modo Dark'}
            aria-label="Alternar entre modo Branco e Dark"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="text-[11px] font-bold hidden sm:inline">Branco</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-600" />
                <span className="text-[11px] font-bold hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Notification Button */}
          <button
            onClick={handleNotificationClick}
            className={`p-2 rounded-xl border transition active:scale-95 cursor-pointer ${
              notificationsEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-100'
            }`}
            title={notificationsEnabled ? 'Notificações ativadas' : 'Ativar notificações'}
            aria-label="Controle de notificações"
          >
            {notificationsEnabled ? (
              <Bell className="w-5 h-5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
            ) : (
              <BellOff className="w-5 h-5 text-slate-400" />
            )}
          </button>

          {/* About / Settings Modal */}
          <button
            onClick={() => onSelectTab('about')}
            className={`p-2 rounded-xl border transition active:scale-95 cursor-pointer ${
              currentTab === 'about'
                ? 'bg-sky-100 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 text-sky-800 dark:text-sky-300'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
            title="Sobre o app e guia de instalação"
            aria-label="Sobre o app"
          >
            <Info className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
