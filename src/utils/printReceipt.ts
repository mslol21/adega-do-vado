import type { Order } from '../types';

export function parseMoneyValue(valStr: string): number {
  const clean = valStr.trim();
  if (clean.includes('.') && clean.includes(',')) {
    if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
      return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
    } else {
      return parseFloat(clean.replace(/,/g, ''));
    }
  }
  if (clean.includes(',')) {
    return parseFloat(clean.replace(',', '.'));
  }
  if (clean.includes('.')) {
    return parseFloat(clean);
  }
  return parseFloat(clean) || 0;
}

export const formatMoney = (val: number): string => {
  return (val || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const escapeHtml = (str: string): string => {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

export interface ProcessedReceiptItem {
  cleanName: string;
  qty: number;
  origUnitPrice: number;
  origTotal: number;
  discount: number;
  finalTotal: number;
  notes?: string;
}

export interface ProcessedReceiptSummary {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}

export function processReceiptData(order: Order): {
  items: ProcessedReceiptItem[];
  summary: ProcessedReceiptSummary;
} {
  const items = order.items || [];
  // Detects: (Desc: R$ 69.00), (Desc: R$ 69,00), (Desconto: R$ 69.00), [Desc: R$ 69.00], - Desc: R$ 69.00
  const descRegex = /\s*[\(\[]?\s*(?:-\s*)?Desc(?:onto)?\.?\s*:\s*R\$\s*([\d.,]+)\s*[\)\]]?/i;

  const preParsed = items.map(item => {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const rawUnitPrice = Number(item.unit_price) || 0;
    const rawTotalPrice = Number(item.total_price) || (rawUnitPrice * qty);

    let parsedDiscount = 0;
    let cleanName = item.product_name || '';

    const match = cleanName.match(descRegex);
    if (match) {
      parsedDiscount = parseMoneyValue(match[1]);
      cleanName = cleanName.replace(match[0], '').trim();
    } else if (item.options && typeof item.options === 'object') {
      const optDisc = Number((item.options as Record<string, unknown>).discount || (item.options as Record<string, unknown>).itemDiscount);
      if (!isNaN(optDisc) && optDisc > 0) parsedDiscount = optDisc;
    } else if (typeof (item as unknown as { discount?: number }).discount === 'number' && Number((item as unknown as { discount?: number }).discount) > 0) {
      parsedDiscount = Number((item as unknown as { discount?: number }).discount);
    }

    return {
      rawItem: item,
      qty,
      rawUnitPrice,
      rawTotalPrice,
      parsedDiscount,
      cleanName,
      notes: item.notes
    };
  });

  const sumRawTotal = preParsed.reduce((acc, i) => acc + i.rawTotalPrice, 0);
  const sumParsedDiscount = preParsed.reduce((acc, i) => acc + i.parsedDiscount, 0);
  const orderSubtotal = Number(order.subtotal) || 0;
  const orderTotal = Number(order.total) || 0;
  const orderDeliveryFee = Number(order.delivery_fee) || 0;
  const orderDiscount = Number(order.discount) || sumParsedDiscount;

  // Determine if rawTotalPrice across items is already NET:
  // In older orders, sumRawTotal matched orderTotal (after discount),
  // while orderSubtotal reflected the gross amount.
  const isRawNet = sumParsedDiscount > 0 &&
    orderSubtotal > 0 &&
    Math.abs(sumRawTotal - (orderTotal - orderDeliveryFee)) < 0.15 &&
    Math.abs(sumRawTotal - orderSubtotal) > 0.50;

  const processedItems: ProcessedReceiptItem[] = preParsed.map(item => {
    let origTotal = 0;
    let origUnitPrice = 0;
    let itemDiscount = item.parsedDiscount;
    let finalTotal = 0;

    if (itemDiscount > 0) {
      if (isRawNet) {
        finalTotal = item.rawTotalPrice;
        origTotal = finalTotal + itemDiscount;
        origUnitPrice = origTotal / item.qty;
      } else {
        origTotal = item.rawTotalPrice;
        origUnitPrice = item.rawUnitPrice > 0 ? item.rawUnitPrice : (origTotal / item.qty);
        // Ensure discount cannot exceed original total
        itemDiscount = Math.min(origTotal, itemDiscount);
        finalTotal = Math.max(0, origTotal - itemDiscount);
      }
    } else {
      origTotal = item.rawTotalPrice;
      origUnitPrice = item.rawUnitPrice > 0 ? item.rawUnitPrice : (origTotal / item.qty);
      itemDiscount = 0;
      finalTotal = origTotal;
    }

    return {
      cleanName: item.cleanName,
      qty: item.qty,
      origUnitPrice,
      origTotal,
      discount: itemDiscount,
      finalTotal,
      notes: item.notes
    };
  });

  const sumOrigTotal = processedItems.reduce((acc, i) => acc + i.origTotal, 0);
  const sumItemsDiscount = processedItems.reduce((acc, i) => acc + i.discount, 0);

  const displayDiscount = Math.max(orderDiscount, sumItemsDiscount);
  const displaySubtotal = orderSubtotal > 0
    ? Math.max(orderSubtotal, sumOrigTotal)
    : (sumOrigTotal || (orderTotal + displayDiscount - orderDeliveryFee));
  const displayTotal = orderTotal > 0
    ? orderTotal
    : (displaySubtotal - displayDiscount + orderDeliveryFee);

  return {
    items: processedItems,
    summary: {
      subtotal: displaySubtotal,
      discount: displayDiscount,
      deliveryFee: orderDeliveryFee,
      total: displayTotal
    }
  };
}

export const printReceipt = (order: Order) => {
  const printWindow = window.open('', '_blank', 'width=450,height=650');
  if (!printWindow) {
    alert('Por favor, permita pop-ups para imprimir o comprovante.');
    return;
  }

  const { items: processedItems, summary } = processReceiptData(order);

  const itemsHtml = processedItems.map(item => {
    const hasDiscount = item.discount > 0;

    return `
      <div class="item-block">
        <div class="item-name">${escapeHtml(item.cleanName)}</div>
        <div class="item-row">
          <span class="item-left">${item.qty} x R$ ${formatMoney(item.origUnitPrice)}</span>
          <span class="item-right">R$ ${formatMoney(item.origTotal)}</span>
        </div>
        ${hasDiscount ? `
          <div class="item-row item-discount">
            <span class="item-left">Desconto</span>
            <span class="item-right">-R$ ${formatMoney(item.discount)}</span>
          </div>
          <div class="item-row item-final">
            <span class="item-left">Valor final</span>
            <span class="item-right">R$ ${formatMoney(item.finalTotal)}</span>
          </div>
        ` : ''}
        ${item.notes ? `<div class="item-notes">Obs: ${escapeHtml(item.notes)}</div>` : ''}
      </div>
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
          p { margin: 4px 0; font-weight: 900 !important; font-size: 13px; }

          /* Lista de Itens */
          .items-container {
            margin: 4px 0;
          }
          .item-block {
            padding: 5px 0;
            border-bottom: 1px dashed #000000;
          }
          .item-block:last-child {
            border-bottom: none;
          }
          .item-name {
            font-size: 13px;
            font-weight: 900 !important;
            word-wrap: break-word;
            overflow-wrap: break-word;
            line-height: 1.3;
            margin-bottom: 2px;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-size: 12px;
            font-weight: 900 !important;
            line-height: 1.35;
          }
          .item-left {
            text-align: left;
            word-break: break-word;
            padding-right: 6px;
          }
          .item-right {
            text-align: right;
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
            margin-left: auto;
          }
          .item-discount {
            font-size: 12px;
          }
          .item-final {
            font-size: 13px;
            font-weight: 900 !important;
            margin-top: 1px;
          }
          .item-notes {
            font-size: 11px;
            font-style: italic;
            margin-top: 2px;
          }

          /* Resumo Financeiro */
          .summary-box {
            margin-top: 4px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
            font-size: 13px;
            font-weight: 900 !important;
            line-height: 1.4;
          }
          .summary-row span:last-child {
            white-space: nowrap;
            font-variant-numeric: tabular-nums;
            margin-left: auto;
            text-align: right;
          }
          .total-box {
            font-size: 16px;
            font-weight: 900 !important;
            padding-top: 4px;
          }
          .ticket-code {
            text-align: center;
            font-size: 24px;
            font-weight: 900 !important;
            margin: 8px 0;
            border: 3px solid #000000;
            padding: 6px;
          }
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
        <p><b class="bold">CLIENTE:</b> ${escapeHtml(order.customer_name || 'Balcão / Loja')}</p>
        ${order.customer_phone ? `<p><b class="bold">WHATSAPP:</b> ${escapeHtml(order.customer_phone)}</p>` : ''}
        <p><b class="bold">FORMA PGTO:</b> ${paymentLabel}</p>
        ${order.change_for && Number(order.change_for) > 0 ? `<p><b class="bold">TROCO PARA:</b> R$ ${formatMoney(Number(order.change_for))}</p>` : ''}
        
        <div class="divider"></div>
        <p class="bold" style="font-size: 13px;">ITENS DO PEDIDO:</p>
        <div class="items-container">
          ${itemsHtml}
        </div>
        
        <div class="divider"></div>
        
        ${order.notes ? `<p><b class="bold">OBSERVAÇÕES:</b> ${escapeHtml(order.notes)}</p><div class="divider"></div>` : ''}
        
        <div class="summary-box">
          ${summary.discount > 0 ? `
            <div class="summary-row">
              <span>SUBTOTAL:</span>
              <span>R$ ${formatMoney(summary.subtotal)}</span>
            </div>
            <div class="summary-row">
              <span>DESCONTO:</span>
              <span>-R$ ${formatMoney(summary.discount)}</span>
            </div>
          ` : ''}
          ${summary.deliveryFee > 0 ? `
            <div class="summary-row">
              <span>TAXA ENTREGA:</span>
              <span>R$ ${formatMoney(summary.deliveryFee)}</span>
            </div>
          ` : ''}
          ${summary.discount > 0 || summary.deliveryFee > 0 ? `<div class="divider"></div>` : ''}
          <div class="summary-row total-box">
            <span>VALOR TOTAL:</span>
            <span>R$ ${formatMoney(summary.total)}</span>
          </div>
        </div>
        
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
