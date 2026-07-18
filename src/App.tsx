import { useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { SocialProof } from './components/SocialProof';
import { ProductGrid } from './components/ProductGrid';
import { CartDrawer } from './components/CartDrawer';
import { FixedFooter } from './components/FixedFooter';
import { AdminLogin } from './pages/AdminLogin';
import { AdminPanel } from './pages/AdminPanel';
import { Landing } from './pages/Landing';
import { Toast } from './components/Toast';
import { useData } from './context/DataContext';
import { DataProvider } from './context/DataContext';
import { CartProvider } from './context/CartContext';
import { StoreProvider } from './context/StoreContext';
import { TABACARIA_CONFIG } from './data/tabacaria';
import { ADEGA_CONFIG } from './data/adega';
import type { StoreConfig } from './types/store';
import { MapPin, Phone, Lock, ArrowLeft } from 'lucide-react';

// ─── Loja genérica (usa StoreContext + DataContext injetados pelo pai) ─────────
function Store() {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });
  const { settings, loading } = useData();
  const navigate = useNavigate();

  const showToast = (message: string) => {
    setToast({ show: true, message });
  };

  // Importamos o tema do DataContext via settings, mas o tema visual vem do StoreContext
  // O Navbar e outros componentes já usam useStore() internamente

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#080508' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#C9963C', borderTopColor: 'transparent' }} />
          <p className="font-serif animate-pulse" style={{ color: '#C9963C' }}>Preparando sua seleção...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen selection:text-white" style={{ backgroundColor: '#080508' }}>
      <Navbar onCartClick={() => setIsCartOpen(true)} searchQuery={searchQuery} onSearchChange={setSearchQuery} />

      {/* Back to landing */}
      <div className="fixed top-20 left-4 z-30">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-full border border-white/10 bg-black/40 text-white/50 hover:text-white/80 hover:border-white/25 backdrop-blur-md transition-all"
        >
          <ArrowLeft size={14} />
          Catálogos
        </button>
      </div>

      <main className="pt-20">
        <SocialProof />
        <ProductGrid searchQuery={searchQuery} onAddItem={(name) => showToast(`${name} adicionado!`)} />
      </main>

      <footer className="py-16 px-4 border-t" style={{ backgroundColor: '#100810', borderColor: 'rgba(201,150,60,0.1)' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 border rounded-full flex items-center justify-center font-serif text-sm" style={{ borderColor: '#C9963C', color: '#C9963C' }}>
                  {(settings?.name || 'TC').split(' ').map(n => n?.[0] || '').join('').slice(0, 2)}
                </div>
                <div className="flex flex-col">
                  <span className="font-serif font-bold text-lg leading-none uppercase tracking-wider" style={{ color: '#C9963C' }}>
                    {settings.name}
                  </span>
                  <span className="text-[8px] uppercase tracking-[0.2em] font-medium" style={{ color: 'rgba(201,150,60,0.5)' }}>
                    {settings.slogan}
                  </span>
                </div>
              </div>
              <p className="mb-8 max-w-md text-sm" style={{ color: '#9B8E7D' }}>
                {settings.niche}. Produtos autênticos para apreciadores exigentes.
              </p>
              <div className="flex gap-4">
                <a
                  href={`https://instagram.com/${settings.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full flex items-center justify-center border transition-all"
                  style={{ borderColor: 'rgba(201,150,60,0.2)', color: '#C9963C' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <Link to="/admin" className="w-10 h-10 rounded-full flex items-center justify-center border transition-all" style={{ borderColor: 'rgba(201,150,60,0.2)', color: '#C9963C' }} title="Administrador">
                  <Lock size={16} />
                </Link>
              </div>
            </div>

            <div>
              <h4 className="font-serif font-bold mb-6 uppercase text-xs tracking-widest" style={{ color: 'rgba(201,150,60,0.4)' }}>Contato</h4>
              <ul className="space-y-4 text-sm" style={{ color: '#9B8E7D' }}>
                <li className="flex items-center gap-3">
                  <Phone size={16} style={{ color: '#C9963C' }} />
                  <span>{settings.whatsapp}</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={16} className="flex-shrink-0" style={{ color: '#C9963C' }} />
                  <span>Enviamos para todo o Brasil com rastreamento</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-serif font-bold mb-6 uppercase text-xs tracking-widest" style={{ color: 'rgba(201,150,60,0.4)' }}>Horários</h4>
              <ul className="space-y-4 text-sm" style={{ color: '#9B8E7D' }}>
                <li className="flex justify-between">
                  <span>Seg - Sex:</span>
                  <span className="font-medium" style={{ color: '#C9963C' }}>09h às 18h</span>
                </li>
                <li className="flex justify-between" style={{ color: 'rgba(155,142,125,0.5)' }}>
                  <span>Sábado:</span><span>Fechado</span>
                </li>
                <li className="flex justify-between" style={{ color: 'rgba(155,142,125,0.5)' }}>
                  <span>Domingo:</span><span>Fechado</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t flex flex-col md:flex-row justify-between items-center gap-6" style={{ borderColor: 'rgba(201,150,60,0.1)' }}>
            <p className="text-sm" style={{ color: 'rgba(155,142,125,0.4)' }}>
              © {new Date().getFullYear()} {settings.name}. Todos os direitos reservados.
            </p>
            <div className="flex gap-6 text-sm" style={{ color: 'rgba(155,142,125,0.4)' }}>
              <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              <a href="#" className="hover:text-white transition-colors">Termos</a>
            </div>
          </div>
        </div>
      </footer>

      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      <FixedFooter onClick={() => setIsCartOpen(true)} />
      <Toast 
        isVisible={toast.show} 
        message={toast.message} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
}

// ─── Wrapper que injeta o StoreProvider + DataProvider + CartProvider ──────────
function StoreWrapper({ config, children }: { config: StoreConfig; children?: React.ReactNode }) {
  return (
    <StoreProvider config={config}>
      <DataProvider storeConfig={config}>
        <CartProvider>
          {children ?? <Store />}
        </CartProvider>
      </DataProvider>
    </StoreProvider>
  );
}

// ─── App root com rotas ────────────────────────────────────────────────────────
function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/tabacaria" element={<StoreWrapper config={TABACARIA_CONFIG} />} />
      <Route path="/adega" element={<StoreWrapper config={ADEGA_CONFIG} />} />
      <Route path="/admin/tabacaria" element={<StoreWrapper config={TABACARIA_CONFIG}><AdminPanel /></StoreWrapper>} />
      <Route path="/admin/adega" element={<StoreWrapper config={ADEGA_CONFIG}><AdminPanel /></StoreWrapper>} />
      <Route path="/admin" element={<AdminLogin />} />
    </Routes>
  );
}

export default App;
