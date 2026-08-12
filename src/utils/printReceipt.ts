import type { Order } from '../types';

export const printReceipt = (order: Order) => {
  const printWindow = window.open('', '_blank', 'width=450,height=650');
  if (!printWindow) return;

  const itemsHtml = (order.items || []).map(item => {
    const itemTotal = (item.total_price || item.unit_price * item.quantity).toFixed(2);
    return `
      <tr>
        <td className="col-qty-name" style="width: 68%; text-align: left; padding-right: 4px; word-wrap: break-word;">
          <b>${item.quantity}x</b> ${item.product_name}
        </td>
        <td className="col-price" style="width: 32%; text-align: right; white-space: nowrap; font-weight: bold;">
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
          }
          html, body {
            width: 100%;
            max-width: 72mm;
            margin: 0 auto;
            padding: 4mm 2mm;
            background: #ffffff;
            color: #000000;
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            line-height: 1.3;
          }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; table-layout: fixed; margin: 4px 0; }
          td { padding: 3px 0; vertical-align: top; }
          .total-box { font-size: 14px; font-weight: bold; text-align: right; margin-top: 6px; padding-top: 4px; border-top: 1px solid #000000; }
          .ticket-code { text-align: center; font-size: 20px; font-weight: bold; margin: 6px 0; border: 2px solid #000000; padding: 4px; }
          @media print {
            body { max-width: 100%; width: 100%; padding: 2mm; }
          }
        </style>
      </head>
      <body>
        <div className="center bold" style="font-size: 15px; text-transform: uppercase;">${storeTitle}</div>
        <div className="center" style="font-size: 10px; margin-top: 2px;">COMPROVANTE DE RETIRADA / PEDIDO</div>
        
        <div className="divider"></div>
        <div className="ticket-code">SENHA #${order.order_number}</div>

        <p><b>TIPO:</b> ${orderTypeLabel}</p>
        <p><b>DATA:</b> ${new Date(order.created_at || Date.now()).toLocaleString('pt-BR')}</p>
        <p><b>CLIENTE:</b> ${order.customer_name || 'Balcão / Loja'}</p>
        ${order.customer_phone ? `<p><b>WHATSAPP:</b> ${order.customer_phone}</p>` : ''}
        <p><b>FORMA PGTO:</b> ${paymentLabel}</p>
        
        <div className="divider"></div>
        <p className="bold">ITENS DO PEDIDO:</p>
        <table>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div className="divider"></div>
        
        ${order.notes ? `<p><b>OBSERVAÇÕES:</b> ${order.notes}</p><div className="divider"></div>` : ''}
        
        <div className="total-box">VALOR TOTAL: R$ ${(order.total || 0).toFixed(2)}</div>
        
        <div className="divider"></div>
        <p className="center" style="font-size: 10px; margin-top: 10px;">Guarde este comprovante para retirar seu pedido.</p>
        <p className="center bold" style="font-size: 10px;">Obrigado pela preferência!</p>
        
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
