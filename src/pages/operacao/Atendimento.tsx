import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { useOrders } from '../../context/OrderContext';
import { Search, Plus, Minus, Trash2, ShoppingBag, ArrowLeft, Printer } from 'lucide-react';
import { printReceipt } from '../../utils/printReceipt';

export const Atendimento: React.FC = () => {
  const { products, categories } = useData();
  const { createOrder } = useOrders();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [cart, setCart] = useState<any[]>([]);
  const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.category?.toLowerCase().includes(search.toLowerCase()) ||
                          p.barcode?.toLowerCase().includes(search.toLowerCase());
    const catObj = categories.find(c => c.id === selectedCategory);
    const matchesCategory = selectedCategory === 'TODOS' || 
                            p.category === selectedCategory || 
                            (catObj && p.category === catObj.name);

    return matchesSearch && matchesCategory;
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim()) {
      e.preventDefault();
      const term = search.trim().toLowerCase();
      // Procura primeiro correspondência exata de código de barras
      const foundByBarcode = products.find(p => p.barcode && p.barcode.trim().toLowerCase() === term);
      if (foundByBarcode) {
        addToCart(foundByBarcode);
        setSearch('');
        return;
      }

      // Se houver apenas 1 produto filtrado, adiciona ele
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
        setSearch('');
      }
    }
  };

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) {
        const newQ = i.quantity + delta;
        return newQ > 0 ? { ...i, quantity: newQ } : i;
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const totalItemsCount = cart.reduce((acc, i) => acc + i.quantity, 0);
  const subtotal = cart.reduce((acc, i) => acc + (i.price * i.quantity), 0);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'cash'>('pix');

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const created = await createOrder({
      source: 'INTERNO',
      order_type: 'BALCAO',
      status: 'NOVO',
      customer_name: customerName.trim() || 'Cliente Balcão',
      customer_phone: customerPhone.trim() || undefined,
      payment_method: paymentMethod,
      subtotal,
      delivery_fee: 0,
      discount: 0,
      total: subtotal,
      items: cart.map(item => ({
        product_id: item.id,
        product_name: item.name,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity
      })) as any
    });
    
    if (created) {
      printReceipt(created);
    }

    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setMobileTab('products');
  };

  return (
    <div className="flex flex-col lg:flex-row h-full lg:h-screen lg:max-h-screen bg-[#080508] relative overflow-y-auto lg:overflow-hidden">
      {/* Selector de Abas no Mobile */}
      <div className="lg:hidden flex border-b border-[#C9963C]/20 bg-[#100810] p-2 gap-2 shrink-0 sticky top-0 z-30">
        <button
          onClick={() => setMobileTab('products')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'products' ? 'bg-[#C9963C] text-black' : 'bg-white/5 text-[#9B8E7D]'
          }`}
        >
          <ShoppingBag size={16} /> Produtos
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all relative ${
            mobileTab === 'cart' ? 'bg-[#C9963C] text-black' : 'bg-white/5 text-[#9B8E7D]'
          }`}
        >
          <span>🛒 Carrinho</span>
          {totalItemsCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
              mobileTab === 'cart' ? 'bg-black text-[#C9963C]' : 'bg-[#C9963C] text-black'
            }`}>
              {totalItemsCount}
            </span>
          )}
        </button>
      </div>

      {/* Lista de Produtos */}
      <div className={`flex-1 flex flex-col border-b lg:border-b-0 lg:border-r border-[#C9963C]/10 min-h-0 lg:h-full lg:overflow-hidden ${
        mobileTab === 'products' ? 'flex' : 'hidden lg:flex'
      }`}>
        <div className="p-4 border-b border-[#C9963C]/10 bg-[#100810] shrink-0 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9B8E7D]" size={20} />
            <input 
              type="text" 
              placeholder="Bipar código de barras ou buscar por nome..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="w-full bg-[#080508] border border-[#C9963C]/30 rounded-xl py-3 pl-10 pr-4 text-white outline-none focus:border-[#C9963C]"
              autoFocus
            />
          </div>

          {/* Barra de Categorias para Seleção Rápida */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('TODOS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'TODOS'
                  ? 'bg-[#C9963C] text-black shadow-md'
                  : 'bg-black/40 text-[#9B8E7D] border border-white/5 hover:text-white'
              }`}
            >
              ✨ Todos ({products.length})
            </button>

            {categories.map(cat => {
              const catCount = products.filter(p => p.category === cat.id || p.category === cat.name).length;
              const isSelected = selectedCategory === cat.id || selectedCategory === cat.name;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-[#C9963C] text-black shadow-md'
                      : 'bg-black/40 text-[#9B8E7D] border border-white/5 hover:text-white'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-70">({catCount})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 pb-28 lg:pb-4">
          {filteredProducts.map(p => (
            <div 
              key={p.id} 
              onClick={() => addToCart(p)}
              className="bg-[#100810] border border-[#C9963C]/10 rounded-xl p-3 cursor-pointer hover:border-[#C9963C]/50 transition-all flex flex-col active:scale-95"
            >
              <div className="h-24 bg-black/50 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {p.image ? <img src={p.image} className="w-full h-full object-cover opacity-80" /> : <span className="text-xs text-[#9B8E7D]">Sem Imagem</span>}
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-white flex-1 line-clamp-2">{p.name}</h4>
              {p.barcode && (
                <span className="text-[9px] text-[#9B8E7D] font-mono mt-1 block">
                  📊 {p.barcode}
                </span>
              )}
              <p className="text-[#C9963C] font-bold mt-2 text-sm sm:text-base">{(p.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</p>
            </div>
          ))}
        </div>

        {/* Floating Cart Banner on Mobile */}
        {cart.length > 0 && mobileTab === 'products' && (
          <div className="lg:hidden fixed bottom-16 left-4 right-4 z-40 bg-[#C9963C] text-black p-3.5 rounded-2xl flex justify-between items-center shadow-2xl animate-slide-up">
            <div>
              <p className="font-extrabold text-sm">{totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'}</p>
              <p className="text-xs font-bold opacity-80">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</p>
            </div>
            <button 
              onClick={() => setMobileTab('cart')}
              className="bg-black text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1 shadow"
            >
              Finalizar Pedido →
            </button>
          </div>
        )}
      </div>

      {/* Carrinho / PDV */}
      <div className={`w-full lg:w-96 flex flex-col bg-[#100810] shrink-0 lg:h-full lg:max-h-screen ${
        mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'
      }`}>
        <div className="p-4 sm:p-5 border-b border-[#C9963C]/10 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setMobileTab('products')}
              className="lg:hidden p-2 rounded-lg bg-white/10 text-white text-xs font-bold"
            >
              <ArrowLeft size={16} />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-[#C9963C]">Pedido Atual</h2>
          </div>
          {cart.length > 0 && (
            <button onClick={() => setCart([])} className="text-xs text-red-400 hover:text-red-300 font-bold">
              Limpar
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[180px] max-h-[calc(100vh-250px)] lg:max-h-none">
          {cart.map(item => (
            <div key={item.id} className="flex flex-col bg-black/40 border border-[#C9963C]/10 rounded-xl p-3">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-xs sm:text-sm text-white">{item.name}</span>
                <span className="text-[#C9963C] font-bold text-xs sm:text-sm">{(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 bg-black rounded-lg px-2 py-1 border border-[#C9963C]/20">
                  <button onClick={() => updateQuantity(item.id, -1)} className="text-[#9B8E7D] hover:text-white p-1"><Minus size={14} /></button>
                  <span className="text-xs sm:text-sm font-bold w-4 text-center">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, 1)} className="text-[#9B8E7D] hover:text-white p-1"><Plus size={14} /></button>
                </div>
                <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-red-400 hover:text-red-300 p-1">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="text-center text-[#9B8E7D] italic py-12 text-sm">
              Nenhum item selecionado. <br />
              <button 
                onClick={() => setMobileTab('products')} 
                className="mt-3 text-[#C9963C] font-bold underline text-xs"
              >
                + Adicionar produtos
              </button>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-5 border-t border-[#C9963C]/20 bg-[#080508] shrink-0 space-y-3">
          {cart.length > 0 && (
            <div className="space-y-2 pb-2 border-b border-white/5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Nome do Cliente (para chamada)"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-[#100810] border border-[#C9963C]/30 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9963C]"
                />
                <input
                  type="text"
                  placeholder="WhatsApp / Tel (opcional)"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full bg-[#100810] border border-[#C9963C]/30 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-[#C9963C]"
                />
              </div>
              <div className="grid grid-cols-3 gap-1 text-[11px] font-bold">
                {[
                  { id: 'pix', label: '⚡ PIX' },
                  { id: 'card', label: '💳 Cartão' },
                  { id: 'cash', label: '💵 Dinheiro' },
                ].map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`py-1.5 rounded-lg border text-center transition-all ${
                      paymentMethod === m.id
                        ? 'bg-[#C9963C]/20 border-[#C9963C] text-[#C9963C]'
                        : 'bg-black/40 border-white/5 text-[#9B8E7D]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-xs sm:text-base text-[#9B8E7D] font-bold">Total do Pedido</span>
            <span className="text-xl sm:text-2xl font-black text-[#C9963C]">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL'})}</span>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full bg-[#C9963C] text-black font-extrabold text-sm sm:text-base py-3.5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#b08030] transition-all shadow-lg active:scale-98 flex items-center justify-center gap-2"
          >
            <Printer size={18} />
            <span>Finalizar & Imprimir Comprovante</span>
          </button>
        </div>
      </div>
    </div>
  );
};
