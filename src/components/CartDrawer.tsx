import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Minus, Plus, MessageCircle, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useData } from '../context/DataContext';
import { useStore } from '../context/StoreContext';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
  const { cart, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();
  const { settings } = useData();
  const { theme } = useStore();

  const handleCheckout = () => {
    const storeName = settings.name || 'Adega do Vado';
    const message = `Olá ${storeName}! Gostaria de fazer um pedido:\n\n` +
      cart.map(item => `📦 *${item.quantity}x ${item.name}*\n   ${(item.price * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`).join('\n\n') +
      `\n\n━━━━━━━━━━━━━━━\n*💰 Total: ${totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}*\n━━━━━━━━━━━━━━━\n\n_Pedido gerado via catálogo online._\n\nAguardando confirmação...`;
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${settings.whatsapp}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    
    // Limpa o carrinho e fecha a gaveta após enviar o pedido
    clearCart();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 backdrop-blur-md z-50"
            style={{ backgroundColor: `${theme.bgPrimary}CC` }}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md z-50 flex flex-col border-l"
            style={{ 
              backgroundColor: theme.bgPrimary, 
              borderColor: `${theme.accent}15`,
              boxShadow: `0 0 50px -12px ${theme.accent}25`
            }}
          >
            {/* Header */}
            <div className="p-8 border-b flex items-center justify-between backdrop-blur-xl sticky top-0 z-10" style={{ borderColor: `${theme.accent}15` }}>
              <div className="flex items-center gap-4">
                <div 
                  className="p-3 rounded-2xl border" 
                  style={{ background: `${theme.accent}10`, color: theme.accent, borderColor: `${theme.accent}30` }}
                >
                  <ShoppingBag size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="font-serif font-bold text-2xl uppercase tracking-widest" style={{ color: theme.accent }}>Meu Carrinho</h2>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black" style={{ color: `${theme.accent}40` }}>{totalItems} itens selecionados</p>
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
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center px-8">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-10 rounded-full mb-8 border relative"
                    style={{ backgroundColor: theme.bgSecondary, borderColor: `${theme.accent}10` }}
                  >
                    <ShoppingBag size={64} strokeWidth={1} style={{ color: `${theme.accent}20` }} />
                    <div className="absolute inset-0 rounded-full blur-2xl animate-pulse" style={{ backgroundColor: `${theme.accent}05` }} />
                  </motion.div>
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
                    <motion.div 
                      key={`${item.id}-${item.name}`}
                      layout
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex gap-5 p-4 rounded-[24px] border group transition-all duration-500"
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
                            <p className="text-[9px] uppercase tracking-widest font-medium" style={{ color: `${theme.accent}40` }}>{item.category}</p>
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id, item.name)}
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
                              onClick={() => updateQuantity(item.id, item.quantity - 1, item.name)}
                              className="transition-all active:scale-75"
                              style={{ color: `${theme.accent}40` }}
                            >
                              <Minus size={14} strokeWidth={3} />
                            </button>
                            <span className="text-sm font-black w-6 text-center tabular-nums" style={{ color: theme.accent }}>{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1, item.name)}
                              className="transition-all active:scale-75"
                              style={{ color: `${theme.accent}40` }}
                            >
                              <Plus size={14} strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer / Checkout */}
            {cart.length > 0 && (
              <div className="p-8 border-t backdrop-blur-2xl space-y-6" style={{ borderColor: `${theme.accent}15`, backgroundColor: `${theme.bgSecondary}CC` }}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] font-black" style={{ color: `${theme.accent}40` }}>
                    <span>Subtotal</span>
                    <span className="tabular-nums">
                      {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between" style={{ color: '#fff' }}>
                    <span className="font-serif font-bold text-lg">Total do Pedido</span>
                    <span className="text-3xl font-black tabular-nums" style={{ color: theme.accent }}>
                      {totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-6 rounded-[24px] font-black text-lg flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-[0.98] hover:scale-[1.02] group"
                  style={{ background: theme.gradientCta, color: '#fff', boxShadow: theme.shadowCta }}
                >
                  <MessageCircle size={24} strokeWidth={2.5} className="group-hover:animate-bounce" />
                  Finalizar no WhatsApp
                </button>
                
                <div className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.15em] font-black" style={{ color: `${theme.accent}30` }}>
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Atendimento Online via WhatsApp
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
