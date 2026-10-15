import assert from 'node:assert/strict';
import { processReceiptData, formatMoney, parseMoneyValue } from '../src/utils/printReceipt.ts';

console.log('=== INICIANDO TESTES DO COMPROVANTE DE VENDA ===');

// 1. Teste de funções auxiliares de dinheiro
assert.equal(parseMoneyValue('69.00'), 69);
assert.equal(parseMoneyValue('69,00'), 69);
assert.equal(parseMoneyValue('18.50'), 18.5);
assert.equal(parseMoneyValue('18,50'), 18.5);
assert.equal(parseMoneyValue('1.250,50'), 1250.5);
assert.equal(formatMoney(25), '25,00');
assert.equal(formatMoney(69), '69,00');
assert.equal(formatMoney(160.5), '160,50');
assert.equal(formatMoney(552), '552,00');
console.log('✓ Funções auxiliares de valores monetários: OK');

// 2. Teste 1: Venda sem desconto
const orderSemDesconto = {
  id: 'order-1',
  store_id: 'tabacaria',
  order_number: 101,
  source: 'INTERNO',
  order_type: 'BALCAO',
  status: 'CONCLUIDO',
  subtotal: 48.00,
  delivery_fee: 0,
  discount: 0,
  total: 48.00,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  items: [
    {
      id: 'item-1',
      order_id: 'order-1',
      product_name: 'Cerveja Corona 330ml',
      quantity: 4,
      unit_price: 12.00,
      total_price: 48.00
    }
  ]
};

const res1 = processReceiptData(orderSemDesconto);
assert.equal(res1.items.length, 1);
assert.equal(res1.items[0].cleanName, 'Cerveja Corona 330ml');
assert.equal(res1.items[0].qty, 4);
assert.equal(res1.items[0].origUnitPrice, 12.00);
assert.equal(res1.items[0].origTotal, 48.00);
assert.equal(res1.items[0].discount, 0);
assert.equal(res1.items[0].finalTotal, 48.00);
assert.equal(res1.summary.subtotal, 48.00);
assert.equal(res1.summary.discount, 0);
assert.equal(res1.summary.total, 48.00);
console.log('✓ 1. Teste de venda sem desconto: OK');

// 3. Teste 2: Venda com desconto individual
const orderDescontoIndividual = {
  id: 'order-2',
  store_id: 'tabacaria',
  order_number: 102,
  source: 'INTERNO',
  order_type: 'BALCAO',
  status: 'CONCLUIDO',
  subtotal: 150.00,
  delivery_fee: 0,
  discount: 69.00,
  total: 81.00,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  items: [
    {
      id: 'item-2',
      order_id: 'order-2',
      product_name: 'Isqueiro Maçarico Colecionável Sadhu (Desc: R$ 69.00)',
      quantity: 6,
      unit_price: 25.00,
      total_price: 150.00
    }
  ]
};

const res2 = processReceiptData(orderDescontoIndividual);
assert.equal(res2.items.length, 1);
assert.equal(res2.items[0].cleanName, 'Isqueiro Maçarico Colecionável Sadhu');
assert.equal(res2.items[0].qty, 6);
assert.equal(res2.items[0].origUnitPrice, 25.00);
assert.equal(res2.items[0].origTotal, 150.00);
assert.equal(res2.items[0].discount, 69.00);
assert.equal(res2.items[0].finalTotal, 81.00);
assert.equal(res2.summary.subtotal, 150.00);
assert.equal(res2.summary.discount, 69.00);
assert.equal(res2.summary.total, 81.00);
// Conferência matemática
assert.equal(res2.items[0].origTotal - res2.items[0].discount, res2.items[0].finalTotal);
assert.equal(res2.summary.subtotal - res2.summary.discount, res2.summary.total);
console.log('✓ 2. Teste de venda com desconto individual: OK');

// 4. Teste 3: Venda com vários produtos e descontos diferentes (Exemplo completo do usuário)
const orderMultiplosProdutos = {
  id: 'order-3',
  store_id: 'tabacaria',
  order_number: 103,
  source: 'INTERNO',
  order_type: 'BALCAO',
  status: 'CONCLUIDO',
  subtotal: 552.00,
  delivery_fee: 0,
  discount: 160.50,
  total: 391.50,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  items: [
    {
      id: 'item-3a',
      order_id: 'order-3',
      product_name: 'Isqueiro Maçarico Colecionável Sadhu (Desc: R$ 69.00)',
      quantity: 6,
      unit_price: 25.00,
      total_price: 150.00
    },
    {
      id: 'item-3b',
      order_id: 'order-3',
      product_name: 'Case SADHU Tamanho médio (Desc: R$ 54.00)',
      quantity: 2,
      unit_price: 70.00,
      total_price: 140.00
    },
    {
      id: 'item-3c',
      order_id: 'order-3',
      product_name: 'Seda Raw Black King Size (Desc: R$ 37.50)',
      quantity: 10,
      unit_price: 15.00,
      total_price: 150.00
    },
    {
      id: 'item-3d',
      order_id: 'order-3',
      product_name: 'Cinzeiro de Silicone Sadhu',
      quantity: 2,
      unit_price: 56.00,
      total_price: 112.00
    }
  ]
};

const res3 = processReceiptData(orderMultiplosProdutos);
assert.equal(res3.items.length, 4);

// Item 1
assert.equal(res3.items[0].cleanName, 'Isqueiro Maçarico Colecionável Sadhu');
assert.equal(res3.items[0].qty, 6);
assert.equal(res3.items[0].origUnitPrice, 25.00);
assert.equal(res3.items[0].origTotal, 150.00);
assert.equal(res3.items[0].discount, 69.00);
assert.equal(res3.items[0].finalTotal, 81.00);

// Item 2
assert.equal(res3.items[1].cleanName, 'Case SADHU Tamanho médio');
assert.equal(res3.items[1].qty, 2);
assert.equal(res3.items[1].origUnitPrice, 70.00);
assert.equal(res3.items[1].origTotal, 140.00);
assert.equal(res3.items[1].discount, 54.00);
assert.equal(res3.items[1].finalTotal, 86.00);

// Item 3
assert.equal(res3.items[2].cleanName, 'Seda Raw Black King Size');
assert.equal(res3.items[2].qty, 10);
assert.equal(res3.items[2].origUnitPrice, 15.00);
assert.equal(res3.items[2].origTotal, 150.00);
assert.equal(res3.items[2].discount, 37.50);
assert.equal(res3.items[2].finalTotal, 112.50);

// Item 4 (sem desconto)
assert.equal(res3.items[3].cleanName, 'Cinzeiro de Silicone Sadhu');
assert.equal(res3.items[3].qty, 2);
assert.equal(res3.items[3].origUnitPrice, 56.00);
assert.equal(res3.items[3].origTotal, 112.00);
assert.equal(res3.items[3].discount, 0);
assert.equal(res3.items[3].finalTotal, 112.00);

// Resumo financeiro dinâmico
assert.equal(res3.summary.subtotal, 552.00);
assert.equal(res3.summary.discount, 160.50);
assert.equal(res3.summary.total, 391.50);

// Consistência matemática estrita
const sumOrig = res3.items.reduce((s, i) => s + i.origTotal, 0);
const sumDesc = res3.items.reduce((s, i) => s + i.discount, 0);
const sumFinal = res3.items.reduce((s, i) => s + i.finalTotal, 0);
assert.equal(sumOrig, 552.00);
assert.equal(sumDesc, 160.50);
assert.equal(sumFinal, 391.50);
assert.equal(sumOrig - sumDesc, sumFinal);
console.log('✓ 3. Teste com múltiplos produtos e descontos variados: OK');

// 5. Teste 4: Nomes longos e quantidades altas
const orderNomeLongo = {
  id: 'order-4',
  store_id: 'tabacaria',
  order_number: 104,
  source: 'INTERNO',
  order_type: 'BALCAO',
  status: 'CONCLUIDO',
  subtotal: 1250.00,
  delivery_fee: 0,
  discount: 250.00,
  total: 1000.00,
  items: [
    {
      id: 'item-4',
      order_id: 'order-4',
      product_name: 'Narguilé Completo Edição Especial Limitada Alumínio Aeronáutico Dourado com Prato Gravado e Vaso de Cristal 35cm (Desc: R$ 250.00)',
      quantity: 5,
      unit_price: 250.00,
      total_price: 1250.00
    }
  ]
};

const res4 = processReceiptData(orderNomeLongo);
assert.equal(res4.items[0].cleanName, 'Narguilé Completo Edição Especial Limitada Alumínio Aeronáutico Dourado com Prato Gravado e Vaso de Cristal 35cm');
assert.equal(res4.items[0].qty, 5);
assert.equal(res4.items[0].origUnitPrice, 250.00);
assert.equal(res4.items[0].origTotal, 1250.00);
assert.equal(res4.items[0].discount, 250.00);
assert.equal(res4.items[0].finalTotal, 1000.00);
console.log('✓ 4. Teste de nomes longos e quantidades superiores a 1: OK');

// 6. Teste 5: Pedido histórico com itens salvos líquidos no banco (não duplica desconto)
const orderHistoricoNet = {
  id: 'order-5',
  store_id: 'tabacaria',
  order_number: 26,
  source: 'INTERNO',
  order_type: 'BALCAO',
  status: 'CONCLUIDO',
  subtotal: 703.00,
  discount: 68.00,
  total: 635.00,
  delivery_fee: 0,
  items: [
    { product_name: 'Taxa motoboy ', quantity: 1, unit_price: 10, total_price: 10 },
    { product_name: 'Essência ziggy Pac com 10 ', quantity: 2, unit_price: 80, total_price: 160 },
    { product_name: 'Seda Zomo Alfalfa Diplay com 50 (Desc: R$ 5.00)', quantity: 1, unit_price: 60, total_price: 60 },
    { product_name: 'Narguilé Karavela (Desc: R$ 45.00)', quantity: 3, unit_price: 110, total_price: 330 },
    { product_name: 'Seda Zomo prata slim display com 25', quantity: 1, unit_price: 23, total_price: 23 },
    { product_name: 'Carvão fumax 1 kg  (Desc: R$ 18.00)', quantity: 2, unit_price: 26, total_price: 52 }
  ]
};

const res5 = processReceiptData(orderHistoricoNet);
assert.equal(res5.items[2].origTotal, 65.00); // 60 + 5
assert.equal(res5.items[2].discount, 5.00);
assert.equal(res5.items[2].finalTotal, 60.00);

assert.equal(res5.items[3].origTotal, 375.00); // 330 + 45
assert.equal(res5.items[3].origUnitPrice, 125.00); // 375 / 3
assert.equal(res5.items[3].discount, 45.00);
assert.equal(res5.items[3].finalTotal, 330.00);

assert.equal(res5.items[5].origTotal, 70.00); // 52 + 18
assert.equal(res5.items[5].origUnitPrice, 35.00); // 70 / 2
assert.equal(res5.items[5].discount, 18.00);
assert.equal(res5.items[5].finalTotal, 52.00);

assert.equal(res5.summary.subtotal, 703.00);
assert.equal(res5.summary.discount, 68.00);
assert.equal(res5.summary.total, 635.00);
console.log('✓ 5. Teste de não duplicação de desconto (dados líquidos): OK');

console.log('=== TODOS OS TESTES DO COMPROVANTE FORAM APROVADOS COM SUCESSO! ===');
