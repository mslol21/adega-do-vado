import React, { useState } from 'react';
import { useOrders } from '../../context/useOrders';
import { useData } from '../../context/useData';
import type { Order, OrderItem, OrderStatus } from '../../types';
import { getProductFlavors } from '../../utils/flavors';
import { 
  X, Plus, Minus, Trash2, Edit3, DollarSign, 
  Package, User, Phone, MessageSquare, Check, 
  Sparkles, Save, ArrowRight
} from 'lucide-react';

interface EditOrderModalProps {
  order: Order;
  onClose: () => void;
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, onClose }) => {
  const { updateOrder } = useOrders();
  const { products } = useData();

  // Estado dos itens do pedido editável
  const [items, setItems] = useState<OrderItem[]>(() => 
    (order.items || []).map(i => ({
      ...i,
      quantity: Number(i.quantity) || 1,
      unit_price: Number(i.unit_price) || 0,
      total_price: Number(i.total_price) || (Number(i.quantity) * Number(i.unit_price)) || 0
    }))
  );

  // Dados do cliente e pagamento
  const [customerName, setCustomerName] = useState(order.customer_name || '');
  const [customerPhone, setCustomerPhone] = useState(order.customer_phone || '');
  const [paymentMethod, setPaymentMethod] = useState(order.payment_method || 'pix');
  const [changeFor, setChangeFor] = useState(order.change_for?.toString() ?? '');
  const [deliveryFee, setDeliveryFee] = useState<number>(Number(order.delivery_fee) || 0);
  const [discount, setDiscount] = useState<number>(Number(order.discount) || 0);
  const [notes, setNotes] = useState(order.notes || '');
  
  // Estado para adicionar novo produto
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedFlavor, setSelectedFlavor] = useState<string>('');
  const [customNewPrice, setCustomNewPrice] = useState<number>(0);
  const [customNewQty, setCustomNewQty] = useState<number>(1);

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Cálculos dinâmicos em tempo real
  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
  const finalTotal = Math.max(0, subtotal + Number(deliveryFee || 0) - Number(discount || 0));

  // Próximo status natural do fluxo
  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    switch (currentStatus) {
      case 'NOVO': return 'RECEBIDO';
      case 'RECEBIDO': return 'EM_PREPARACAO';
      case 'EM_PREPARACAO': return 'EM_SEPARACAO';
      case 'EM_SEPARACAO': return 'PRONTO';
      case 'PRONTO': return order.order_type === 'DELIVERY' ? 'EM_ENTREGA' : 'CONCLUIDO';
      case 'EM_ENTREGA': return 'CONCLUIDO';
      default: return null;
    }
  };
  const nextStatus = getNextStatus(order.status);

  // Alterar preço unitário de um item existente
  const handleUpdateItemPrice = (index: number, newPrice: number) => {
    const validPrice = Math.max(0, isNaN(newPrice) ? 0 : newPrice);
    setItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      const qty = Number(item.quantity) || 1;
      updated[index] = {
        ...item,
        unit_price: validPrice,
        total_price: Number((qty * validPrice).toFixed(2))
      };
      return updated;
    });
  };

  // Alterar quantidade de um item
  const handleUpdateItemQty = (index: number, delta: number) => {
    setItems(prev => {
      const updated = [...prev];
      const item = updated[index];
      const newQty = Math.max(1, (Number(item.quantity) || 1) + delta);
      const unit = Number(item.unit_price) || 0;
      updated[index] = {
        ...item,
        quantity: newQty,
        total_price: Number((newQty * unit).toFixed(2))
      };
      return updated;
    });
  };

  // Remover item
  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Quando seleciona produto para adicionar
  const handleSelectProduct = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setCustomNewPrice(Number(prod.promotionalPrice || prod.price || 0));
      const flavors = getProductFlavors(prod);
      setSelectedFlavor(flavors.length > 0 ? flavors[0] : '');
    }
  };

  // Adicionar produto ao pedido
  const handleAddProductToOrder = () => {
    const prod = products.find(p => p.id === selectedProductId);
    if (!prod) return;

    const flavorSuffix = selectedFlavor ? ` (${selectedFlavor})` : '';
    const name = prod.name + flavorSuffix;
    const qty = Math.max(1, customNewQty);
    const price = Math.max(0, customNewPrice);

    const newItem: OrderItem = {
      id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      order_id: order.id,
      product_id: prod.id,
      product_name: name,
      quantity: qty,
      unit_price: price,
      total_price: Number((qty * price).toFixed(2))
    };

    setItems(prev => [...prev, newItem]);
    setIsAddingProduct(false);
    setSelectedProductId('');
    setSelectedFlavor('');
    setCustomNewQty(1);
  };

  // Salvar pedido com os novos valores
  const handleSaveOrder = async (andAdvanceStatus = false) => {
    if (items.length === 0) {
      alert('O pedido precisa ter pelo menos 1 item.');
      return;
    }

    try {
      setLoading(true);

      const updatedPayload: Partial<Order> = {
        customer_name: customerName.trim() || 'Cliente Balcão',
        customer_phone: customerPhone.trim(),
        payment_method: paymentMethod,
        change_for: paymentMethod === 'cash' && changeFor.trim() ? Number(changeFor.replace(',', '.')) : null,
        subtotal: Number(subtotal.toFixed(2)),
        delivery_fee: Number(deliveryFee.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        total: Number(finalTotal.toFixed(2)),
        notes: notes.trim(),
        items: items
      };

      if (andAdvanceStatus && nextStatus) {
        updatedPayload.status = nextStatus;
      }
      await updateOrder(order.id, updatedPayload);

      setSuccessMsg('Pedido atualizado com sucesso!');
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Erro ao salvar alterações do pedido:', err);
      alert('Erro ao salvar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const selectedProductObj = products.find(p => p.id === selectedProductId);
  const selectedProductFlavors = selectedProductObj ? getProductFlavors(selectedProductObj) : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-[#100810] border border-[#C9963C]/30 rounded-3xl max-w-2xl w-full text-white relative shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-[#C9963C]/15 bg-gradient-to-r from-white/[0.04] to-transparent flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C9963C]/20 border border-[#C9963C]/40 flex items-center justify-center text-[#C9963C]">
              <Edit3 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-mono font-black text-[#C9963C]">
                  Editar Pedido #{order.order_number}
                </h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-white/10 text-white/80 border border-white/15">
                  {order.order_type}
                </span>
              </div>
              <p className="text-xs text-[#9B8E7D]">
                Altere valores unitários de produtos, quantidades, taxa e descontos para clientes especiais.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 sm:p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Informações do Cliente & Pagamento */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-black/40 p-3.5 rounded-2xl border border-white/5">
            <div>
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-[#9B8E7D] block mb-1 flex items-center gap-1">
                <User size={11} className="text-[#C9963C]" /> Cliente
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Nome do cliente"
                className="w-full bg-[#180F18] border border-[#C9963C]/20 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#C9963C]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-[#9B8E7D] block mb-1 flex items-center gap-1">
                <Phone size={11} className="text-[#C9963C]" /> Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder="(15) 99999-9999"
                className="w-full bg-[#180F18] border border-[#C9963C]/20 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#C9963C]"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-[#9B8E7D] block mb-1">
                Forma de Pagamento
              </label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="w-full bg-[#180F18] border border-[#C9963C]/20 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-[#C9963C]"
              >
                <option value="pix">PIX</option>
                <option value="card">Cartão</option>
                <option value="cash">Dinheiro</option>
              </select>
              {paymentMethod === 'cash' && <label className="block text-xs text-white mt-3">
                Troco para (R$)
                <input type="number" min="0" step="0.01" value={changeFor}
                  onChange={event => setChangeFor(event.target.value)}
                  placeholder="Sem troco"
                  className="w-full bg-[#180F18] border border-[#C9963C]/20 rounded-xl px-3 py-2 mt-1" />
              </label>}
            </div>
          </div>

          {/* Lista de Produtos com Preços Customizáveis */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-[#C9963C] flex items-center gap-1.5">
                <Package size={14} /> Produtos e Valores Unitários
              </h4>
              <button
                type="button"
                onClick={() => setIsAddingProduct(prev => !prev)}
                className="text-xs font-bold text-[#C9963C] hover:text-white bg-[#C9963C]/15 hover:bg-[#C9963C]/30 px-3 py-1.5 rounded-xl border border-[#C9963C]/30 flex items-center gap-1 transition-all"
              >
                <Plus size={14} /> {isAddingProduct ? 'Fechar Inclusão' : 'Adicionar Produto'}
              </button>
            </div>

            {/* Formulário de Adicionar Produto ao Pedido */}
            {isAddingProduct && (
              <div className="p-4 bg-gradient-to-b from-[#1c1220] to-[#120a14] border border-[#C9963C]/30 rounded-2xl space-y-3 animate-slide-up">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <Sparkles size={13} className="text-[#C9963C]" /> Inserir Novo Item no Pedido
                  </span>
                  <button onClick={() => setIsAddingProduct(false)} className="text-[#9B8E7D] hover:text-white">
                    <X size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#9B8E7D] block mb-1">Selecione o Produto</label>
                    <select
                      value={selectedProductId}
                      onChange={e => handleSelectProduct(e.target.value)}
                      className="w-full bg-[#080508] border border-[#C9963C]/30 rounded-xl p-2.5 text-xs text-white outline-none"
                    >
                      <option value="">-- Escolha um produto --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {(p.promotionalPrice || p.price || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedProductFlavors.length > 0 && (
                    <div>
                      <label className="text-[10px] uppercase font-bold text-[#C9963C] block mb-1">Sabor / Opção</label>
                      <select
                        value={selectedFlavor}
                        onChange={e => setSelectedFlavor(e.target.value)}
                        className="w-full bg-[#080508] border border-[#C9963C]/30 rounded-xl p-2.5 text-xs text-white outline-none"
                      >
                        {selectedProductFlavors.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#C9963C] block mb-1">
                      Preço Unitário Especial (R$) *
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-[#9B8E7D]">R$</span>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        value={customNewPrice}
                        onChange={e => setCustomNewPrice(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#080508] border border-[#C9963C]/40 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-[#C9963C] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase font-bold text-[#9B8E7D] block mb-1">Quantidade</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCustomNewQty(q => Math.max(1, q - 1))}
                        className="w-8 h-8 rounded-lg bg-black border border-white/10 text-white flex items-center justify-center hover:border-[#C9963C]"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-bold w-6 text-center">{customNewQty}</span>
                      <button
                        type="button"
                        onClick={() => setCustomNewQty(q => q + 1)}
                        className="w-8 h-8 rounded-lg bg-black border border-white/10 text-white flex items-center justify-center hover:border-[#C9963C]"
                      >
                        <Plus size={12} />
                      </button>
                      
                      <button
                        type="button"
                        onClick={handleAddProductToOrder}
                        disabled={!selectedProductId}
                        className="flex-1 ml-2 bg-[#C9963C] text-black font-extrabold text-xs py-2 px-3 rounded-xl hover:bg-[#b08030] disabled:opacity-40 transition-all shadow"
                      >
                        + Inserir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tabela / Lista de Itens Existentes */}
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div 
                  key={item.id || idx}
                  className="bg-black/50 border border-white/10 hover:border-[#C9963C]/30 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="text-xs sm:text-sm font-bold text-white block truncate">{item.product_name}</span>
                    <span className="text-[10px] text-[#9B8E7D]">
                      Subtotal: {(Number(item.quantity) * Number(item.unit_price)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
                    {/* Controle de Quantidade */}
                    <div className="flex items-center gap-2 bg-[#100810] border border-white/10 rounded-xl px-2 py-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(idx, -1)}
                        className="text-[#9B8E7D] hover:text-white p-1"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="text-xs font-black text-white w-5 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQty(idx, 1)}
                        className="text-[#9B8E7D] hover:text-white p-1"
                      >
                        <Plus size={12} />
                      </button>
                    </div>

                    {/* Preço Unitário Editável */}
                    <div className="flex items-center gap-1.5 bg-[#100810] border border-[#C9963C]/30 rounded-xl px-2.5 py-1" title="Alterar Preço Unitário">
                      <span className="text-[10px] font-bold text-[#C9963C] uppercase">R$ / un</span>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        value={item.unit_price}
                        onChange={e => handleUpdateItemPrice(idx, parseFloat(e.target.value) || 0)}
                        className="w-20 bg-transparent text-xs font-bold text-white outline-none text-right tabular-nums"
                      />
                    </div>

                    {/* Botão de Excluir Item */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      title="Remover Item"
                      className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-6 text-xs text-[#9B8E7D] border border-dashed border-white/10 rounded-2xl">
                  Nenhum item no pedido. Clique em "Adicionar Produto" acima.
                </div>
              )}
            </div>
          </div>

          {/* Ajustes Financeiros: Taxa de Entrega e Desconto */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-black/40 p-3.5 rounded-2xl border border-white/5">
            <div>
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-[#9B8E7D] block mb-1 flex items-center gap-1">
                <DollarSign size={11} className="text-[#C9963C]" /> Taxa de Entrega (R$)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-[#9B8E7D]">R$</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={deliveryFee}
                  onChange={e => setDeliveryFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#180F18] border border-[#C9963C]/20 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-white outline-none focus:border-[#C9963C]"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-[#9B8E7D] block mb-1 flex items-center gap-1">
                <DollarSign size={11} className="text-emerald-400" /> Desconto Geral (R$)
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-[#9B8E7D]">R$</span>
                <input
                  type="number"
                  step="0.50"
                  min="0"
                  value={discount}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#180F18] border border-emerald-500/30 rounded-xl pl-9 pr-3 py-2 text-xs font-bold text-emerald-400 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[10px] uppercase font-extrabold tracking-wider text-[#9B8E7D] block mb-1 flex items-center gap-1">
                <MessageSquare size={11} className="text-[#C9963C]" /> Observações do Pedido / Negociação Especial
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Ex: Cliente VIP - Preço especial autorizado pelo gerente"
                className="w-full bg-[#180F18] border border-[#C9963C]/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#C9963C]"
              />
            </div>
          </div>

          {/* Resumo de Valores */}
          <div className="p-4 bg-gradient-to-r from-[#C9963C]/10 via-[#C9963C]/5 to-transparent rounded-2xl border border-[#C9963C]/30 space-y-1.5">
            <div className="flex justify-between text-xs text-[#9B8E7D]">
              <span>Subtotal dos Produtos:</span>
              <span className="font-mono font-bold text-white">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between text-xs text-[#9B8E7D]">
                <span>Taxa de Entrega:</span>
                <span className="font-mono font-bold text-white">+{deliveryFee.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-xs text-emerald-400">
                <span>Desconto Aplicado:</span>
                <span className="font-mono font-bold">-{discount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-[#C9963C]/20">
              <span className="text-sm font-extrabold text-white">Novo Total do Pedido:</span>
              <span className="text-2xl font-black text-[#C9963C] font-mono">
                {finalTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check size={16} /> {successMsg}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#C9963C]/15 bg-[#0a050a] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold text-[#9B8E7D] hover:text-white hover:bg-white/5 transition-all"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSaveOrder(false)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save size={14} />
              <span>Salvar Alterações</span>
            </button>

            {nextStatus && (
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSaveOrder(true)}
                className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-[#C9963C] hover:bg-[#b08030] text-black font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg active:scale-95 disabled:opacity-50"
              >
                <span>Salvar & Avançar</span>
                <ArrowRight size={14} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
