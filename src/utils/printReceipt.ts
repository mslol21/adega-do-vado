import type { Order } from '../types';

export const printReceipt = (order: Order) => {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (!printWindow) return;

  const itemsHtml = (order.items || []).map(item => `
    <tr>
      <td style="padding: 4px 0;">${item.quantity}x ${item.product_name}</td>
      <td style="padding: 4px 0; text-align: right;">R$ ${(item.total_price || item.unit_price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  const storeTitle = order.store_id === 'tabacaria' ? 'TABACARIA DO VADO' : 'ADEGA DO VADO';
  const orderTypeLabel = order.order_type === 'BALCAO' ? 'VENDA DE BALCÃO' : order.order_type === 'DELIVERY' ? 'DELIVERY / ENTREGA' : 'RETIRADA NA LOJA';

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Comprovante #${order.order_number}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; font-size: 12px; width: 280px; margin: 0 auto; padding: 10px; color: #000; }
          h2 { text-align: center; margin: 5px 0; font-size: 16px; text-transform: uppercase; font-weight: bold; }
          p { margin: 3px 0; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; margin: 5px 0; }
          .total { font-size: 15px; font-weight: bold; text-align: right; margin-top: 8px; }
          .ticket-code { text-align: center; font-size: 22px; font-weight: bold; margin: 10px 0; border: 2px solid #000; padding: 6px; }
          @media print { body { width: 100%; } }
        </style>
      </head>
      <body>
        <h2>${storeTitle}</h2>
        <p style="text-align:center; font-weight:bold;">COMPROVANTE DE RETIRADA</p>
        <div class="divider"></div>
        
        <div class="ticket-code">SENHA #${order.order_number}</div>

        <p><b>TIPO:</b> ${orderTypeLabel}</p>
        <p><b>DATA:</b> ${new Date(order.created_at || Date.now()).toLocaleString('pt-BR')}</p>
        <p><b>CLIENTE:</b> ${order.customer_name || 'Balcão / Loja'}</p>
        ${order.customer_phone ? `<p><b>TEL:</b> ${order.customer_phone}</p>` : ''}
        ${order.payment_method ? `<p><b>PAGAMENTO:</b> ${order.payment_method.toUpperCase()}</p>` : ''}
        
        <div class="divider"></div>
        <p><b>ITENS DO PEDIDO:</b></p>
        <table>
          ${itemsHtml}
        </table>
        <div class="divider"></div>
        
        ${order.notes ? `<p><b>OBS:</b> ${order.notes}</p><div class="divider"></div>` : ''}
        
        <div class="total">TOTAL: R$ ${(order.total || 0).toFixed(2)}</div>
        <div class="divider"></div>
        <p style="text-align:center; font-size: 11px; margin-top: 15px;">Apresente este comprovante para retirar seus produtos.</p>
        <p style="text-align:center; font-size: 10px;">Obrigado pela preferência!</p>
        
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
