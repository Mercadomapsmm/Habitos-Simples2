'use client';

import React, { useState } from 'react';
import { AppData } from '@/lib/types';
import { exportDataAsJSON, resetAllData } from '@/lib/storage';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import {
  ShieldCheck,
  Star,
  Download,
  Smartphone,
  HardDrive,
  RotateCcw,
  Upload,
  Check,
  ExternalLink,
  Sparkles,
  Info,
  Code2,
  Terminal,
  Heart,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Logo } from '@/components/Logo';

interface AboutModalProps {
  appData: AppData;
  onRestoreData: (data: AppData) => void;
  onClose: () => void;
  onSetTheme?: (theme: 'light' | 'dark') => void;
}

export function AboutModal({ appData, onRestoreData, onClose, onSetTheme }: AboutModalProps) {
  const { isInstallable, install, isIOS } = usePWAInstall();

  const [rating, setRating] = useState<number>(5);
  const [ratingSubmitted, setRatingSubmitted] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'sobre' | 'instalar' | 'codigo' | 'backup'>('instalar');
  const [resetConfirm, setResetConfirm] = useState(false);

  // Submit fake store rating
  const handleRate = (stars: number) => {
    setRating(stars);
    setRatingSubmitted(true);
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
  };

  // Import JSON backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.water && parsed.exercise && parsed.sleep && parsed.medicine) {
          onRestoreData(parsed);
          alert('Dados restaurados com sucesso! Seus hábitos foram recuperados.');
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch {
        alert('Erro ao ler arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetData = () => {
    if (resetConfirm) {
      const reset = resetAllData();
      onRestoreData(reset);
      setResetConfirm(false);
      alert('Dados restaurados para o padrão inicial.');
    } else {
      setResetConfirm(true);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-xl mx-auto">
      {/* Brand Hero */}
      <div className="text-center p-6 bg-gradient-to-b from-sky-50 to-white rounded-3xl border-2 border-sky-100 shadow-xs space-y-3">
        <Logo className="w-16 h-16 mx-auto" />
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Hábitos Simples
          </h2>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            Versão 1.0.0 • Gratuito & 100% Offline
          </div>
        </div>
        <p className="text-xs sm:text-sm font-medium text-slate-600 max-w-md mx-auto">
          Criado para pessoas comuns manterem água, exercício, sono e remédios em dia, sem login, sem complicação e sem anúncios.
        </p>
      </div>

      {/* Theme Selection: Branco vs Dark */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
            🎨 Cor da Tela (Tema):
          </span>
          <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
            {appData.settings?.theme === 'dark' ? 'Modo Dark Ativo 🌙' : 'Modo Branco Ativo ☀️'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onSetTheme?.('light')}
            className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer ${
              appData.settings?.theme !== 'dark'
                ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-500 text-sky-900 dark:text-sky-200 shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <span className="text-base">☀️</span>
            <span>Tela Branca (Clara)</span>
          </button>

          <button
            type="button"
            onClick={() => onSetTheme?.('dark')}
            className={`p-3 rounded-2xl border-2 flex items-center justify-center gap-2 font-bold text-xs transition cursor-pointer ${
              appData.settings?.theme === 'dark'
                ? 'bg-slate-800 border-sky-400 text-white shadow-xs'
                : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
            }`}
          >
            <span className="text-base">🌙</span>
            <span>Tela Dark (Escura)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300">
        <button
          onClick={() => setActiveTab('instalar')}
          className={`flex-1 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'instalar'
              ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          📱 Instalar no Celular
        </button>
        <button
          onClick={() => setActiveTab('codigo')}
          className={`flex-1 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'codigo'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          🤖 Guia Android / APK
        </button>
        <button
          onClick={() => setActiveTab('sobre')}
          className={`flex-1 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'sobre'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          ⭐ Avaliar & Sobre
        </button>
        <button
          onClick={() => setActiveTab('backup')}
          className={`flex-1 py-2.5 rounded-xl transition cursor-pointer ${
            activeTab === 'backup'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'hover:text-slate-900'
          }`}
        >
          💾 Meus Dados
        </button>
      </div>

      {/* TAB 1: Instalar no Celular */}
      {activeTab === 'instalar' && (
        <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-xs space-y-5 animate-fade-in">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-sky-600" />
              Como Usar Direto na Tela do Seu Celular (Passo a Passo)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              O aplicativo foi desenvolvido como PWA (Progressive Web App). Você pode colocá-lo no celular em 10 segundos sem precisar baixar nada pesado da loja.
            </p>
          </div>

          {/* Android Chrome Guide */}
          <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-sky-900 flex items-center gap-1.5">
                <span>🤖</span> No celular Android (Google Chrome):
              </span>
              {isInstallable && (
                <button
                  onClick={install}
                  className="px-3 py-1 bg-sky-600 text-white rounded-xl text-xs font-black hover:bg-sky-700 transition cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Instalar Agora
                </button>
              )}
            </div>

            <ol className="text-xs text-slate-700 space-y-2 list-decimal list-inside font-medium">
              <li>
                Abra este aplicativo no <strong>Google Chrome</strong> do seu celular.
              </li>
              <li>
                Toque no ícone de <strong>3 pontinhos (⋮)</strong> no canto superior direito do Chrome.
              </li>
              <li>
                Selecione a opção <strong>&quot;Instalar aplicativo&quot;</strong> ou <strong>&quot;Adicionar à tela inicial&quot;</strong>.
              </li>
              <li>
                Pronto! O ícone de <strong>Hábitos Simples</strong> vai aparecer na tela do seu aparelho como um aplicativo normal, funcionando mesmo sem internet.
              </li>
            </ol>
          </div>

          {/* iOS Safari Guide */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
              <span>🍏</span> No iPhone / iPad (Safari):
            </span>
            <ol className="text-xs text-slate-700 space-y-1.5 list-decimal list-inside font-medium">
              <li>Abra esta página no navegador <strong>Safari</strong>.</li>
              <li>Toque no botão de <strong>Compartilhar (o ícone de quadrado com seta para cima ⬆️)</strong>.</li>
              <li>Role um pouco para baixo e toque em <strong>&quot;Adicionar à Tela de Início&quot;</strong>.</li>
              <li>Toque em <strong>&quot;Adicionar&quot;</strong> no canto superior direito.</li>
            </ol>
          </div>

          {/* Offline benefit */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Todos os dados ficam 100% salvos no seu próprio aparelho! Zero consumo desnecessário de bateria.</span>
          </div>
        </div>
      )}

      {/* TAB 2: Guia Android / APK & Código */}
      {activeTab === 'codigo' && (
        <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-xs space-y-4 animate-fade-in">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Code2 className="w-5 h-5 text-emerald-600" />
              Como Gerar o APK Nativo para Android Studio
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Você pode converter este aplicativo em um APK nativo instalável para a Google Play Store de 3 formas muito fáceis. Aqui está a explicação simples:
            </p>
          </div>

          {/* Option 1: PWA Builder (Mais fácil do mundo) */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">1</span>
                Método Mais Fácil: PWABuilder (Gera APK em 1 clique)
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                Recomendado
              </span>
            </div>
            <p className="text-xs text-slate-600">
              O Google criou uma ferramenta oficial gratuita que pega qualquer PWA como este e gera o pacote APK/AAB pronto:
            </p>
            <ol className="text-xs text-slate-700 space-y-1 list-decimal list-inside font-medium">
              <li>Acesse <strong>pwabuilder.com</strong> no seu computador.</li>
              <li>Cole o endereço (URL) do seu aplicativo.</li>
              <li>Clique em <strong>&quot;Build My App&quot;</strong> e selecione <strong>Android</strong>.</li>
              <li>Ele gera o arquivo <code>.apk</code> e o projeto completo pronto para Android Studio!</li>
            </ol>
          </div>

          {/* Option 2: Android Studio com WebView / TWA */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-sky-500 text-white flex items-center justify-center text-[10px]">2</span>
              Método Android Studio Direto (Kotlin / Bubblewrap):
            </span>
            <p className="text-xs text-slate-600">
              Se você prefere abrir direto no Android Studio, pode rodar o comando:
            </p>
            <div className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] font-mono overflow-x-auto space-y-1">
              <div># Instalar a ferramenta de empacotamento oficial do Google:</div>
              <div className="text-emerald-400">npm install -g @bubblewrap/cli</div>
              <div># Inicializar seu projeto Android:</div>
              <div className="text-emerald-400">bubblewrap init --manifest=URL_DO_APP/manifest.webmanifest</div>
              <div># Gerar o APK:</div>
              <div className="text-emerald-400">bubblewrap build</div>
            </div>
            <p className="text-[11px] text-slate-500">
              Isso cria a pasta com o projeto Gradle e código Kotlin que você abre diretamente no Android Studio clicando em <em>Open Project</em>.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: Avaliar & Sobre */}
      {activeTab === 'sobre' && (
        <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-xs space-y-5 animate-fade-in">
          {/* 4 Pillars Summary */}
          <div>
            <h3 className="text-base font-black text-slate-900">
              Os 4 Pilares do Hábitos Simples
            </h3>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="p-3 bg-sky-50 rounded-2xl border border-sky-100 text-xs">
                <span className="text-lg">💧</span>
                <div className="font-bold text-sky-900 mt-1">1. Água</div>
                <div className="text-[11px] text-slate-500">Cálculo por peso e metas visuais.</div>
              </div>
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs">
                <span className="text-lg">🏃</span>
                <div className="font-bold text-emerald-900 mt-1">2. Exercício</div>
                <div className="text-[11px] text-slate-500">Contador de dias seguidos e motivação.</div>
              </div>
              <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100 text-xs">
                <span className="text-lg">😴</span>
                <div className="font-bold text-indigo-900 mt-1">3. Sono</div>
                <div className="text-[11px] text-slate-500">Aviso para desacelerar e histórico.</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100 text-xs">
                <span className="text-lg">💊</span>
                <div className="font-bold text-amber-900 mt-1">4. Remédios</div>
                <div className="text-[11px] text-slate-500">Avisos insistentes até confirmar.</div>
              </div>
            </div>
          </div>

          {/* Rating Section */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center space-y-2">
            <h4 className="text-xs font-bold uppercase text-amber-900">
              O que você está achando do app?
            </h4>
            <div className="flex justify-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleRate(star)}
                  className="p-1 transition active:scale-125 cursor-pointer"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= rating
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            {ratingSubmitted ? (
              <p className="text-xs font-bold text-emerald-700 animate-fade-in">
                ❤️ Muito obrigado! Sua avaliação ajuda o Hábitos Simples a continuar 100% gratuito e livre de anúncios para todos.
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">
                Toque nas estrelas para avaliar na loja.
              </p>
            )}
          </div>

          <div className="text-center text-xs text-slate-400">
            Desenvolvido com carinho para simplificar sua rotina diária.
          </div>
        </div>
      )}

      {/* TAB 4: Meus Dados / Backup */}
      {activeTab === 'backup' && (
        <div className="bg-white p-5 rounded-3xl border-2 border-slate-100 shadow-xs space-y-4 animate-fade-in">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-sky-600" />
              Backup e Armazenamento Local
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Você tem total controle. Seus dados nunca saem do seu telefone. Você pode exportar um arquivo de backup ou restaurar a qualquer momento.
            </p>
          </div>

          {/* Export button */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-800">Exportar Backup</div>
              <div className="text-[11px] text-slate-500">
                Baixa um arquivo com todos seus registros e horários.
              </div>
            </div>
            <button
              onClick={() => exportDataAsJSON(appData)}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Exportar
            </button>
          </div>

          {/* Import file */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-slate-800">Restaurar Backup</div>
              <div className="text-[11px] text-slate-500">
                Restaura um arquivo de backup baixado anteriormente.
              </div>
            </div>
            <label className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs">
              <Upload className="w-3.5 h-3.5" />
              Restaurar
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>
          </div>

          {/* Reset button */}
          <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-rose-900">Limpar / Reiniciar Dados</div>
              <div className="text-[11px] text-rose-600">
                Restaura os valores para o padrão inicial do aplicativo.
              </div>
            </div>
            <button
              onClick={handleResetData}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition active:scale-95 cursor-pointer ${
                resetConfirm
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-white border border-rose-300 text-rose-700 hover:bg-rose-100'
              }`}
            >
              {resetConfirm ? 'Confirmar Limpeza' : 'Reiniciar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
