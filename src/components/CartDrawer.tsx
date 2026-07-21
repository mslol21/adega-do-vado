import React, { useState, useEffect } from 'react';
import { X, Trash2, Minus, Plus, MessageCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface CheckoutFormData {
  name: string;
  phone: string;
  cep: string;
  street: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
  paymentMethod: 'pix' | 'card' | 'cash';
  changeFor: string;
  deliveryMethod: 'delivery' | 'pickup';
}

const LOCAL_STORAGE_KEY = 'tabacaria_checkout_info';

const formatCep = (value: string) => {
  const clean = value.replace(/\D/g, '');
  if (clean.length <= 5) return clean;
  return `${clean.slice(0, 5)}-${clean.slice(5, 8)}`;
};

const formatPhone = (value: string) => {
  const clean = value.replace(/\D/g, '');
  if (clean.length === 0) return '';
  if (clean.length <= 2) return `(${clean}`;
  if (clean.length <= 6) return `(${clean.slice(0, 2)}) ${clean.slice(2)}`;
  if (clean.length <= 10) return `(${clean.slice(0, 2)}) ${clean.slice(2, 6)}-${clean.slice(6)}`;
  return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7, 11)}`;
};

const fetchAddressByCep = async (cep: string) => {
  const cleanCep = cep.replace(/\D/g, '');
  if (cleanCep.length !== 8) return null;
  
  const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
  if (!response.ok) throw new Error('Falha ao buscar CEP');
  
  const data = await response.json();
  if (data.erro) {
    throw new Error('CEP não encontrado');
  }
  return {
    logradouro: data.logradouro || '',
    bairro: data.bairro || '',
    cidade: data.localidade || '',
    estado: data.uf || '',
  };
};

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const { settings } = useData();
  const { theme } = useStore();

  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState('');

  const [formData, setFormData] = useState<CheckoutFormData>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          name: parsed.name || '',
          phone: parsed.phone || '',
          cep: parsed.cep || '',
          street: parsed.street || '',
          number: parsed.number || '',
          neighborhood: parsed.neighborhood || '',
          city: parsed.city || '',
          state: parsed.state || '',
          complement: parsed.complement || '',
          paymentMethod: parsed.paymentMethod || 'pix',
          changeFor: parsed.changeFor || '',
          deliveryMethod: parsed.deliveryMethod || 'delivery',
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {
      name: '',
      phone: '',
      cep: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      complement: '',
      paymentMethod: 'pix',
      changeFor: '',
      deliveryMethod: 'delivery',
    };
  });

  useEffect(() => {
    const cleanCep = formData.cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      const fetchAddress = async () => {
        setCepLoading(true);
        setCepError('');
        try {
          const addr = await fetchAddressByCep(cleanCep);
          if (addr) {
            setFormData(prev => ({
              ...prev,
              street: addr.logradouro,
              neighborhood: addr.bairro,
              city: addr.cidade,
              state: addr.estado,
            }));
          }
        } catch (err: any) {
          setCepError(err.message || 'Erro ao buscar CEP');
        } finally {
          setCepLoading(false);
        }
      };
      fetchAddress();
    } else {
      setCepError('');
    }
  }, [formData.cep]);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return alert('Por favor, informe seu nome.');
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return alert('Por favor, informe um telefone de contato válido.');
    const cleanCep = formData.cep.replace(/\D/g, '');
    if (cleanCep.length !== 8) return alert('Por favor, informe um CEP válido.');
    if (formData.deliveryMethod === 'delivery') {
      if (!formData.street.trim()) return alert('Por favor, informe o endereço.');
      if (!formData.number.trim()) return alert('Por favor, informe o número.');
      if (!formData.neighborhood.trim()) return alert('Por favor, informe o bairro.');
    }

    // Save to localStorage
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(formData));

    const storeName = settings.name || 'Adega do Vado';
    
    let paymentDesc = '';
    if (formData.paymentMethod === 'pix') {
      paymentDesc = 'Pix';
    } else if (formData.paymentMethod === 'card') {
      paymentDesc = 'Cartão (na entrega)';
    } else {
      paymentDesc = `Dinheiro${formData.changeFor ? ` (Troco para R$ ${formData.changeFor})` : ' (Sem troco)'}`;
    }

    const deliveryFee = formData.deliveryMethod === 'delivery' ? (settings.deliveryFee || 0) : 0;
    const finalTotal = totalPrice + deliveryFee;

    const cartText = cart.map(item => `📦 *${item.quantity}x ${item.name}*${item.selectedFlavor ? ` (Sabor: ${item.selectedFlavor})` : ''}\n   ${(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`).join('\n\n');

    let addressText = '';
    if (formData.deliveryMethod === 'delivery') {
      addressText = `*📍 Endereço de Entrega:*\n` +
        `• CEP: ${formData.cep}\n` +
        `• Endereço: ${formData.street.trim()}, nº ${formData.number.trim()} - ${formData.neighborhood.trim()}\n` +
        `• Cidade: ${formData.city} - ${formData.state}\n` +
        `${formData.complement.trim() ? `• Complemento: ${formData.complement.trim()}\n` : ''}\n` +
        `• Taxa de Entrega: ${deliveryFee > 0 ? deliveryFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Grátis'}\n\n`;
    } else {
      addressText = `*📍 Retirada na Loja*\n\n`;
    }

    const message = `Olá ${storeName}! Gostaria de fazer um pedido:\n\n` +
      cartText +
      `\n\n━━━━━━━━━━━━━━━\n*💰 Total: ${finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*\n━━━━━━━━━━━━━━━\n\n` +
      `*👤 Cliente:*\n` +
      `• Nome: ${formData.name.trim()}\n` +
      `• WhatsApp: ${formData.phone}\n\n` +
      addressText +
      `*💳 Pagamento:*\n` +
      `• Forma: ${paymentDesc}\n\n` +
      `_Pedido gerado via catálogo online._\n\nAguardando confirmação...`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${settings.whatsapp}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');

    clearCart();
    setStep('cart');
    onClose();
  };

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div
        onClick={onClose}
        className={`absolute inset-0 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        style={{ backgroundColor: `${theme.bgPrimary}CC` }}
      />
      <div
        className={`absolute right-0 top-0 bottom-0 w-full max-w-md flex flex-col border-l transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ 
          backgroundColor: theme.bgPrimary, 
          borderColor: `${theme.accent}15`,
          boxShadow: `0 0 50px -12px ${theme.accent}25`
        }}
      >
        {/* Header */}
            <div className="p-8 border-b flex items-center justify-between backdrop-blur-xl sticky top-0 z-10" style={{ borderColor: `${theme.accent}15` }}>
              <div className="flex items-center gap-4">
                {step === 'checkout' && (
                  <button 
                    onClick={() => setStep('cart')}
                    className="p-2 rounded-xl transition-all mr-2"
                    style={{ background: `${theme.accent}10`, color: theme.accent }}
                  >
                    <ArrowLeft size={20} />
                  </button>
                )}
                <div 
                  className="p-3 rounded-2xl border" 
                  style={{ background: `${theme.accent}10`, color: theme.accent, borderColor: `${theme.accent}30` }}
                >
                  <ShoppingBag size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-2xl uppercase tracking-widest" style={{ color: theme.accent }}>
                    {step === 'cart' ? 'Meu Carrinho' : 'Entrega'}
                  </h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black" style={{ color: `${theme.accent}40` }}>
                    {step === 'cart' ? `${totalItems} itens selecionados` : 'Preencha seus dados'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 rounded-full transition-all"
                style={{ color: `${theme.accent}40` }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = theme.accent;
                  (e.currentTarget as HTMLButtonElement).style.background = `${theme.accent}10`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.color = `${theme.accent}40`;
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* Items Area */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6">
              {step === 'cart' ? (
                cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-8">
                    <div 
                      className="p-10 rounded-full mb-8 border relative animate-fade-in"
                      style={{ backgroundColor: theme.bgSecondary, borderColor: `${theme.accent}10` }}
                    >
                      <ShoppingBag size={64} strokeWidth={1} style={{ color: `${theme.accent}20` }} />
                      <div className="absolute inset-0 rounded-full blur-2xl animate-pulse" style={{ backgroundColor: `${theme.accent}05` }} />
                    </div>
                    <h3 className="font-serif text-2xl mb-3" style={{ color: `${theme.accent}80` }}>Carrinho Vazio</h3>
                    <p className="text-xs uppercase tracking-[0.3em] font-medium leading-loose mb-10" style={{ color: `${theme.accent}30` }}>
                      Explore nosso catálogo premium e selecione seus itens favoritos.
                    </p>
                    <button
                      onClick={onClose}
                      className="px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-xl"
                      style={{ background: theme.gradientAccent, color: theme.bgPrimary, boxShadow: theme.shadowAccent }}
                    >
                      Explorar Catálogo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div 
                        key={`${item.id}-${item.name}-${item.selectedFlavor || ''}`}
                        className="flex gap-5 p-4 rounded-[24px] border group transition-all duration-500 animate-slide-in-right"
                        style={{ 
                          backgroundColor: `${theme.bgSecondary}60`, 
                          borderColor: `${theme.accent}05` 
                        }}
                      >
                        <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border shadow-inner group-hover:border-accent transition-colors"
                             style={{ backgroundColor: theme.bgPrimary, borderColor: `${theme.accent}10` }}>
                          <img 
                            src={item.image} 
                            alt={item.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" 
                          />
                        </div>
                        <div className="flex-grow flex flex-col justify-between py-1">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <h4 className="font-bold text-sm line-clamp-2 leading-tight mb-1 transition-colors" style={{ color: '#fff' }}>
                                {item.name}
                              </h4>
                              <p className="text-[9px] uppercase tracking-widest font-medium" style={{ color: `${theme.accent}40` }}>
                                {item.category} {item.selectedFlavor ? `• Sabor: ${item.selectedFlavor}` : ''}
                              </p>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.id, item.name, item.selectedFlavor)}
                              className="transition-all p-1 rounded-lg"
                              style={{ color: `${theme.accent}20` }}
                              onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'}
                              onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.color = `${theme.accent}20`}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between mt-4">
                            <span className="font-bold text-lg tabular-nums" style={{ color: theme.accent }}>
                              {(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                            <div className="flex items-center gap-4 px-4 py-2 rounded-xl border shadow-lg"
                                 style={{ backgroundColor: `${theme.bgPrimary}CC`, borderColor: `${theme.accent}15` }}>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity - 1, item.name, item.selectedFlavor)}
                                className="transition-all active:scale-75"
                                style={{ color: `${theme.accent}40` }}
                              >
                                <Minus size={14} strokeWidth={3} />
                              </button>
                              <span className="text-sm font-black w-6 text-center tabular-nums" style={{ color: theme.accent }}>{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1, item.name, item.selectedFlavor)}
                                className="transition-all active:scale-75"
                                style={{ color: `${theme.accent}40` }}
                              >
                                <Plus size={14} strokeWidth={3} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <form id="checkout-form" onSubmit={handleCheckout} className="space-y-6 text-white pb-6">
                  {/* Seção Dados Pessoais */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: `${theme.accent}70` }}>
                      Identificação
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-widest block mb-1.5" style={{ color: `${theme.accent}50` }}>
                          Nome Completo *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={e => setFormData({ ...formData, name: e.target.value })}
                          className="w-full rounded-xl p-3.5 text-sm outline-none border transition-all"
                          style={{ background: theme.bgSecondary, borderColor: `${theme.accent}15`, color: '#fff' }}
                          placeholder="Ex: João da Silva"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-widest block mb-1.5" style={{ color: `${theme.accent}50` }}>
                          Telefone / WhatsApp *
                        </label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={e => setFormData({ ...formData, phone: formatPhone(e.target.value) })}
                          className="w-full rounded-xl p-3.5 text-sm outline-none border transition-all"
                          style={{ background: theme.bgSecondary, borderColor: `${theme.accent}15`, color: '#fff' }}
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Seção Opções de Entrega */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: `${theme.accent}70` }}>
                      Opções de Entrega
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, deliveryMethod: 'delivery' })}
                        className="py-3.5 px-2 rounded-xl text-xs font-bold transition-all border text-center"
                        style={{
                          background: formData.deliveryMethod === 'delivery' ? `${theme.accent}15` : theme.bgSecondary,
                          borderColor: formData.deliveryMethod === 'delivery' ? theme.accent : `${theme.accent}15`,
                          color: formData.deliveryMethod === 'delivery' ? theme.accent : '#fff'
                        }}
                      >
                        Entrega (Delivery)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, deliveryMethod: 'pickup' })}
                        className="py-3.5 px-2 rounded-xl text-xs font-bold transition-all border text-center"
                        style={{
                          background: formData.deliveryMethod === 'pickup' ? `${theme.accent}15` : theme.bgSecondary,
                          borderColor: formData.deliveryMethod === 'pickup' ? theme.accent : `${theme.accent}15`,
                          color: formData.deliveryMethod === 'pickup' ? theme.accent : '#fff'
                        }}
                      >
                        Retirar na Loja
                      </button>
                    </div>
                    {settings.deliveryInfo && (
                      <div className="text-[10px] p-3 rounded-lg border" style={{ backgroundColor: `${theme.accent}10`, borderColor: `${theme.accent}20`, color: theme.accent }}>
                        {settings.deliveryInfo}
                      </div>
                    )}
                  </div>

                  {/* Seção Endereço de Entrega */}
                  {formData.deliveryMethod === 'delivery' && (
                  <div className="space-y-4 pt-2 animate-slide-up">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: `${theme.accent}70` }}>
                      Endereço de Entrega
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-widest block mb-1.5" style={{ color: `${theme.accent}50` }}>
                          CEP *
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            required
                            maxLength={9}
                            value={formData.cep}
                            onChange={e => setFormData({ ...formData, cep: formatCep(e.target.value) })}
                            className="w-full rounded-xl p-3.5 pr-10 text-sm outline-none border transition-all"
                            style={{ background: theme.bgSecondary, borderColor: `${theme.accent}15`, color: '#fff' }}
                            placeholder="01310-100"
                          />
                          {cepLoading && (
                            <span className="absolute right-3.5 w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: theme.accent }} />
                          )}
                        </div>
                        {cepError && (
                          <span className="text-red-400 text-xs mt-1.5 block">{cepError}</span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <label className="text-[10px] uppercase font-bold tracking-widest block mb-1.5" style={{ color: `${theme.accent}50` }}>
                            Logradouro *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.street}
                            onChange={e => setFormData({ ...formData, street: e.target.value })}
                            className="w-full rounded-xl p-3.5 text-sm outline-none border transition-all"
                            style={{ background: theme.bgSecondary, borderColor: `${theme.accent}15`, color: '#fff' }}
                            placeholder="Ex: Av. Paulista"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-widest block mb-1.5" style={{ color: `${theme.accent}50` }}>
                            Número *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.number}
                            onChange={e => setFormData({ ...formData, number: e.target.value })}
                            className="w-full rounded-xl p-3.5 text-sm outline-none border transition-all"
                            style={{ background: theme.bgSecondary, borderColor: `${theme.accent}15`, color: '#fff' }}
                            placeholder="123"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-widest block mb-1.5" style={{ color: `${theme.accent}50` }}>
                            Bairro *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.neighborhood}
                            onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                            className="w-full rounded-xl p-3.5 text-sm outline-none border transition-all"
                            style={{ background: theme.bgSecondary, borderColor: `${theme.accent}15`, color: '#fff' }}
                            placeholder="Ex: Bela Vista"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold tracking-widest block mb-1.5" style={{ color: `${theme.accent}50` }}>
                            Cidade / UF *
                          </label>
                          <input
                            type="text"
                            disabled
                            value={formData.city ? `${formData.city} - ${formData.state}` : ''}
                            className="w-full rounded-xl p-3.5 text-sm outline-none border cursor-not-allowed opacity-70"
                            style={{ background: theme.bgSecondary, borderColor: `${theme.accent}10`, color: '#fff' }}
                            placeholder="São Paulo - SP"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] uppercase font-bold tracking-widest block mb-1.5" style={{ color: `${theme.accent}50` }}>
                          Complemento
                        </label>
                        <input
                          type="text"
                          value={formData.complement}
                          onChange={e => setFormData({ ...formData, complement: e.target.value })}
                          className="w-full rounded-xl p-3.5 text-sm outline-none border transition-all"
                          style={{ background: theme.bgSecondary, borderColor: `${theme.accent}15`, color: '#fff' }}
                          placeholder="Ex: Bloco B, Apto 42 (opcional)"
                        />
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Seção Forma de Pagamento */}
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em]" style={{ color: `${theme.accent}70` }}>
                      Forma de Pagamento
                    </h3>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'pix', label: 'Pix' },
                        { id: 'card', label: 'Cartão' },
                        { id: 'cash', label: 'Dinheiro' }
                      ].map(method => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, paymentMethod: method.id as any })}
                          className="py-3.5 px-2 rounded-xl text-xs font-bold transition-all border text-center"
                          style={{
                            background: formData.paymentMethod === method.id ? `${theme.accent}15` : theme.bgSecondary,
                            borderColor: formData.paymentMethod === method.id ? theme.accent : `${theme.accent}15`,
                            color: formData.paymentMethod === method.id ? theme.accent : '#fff'
                          }}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>

                    {formData.paymentMethod === 'cash' && (
                      <div
                        className="space-y-1.5 animate-slide-up"
                      >
                        <label className="text-[10px] uppercase font-bold tracking-widest block mb-1.5" style={{ color: `${theme.accent}50` }}>
                          Precisa de troco para quanto? (opcional)
                        </label>
                        <input
                          type="text"
                          value={formData.changeFor}
                          onChange={e => setFormData({ ...formData, changeFor: e.target.value })}
                          className="w-full rounded-xl p-3.5 text-sm outline-none border transition-all"
                          style={{ background: theme.bgSecondary, borderColor: `${theme.accent}15`, color: '#fff' }}
                          placeholder="Ex: 50 ou 100"
                        />
                      </div>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Footer / Checkout */}
            {cart.length > 0 && (
              <div className="p-8 border-t backdrop-blur-2xl space-y-4" style={{ borderColor: `${theme.accent}15`, backgroundColor: `${theme.bgSecondary}CC` }}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] font-black" style={{ color: `${theme.accent}40` }}>
                    <span>Subtotal</span>
                    <span className="tabular-nums">
                      {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between" style={{ color: '#fff' }}>
                    <span className="font-serif font-bold text-lg">
                      {step === 'cart' ? 'Total do Pedido' : (formData.deliveryMethod === 'delivery' ? 'Total com Entrega' : 'Total (Retirada)')}
                    </span>
                    <span className="text-3xl font-black tabular-nums" style={{ color: theme.accent }}>
                      {(totalPrice + (step === 'checkout' && formData.deliveryMethod === 'delivery' ? (settings.deliveryFee || 0) : 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>

                {step === 'cart' ? (
                  <button
                    onClick={() => setStep('checkout')}
                    className="w-full py-6 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-[0.98] hover:scale-[1.02] group"
                    style={{ background: theme.gradientCta, color: '#fff', boxShadow: theme.shadowCta }}
                  >
                    Continuar para Entrega
                  </button>
                ) : (
                  <div className="space-y-3">
                    <button
                      type="submit"
                      form="checkout-form"
                      className="w-full py-6 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-[0.98] hover:scale-[1.02] group"
                      style={{ background: theme.gradientCta, color: '#fff', boxShadow: theme.shadowCta }}
                    >
                      <MessageCircle size={24} strokeWidth={2.5} className="group-hover:animate-bounce" />
                      Finalizar no WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep('cart')}
                      className="w-full py-2 rounded-[24px] font-bold text-xs uppercase tracking-widest text-center transition-all opacity-60 hover:opacity-100"
                      style={{ color: '#fff' }}
                    >
                      Voltar para o Carrinho
                    </button>
                  </div>
                )}
                
                {step === 'cart' && (
                  <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: `${theme.accent}30` }}>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Atendimento Online via WhatsApp
                  </div>
                )}
              </div>
            )}
          </div>
    </div>
  );
};
