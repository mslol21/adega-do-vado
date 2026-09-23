# Correção de pedidos sem implantação de Supabase Auth

## Ordem de publicação

1. Revisar e aprovar `supabase/migrations/003_atomic_order_operations.sql`.
2. Aplicar essa migração no projeto `ksabsgoaofxuqkdxnblp` (Adega do Vado).
3. Confirmar a disponibilidade de `save_order_atomic` na API.
4. Somente então integrar esta branch na `main` e publicar o frontend.

**Não publicar o frontend antes da migração.** Ele exige a nova função para criar, editar e cancelar pedidos. Não há fallback para a gravação antiga, que poderia confirmar pedidos incompletos.

A revisão automática bloqueou a execução da migração e dos testes no banco de produção. Até a aprovação específica do responsável, a migração permanece apenas no repositório. Os testes executados usam PostgreSQL isolado em memória, sem credenciais de produção.

## Comportamento

- Pedido, itens, histórico e estoque são alterados na mesma transação.
- Endereço, complemento, troco e pagamento são preservados.
- Os totais são recalculados a partir dos itens; preços especiais continuam disponíveis.
- Estoque é agrupado por produto, incluindo sabores diferentes do mesmo produto.
- Edições ajustam apenas a diferença de estoque. Cancelamentos devolvem estoque uma vez; pedidos cancelados não podem ser reabertos.
- Edições concorrentes usam `updated_at` para rejeitar uma tela desatualizada.
- Repetir a criação com o mesmo UUID retorna o pedido existente. O cliente mantém esse UUID para repetir a mesma tentativa após falha de comunicação.
- Erros mantêm o carrinho e os formulários; não há confirmação automática nem envio ao WhatsApp após falha.
- A lista operacional usa o banco como fonte; antigos pedidos somente em cache não são promovidos a vendas confirmadas. O cache antigo permanece no dispositivo para eventual conciliação manual.
- Carrinhos são separados por loja. O antigo carrinho compartilhado permanece no armazenamento, mas não é importado automaticamente para evitar misturar produtos das lojas.

## Limites de segurança mantidos por decisão do responsável

Esta alteração não implementa Supabase Auth, nem modifica as políticas RLS ou o login por PIN. A função usa **SECURITY INVOKER**, sem elevar privilégios. Ela permite execução a `anon` e `authenticated` para manter o funcionamento atual; as permissões de escrita pública já existentes continuam sendo um risco. Os valores de preços especiais são aceitos do cliente, portanto esta função não deve ser apresentada como proteção contra manipulação de preços.

Antes de considerar o sistema seguro, implantar autenticação e autorização no servidor, restringir as gravações diretas e separar o checkout público das operações internas.

## Testes reproduzíveis

```sh
npm ci
npm run lint
npm run build
node scripts/test-order-attempt.mjs
npm install --prefix ../adega-db-test @electric-sql/pglite@0.5.8
node scripts/test-orders.mjs
```

O último teste monta um banco isolado com as tabelas de pedidos do projeto e as permissões relevantes observadas, instala a função e executa `supabase/tests/order_atomic.sql`. As fixtures são revertidas ao final. Não é um teste de integração com o Supabase publicado.

Casos cobertos: endereço e troco, totais, múltiplos sabores, reenvio idempotente, edição com ajuste de estoque, edição desatualizada, cancelamento repetido, estoque insuficiente e rollback após erro tardio.

Ainda necessário após a publicação: conferir um pedido real autorizado no catálogo e no painel, o recibo e o fluxo de entrega; medir o desempenho no celular. Não apagar pedidos antigos em cache ou tentar reconciliá-los automaticamente.
