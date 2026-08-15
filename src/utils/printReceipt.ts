import type { Order } from '../types';

export const printReceipt = (order: Order) => {
  const printWindow = window.open('', '_blank', 'width=450,height=650');
  if (!printWindow) return;

  const itemsHtml = (order.items || []).map(item => {
    const qty = item.quantity || 1;
    const unitPriceNum = item.unit_price || (item.total_price ? item.total_price / qty : 0);
    const unitPrice = unitPriceNum.toFixed(2);
    const itemTotal = (item.total_price || unitPriceNum * qty).toFixed(2);

    return `
      <tr>
        <td class="col-qty-name" style="width: 65%; text-align: left; padding-right: 4px; word-wrap: break-word; font-weight: 900; font-size: 13px;">
          <div style="font-weight: 900; font-size: 13px;">${item.product_name}</div>
          <div style="font-size: 12px; font-weight: 900; margin-top: 1px;">
            ${qty} x R$ ${unitPrice}
          </div>
        </td>
        <td class="col-price" style="width: 35%; text-align: right; white-space: nowrap; font-weight: 900; font-size: 13px; vertical-align: bottom;">
          R$ ${itemTotal}
        </td>
      </tr>
    `;
  }).join('');

  const storeTitle = order.store_id === 'tabacaria' ? 'TABACARIA DO VADO' : 'ADEGA DO VADO';
  const orderTypeLabel = order.order_type === 'BALCAO' ? 'VENDA DE BALCÃO' : order.order_type === 'DELIVERY' ? 'DELIVERY / ENTREGA' : 'RETIRADA NA LOJA';

  let paymentLabel = 'NÃO INFORMADO';
  if (order.payment_method) {
    const pm = order.payment_method.toLowerCase();
    if (pm === 'pix') paymentLabel = 'PIX';
    else if (pm === 'card' || pm === 'cartao') paymentLabel = 'CARTÃO (DÉBITO/CRÉDITO)';
    else if (pm === 'cash' || pm === 'dinheiro') paymentLabel = 'DINHEIRO';
    else paymentLabel = order.payment_method.toUpperCase();
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Comprovante Pedido #${order.order_number}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            font-weight: 900 !important;
            color: #000000 !important;
          }
          html, body {
            width: 100%;
            max-width: 72mm;
            margin: 0 auto;
            padding: 4mm 2mm;
            background: #ffffff;
            color: #000000;
            font-family: 'Courier New', Courier, monospace;
            font-size: 13px;
            font-weight: 900 !important;
            line-height: 1.35;
          }
          .center { text-align: center; }
          .bold { font-weight: 900 !important; }
          .divider { border-top: 2px solid #000000; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 6px 0; }
          td { padding: 4px 0; vertical-align: top; font-weight: 900 !important; }
          p { margin: 4px 0; font-weight: 900 !important; font-size: 13px; }
          .total-box { font-size: 16px; font-weight: 900 !important; text-align: right; margin-top: 8px; padding-top: 6px; border-top: 2px solid #000000; }
          .ticket-code { text-align: center; font-size: 24px; font-weight: 900 !important; margin: 8px 0; border: 3px solid #000000; padding: 6px; }
          @media print {
            body { max-width: 100%; width: 100%; padding: 2mm; font-weight: 900 !important; }
          }
        </style>
      </head>
      <body>
        <div class="center bold" style="font-size: 16px; text-transform: uppercase; font-weight: 900;">${storeTitle}</div>
        <div class="center bold" style="font-size: 11px; margin-top: 2px; font-weight: 900;">COMPROVANTE DE RETIRADA / PEDIDO</div>
        
        <div class="divider"></div>
        <div class="ticket-code">SENHA #${order.order_number}</div>

        <p><b class="bold">TIPO:</b> ${orderTypeLabel}</p>
        <p><b class="bold">DATA:</b> ${new Date(order.created_at || Date.now()).toLocaleString('pt-BR')}</p>
        <p><b class="bold">CLIENTE:</b> ${order.customer_name || 'Balcão / Loja'}</p>
        ${order.customer_phone ? `<p><b class="bold">WHATSAPP:</b> ${order.customer_phone}</p>` : ''}
        <p><b class="bold">FORMA PGTO:</b> ${paymentLabel}</p>
        
        <div class="divider"></div>
        <p class="bold" style="font-size: 13px;">ITENS DO PEDIDO:</p>
        <table>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div class="divider"></div>
        
        ${order.notes ? `<p><b class="bold">OBSERVAÇÕES:</b> ${order.notes}</p><div class="divider"></div>` : ''}
        
        ${order.discount && order.discount > 0 ? `
          <div style="font-size: 13px; font-weight: 900; text-align: right; margin-top: 4px;">SUBTOTAL: R$ ${(order.subtotal || 0).toFixed(2)}</div>
          <div style="font-size: 13px; font-weight: 900; text-align: right; margin-top: 2px;">DESCONTO: -R$ ${(order.discount).toFixed(2)}</div>
        ` : ''}
        <div class="total-box">VALOR TOTAL: R$ ${(order.total || 0).toFixed(2)}</div>
        
        <div class="divider"></div>
        <p class="center bold" style="font-size: 11px; margin-top: 10px;">Guarde este comprovante para retirar seu pedido.</p>
        <p class="center bold" style="font-size: 11px;">Obrigado pela preferência!</p>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.close();
            }, 300);
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
