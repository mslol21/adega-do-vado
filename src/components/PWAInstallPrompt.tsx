import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';

export const PWAInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  useEffect(() => {
    // Verifica se o aplicativo já está instalado / rodando em modo standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      return; // Já está rodando como app instalado!
    }

    // Detecta se é iOS / iPhone / iPad
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Se a pessoa já fechou a mensagem nas últimas 24 horas
    const dismissedUntil = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil, 10)) {
      return;
    }

    // Evento nativo do Chrome / Android / Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // No iOS, como não existe beforeinstallprompt, mostramos após 3 segundos
    if (iosDevice) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Esconde por 24 horas ao fechar no X
    localStorage.setItem('pwa_prompt_dismissed', (Date.now() + 24 * 60 * 60 * 1000).toString());
  };

  if (!showPrompt) return null;

  return (
    <>
      {/* Banner Flutuante no Rodapé da Tela */}
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-50 animate-slide-up">
        <div className="bg-[#100810]/95 border border-[#C9963C]/40 rounded-2xl p-4 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-black/60 border border-[#C9963C]/40 rounded-xl flex items-center justify-center flex-shrink-0">
              <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" onError={(e) => { (e.target as any).style.display = 'none'; }} />
              <Smartphone className="text-[#C9963C] w-6 h-6 hidden" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-[#C9963C]">Instalar o App da Adega</h4>
              <p className="text-[11px] text-[#9B8E7D] leading-tight">Acesso rápido sem precisar digitar o site!</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3.5 py-2 bg-[#C9963C] text-black font-extrabold text-xs rounded-xl flex items-center gap-1.5 hover:bg-[#b08030] transition-all shadow-md active:scale-95"
            >
              <Download size={14} />
              <span>Instalar</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-all"
              title="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Modal com Instruções para iOS (iPhone/iPad) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#100810] border border-[#C9963C]/40 rounded-3xl max-w-sm w-full p-6 text-white text-center space-y-4 animate-scale-up">
            <div className="w-14 h-14 bg-[#C9963C]/10 border border-[#C9963C]/30 rounded-2xl mx-auto flex items-center justify-center">
              <Smartphone size={28} className="text-[#C9963C]" />
            </div>

            <h3 className="font-serif font-bold text-lg text-[#C9963C]">Como Instalar no iPhone / iPad</h3>
            
            <ol className="text-left text-xs space-y-3 bg-black/40 p-4 rounded-2xl border border-white/5 text-[#9B8E7D]">
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#C9963C] text-sm">1.</span>
                <span>Toque no botão <strong className="text-white flex items-center gap-1 inline-flex"><Share size={12} /> Compartilhar</strong> na barra inferior do navegador Safari.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#C9963C] text-sm">2.</span>
                <span>Role para baixo e selecione a opção <strong className="text-white flex items-center gap-1 inline-flex"><PlusSquare size={12} /> Adicionar à Tela de Início</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-[#C9963C] text-sm">3.</span>
                <span>Toque em <strong className="text-white">Adicionar</strong> no canto superior direito.</span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-3 bg-[#C9963C] text-black font-extrabold text-xs rounded-xl hover:bg-[#b08030] transition-all"
            >
              Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
