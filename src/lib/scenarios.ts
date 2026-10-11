/**
 * Cenários didáticos de comunicação com HMAC, descritos como diagramas de
 * sequência. Cada cenário é uma lista ordenada de elementos renderizados
 * pelo componente SequenceDiagram.
 */

export type SeqElement =
  | { type: 'msg'; from: string; to: string; label: string; kind?: 'sync' | 'return' | 'crypto' }
  | { type: 'self'; actor: string; label: string }
  | { type: 'note'; actor: string; text: string }
  | { type: 'divider'; label: string }

export interface Scenario {
  id: string
  label: string
  title: string
  intro: string
  actors: { id: string; label: string }[]
  elements: SeqElement[]
  /** Explicação passo a passo exibida abaixo do diagrama */
  steps: string[]
  takeaway: string
}

export const SCENARIOS: Scenario[] = [
  {
    id: 'api-signing',
    label: 'API assinada',
    title: 'Requisição de API assinada com HMAC (estilo AWS SigV4 / API key + secret)',
    intro:
      'Cliente e servidor compartilham um segredo provisionado out-of-band. A cada chamada, o cliente monta uma string canônica da requisição, assina com HMAC e envia o MAC junto — o servidor repete o cálculo e compara.',
    actors: [
      { id: 'client', label: 'Cliente' },
      { id: 'server', label: 'Servidor de API' },
    ],
    elements: [
      { type: 'divider', label: 'Provisionamento (out-of-band)' },
      { type: 'self', actor: 'server', label: 'gera api_key + api_secret' },
      { type: 'msg', from: 'server', to: 'client', label: 'entrega api_secret por canal seguro (portal, cofre)', kind: 'crypto' },
      { type: 'divider', label: 'Requisição assinada' },
      { type: 'self', actor: 'client', label: 'monta string canônica: método + path + timestamp + hash(body)' },
      { type: 'self', actor: 'client', label: 'signature = HMAC-SHA256(api_secret, stringCanônica)' },
      { type: 'msg', from: 'client', to: 'server', label: 'POST /v1/recurso · X-Api-Key, X-Timestamp, X-Signature', kind: 'sync' },
      { type: 'self', actor: 'server', label: 'busca api_secret pela api_key' },
      { type: 'self', actor: 'server', label: 'refaz string canônica e calcula HMAC esperado' },
      { type: 'self', actor: 'server', label: 'compara em tempo constante + valida janela do timestamp' },
      { type: 'msg', from: 'server', to: 'client', label: '200 OK — requisição autêntica e íntegra', kind: 'return' },
    ],
    steps: [
      'O segredo (`api_secret`) é entregue uma única vez por canal seguro — nunca trafega nas requisições.',
      'O cliente canoniza a requisição: método HTTP, caminho, query ordenada, timestamp e hash do corpo. Sem canonização, dois lados calculam strings diferentes.',
      'O MAC é enviado em header (`X-Signature`, `Authorization`), junto com `X-Timestamp` e a chave pública `X-Api-Key` que identifica qual segredo usar.',
      'O servidor recalcula o HMAC sobre a mesma string canônica e compara em **tempo constante** — comparar com `==` vaza quantos bytes bateram.',
      'O timestamp limita a janela de validade e inibe replay simples; um nonce único bloqueia replay dentro da janela.',
    ],
    takeaway:
      'O segredo nunca trafega: apenas o MAC viaja. Quem não conhece o segredo não consegue forjar uma assinatura válida.',
  },
  {
    id: 'webhook',
    label: 'Webhook verificado',
    title: 'Webhook com assinatura HMAC (GitHub X-Hub-Signature-256 / Stripe)',
    intro:
      'No webhook o fluxo se inverte: quem assina é o provedor, e o seu servidor é quem verifica. O segredo do webhook é cadastrado no painel do provedor.',
    actors: [
      { id: 'admin', label: 'Você (admin)' },
      { id: 'provider', label: 'Provedor (GitHub/Stripe)' },
      { id: 'receiver', label: 'Seu endpoint /webhook' },
    ],
    elements: [
      { type: 'divider', label: 'Configuração' },
      { type: 'msg', from: 'admin', to: 'provider', label: 'cadastra URL do webhook + webhook_secret', kind: 'sync' },
      { type: 'msg', from: 'admin', to: 'receiver', label: 'configura o mesmo webhook_secret no servidor', kind: 'crypto' },
      { type: 'divider', label: 'Evento entregue' },
      { type: 'self', actor: 'provider', label: 'sig = HMAC-SHA256(webhook_secret, rawBody)' },
      { type: 'msg', from: 'provider', to: 'receiver', label: 'POST /webhook · X-Hub-Signature-256: sha256=<sig> + body', kind: 'sync' },
      { type: 'self', actor: 'receiver', label: 'lê o corpo CRU (antes de fazer parse do JSON)' },
      { type: 'self', actor: 'receiver', label: 'esperado = HMAC-SHA256(webhook_secret, rawBody)' },
      { type: 'self', actor: 'receiver', label: 'timingSafeEqual(esperado, recebido)' },
      { type: 'msg', from: 'receiver', to: 'provider', label: '200 OK — evento aceito e enfileirado', kind: 'return' },
      { type: 'self', actor: 'receiver', label: 'processa o evento de forma assíncrona' },
    ],
    steps: [
      'O `webhook_secret` é criado no painel do provedor e copiado para o seu servidor — canal seguro, uma única vez.',
      'O provedor assina o **corpo cru** da requisição. Se o seu framework fizer parse do JSON antes, a resserialização pode mudar espaços/ordem e quebrar a assinatura — erro clássico.',
      'O header leva o MAC com prefixo do algoritmo (`sha256=...`), permitindo rotação de algoritmo sem quebrar clientes.',
      'Comparação sempre em tempo constante. Muitos provedores também incluem timestamp no conteúdo assinado (ex.: Stripe `t=...,v1=...`) contra replay.',
      'Responda rápido (2xx) e processe depois: webhooks têm timeout curto e reenvios geram duplicidade — use idempotência.',
    ],
    takeaway:
      'O HMAC garante que o POST veio do provedor e que o payload não foi alterado em trânsito — sem o segredo, ninguém forja um evento.',
  },
  {
    id: 'jwt-hs256',
    label: 'JWT HS256',
    title: 'JWT assinado com HMAC-SHA256 (HS256)',
    intro:
      'No JWS com algoritmo HS256, a assinatura é justamente um HMAC sobre `base64url(header) "." base64url(payload)`. Emissor e verificador precisam do mesmo segredo.',
    actors: [
      { id: 'user', label: 'Usuário' },
      { id: 'issuer', label: 'Servidor de Auth' },
      { id: 'api', label: 'API protegida' },
    ],
    elements: [
      { type: 'msg', from: 'user', to: 'issuer', label: 'login (usuário + senha)', kind: 'sync' },
      { type: 'self', actor: 'issuer', label: 'signing_input = b64url(header) + "." + b64url(payload)' },
      { type: 'self', actor: 'issuer', label: 'signature = HMAC-SHA256(secret, signing_input)' },
      { type: 'msg', from: 'issuer', to: 'user', label: 'token = signing_input + "." + b64url(signature)', kind: 'return' },
      { type: 'msg', from: 'user', to: 'api', label: 'GET /dados · Authorization: Bearer <token>', kind: 'sync' },
      { type: 'self', actor: 'api', label: 'recalcula HMAC-SHA256(secret, signing_input recebido)' },
      { type: 'self', actor: 'api', label: 'compara assinatura + valida claims (exp, iss, aud)' },
      { type: 'msg', from: 'api', to: 'user', label: '200 OK — recurso autorizado', kind: 'return' },
    ],
    steps: [
      'Após o login, o emissor monta `header.payload` em base64url e calcula o HMAC com o segredo do servidor.',
      'O token é só `b64url(header).b64url(payload).b64url(hmac)` — qualquer um lê o payload; só quem tem o segredo gera/valida a assinatura.',
      'Na verificação, a API recalcula o HMAC sobre as duas primeiras partes **como recebidas** e compara com a terceira.',
      'Alterar qualquer byte do payload (ex.: `"role":"user"` → `"admin"`) invalida o MAC — é a integridade do HMAC protegendo o token.',
      'Cuidado clássico: aceitar `alg=none` ou deixar o algoritmo ser escolhido pelo atacante. Sempre fixe a lista de algoritmos permitidos no verificador.',
    ],
    takeaway:
      'HS256 é HMAC: a mesma verificação de MAC que você testa nesta aba é o que protege cada JWT simétrico.',
  },
  {
    id: 'tampered',
    label: 'Mensagem adulterada',
    title: 'Verificação falhando: mensagem alterada em trânsito',
    intro:
      'Um atacante intercepta a requisição e altera um campo (ex.: o valor de uma transferência). Sem conhecer o segredo, o MAC que ele monta — ou o MAC antigo que ele reaproveita — não confere.',
    actors: [
      { id: 'client', label: 'Cliente' },
      { id: 'attacker', label: 'Atacante (MITM)' },
      { id: 'server', label: 'Servidor' },
    ],
    elements: [
      { type: 'self', actor: 'client', label: 'sig = HMAC(secret, "valor=100;destino=A")' },
      { type: 'msg', from: 'client', to: 'attacker', label: 'POST valor=100&destino=A · X-Signature: <sig>', kind: 'sync' },
      { type: 'self', actor: 'attacker', label: 'adultera: valor=100 → valor=9000' },
      { type: 'note', actor: 'attacker', text: 'sem o segredo, não consegue gerar MAC válido para a nova mensagem' },
      { type: 'msg', from: 'attacker', to: 'server', label: 'POST valor=9000&destino=A · X-Signature: <sig original>', kind: 'sync' },
      { type: 'self', actor: 'server', label: 'esperado = HMAC(secret, "valor=9000;destino=A")' },
      { type: 'self', actor: 'server', label: 'timingSafeEqual(esperado, recebido) → FALHOU' },
      { type: 'msg', from: 'server', to: 'attacker', label: '401 Unauthorized — assinatura inválida', kind: 'return' },
      { type: 'self', actor: 'server', label: 'registra tentativa + alerta (auditoria)' },
    ],
    steps: [
      'O cliente assina a mensagem original e envia `mensagem + MAC`.',
      'O atacante altera a mensagem, mas precisaria do segredo para gerar um novo MAC — e o HMAC não revela a chave.',
      'Reaproveitar o MAC antigo também falha: o servidor recalcula o HMAC sobre a mensagem **recebida** (já adulterada), e os valores divergem.',
      'O servidor rejeita com erro genérico (401/403) sem dizer o que falhou — informação demais ajudaria o atacante.',
      'Em produção, registre a tentativa: divergências de MAC são sinal de adulteração ou de cliente mal configurado.',
    ],
    takeaway:
      'Integridade = qualquer alteração, de um único bit, produz um MAC completamente diferente (efeito avalanche).',
  },
  {
    id: 'replay',
    label: 'Replay attack',
    title: 'Replay attack: MAC válido reenviado (e como timestamp + nonce bloqueiam)',
    intro:
      'O HMAC protege integridade e autenticidade, mas não impede que uma mensagem **válida** seja capturada e reenviada. A defesa é contextual: timestamp com janela e nonce descartável.',
    actors: [
        { id: 'client', label: 'Cliente' },
      { id: 'attacker', label: 'Atacante' },
      { id: 'server', label: 'Servidor' },
    ],
    elements: [
      { type: 'divider', label: 'Cenário 1 — sem proteção contra replay' },
      { type: 'msg', from: 'client', to: 'attacker', label: 'POST /pagar?valor=100 · X-Signature: <sig válida>', kind: 'sync' },
      { type: 'msg', from: 'attacker', to: 'server', label: 'reencaminha (pagamento legítimo executado)', kind: 'sync' },
      { type: 'msg', from: 'attacker', to: 'server', label: 'REPLAY: reenvia a mesma requisição idêntica', kind: 'sync' },
      { type: 'self', actor: 'server', label: 'HMAC confere → aceita de novo (pagamento duplicado!)' },
      { type: 'divider', label: 'Cenário 2 — timestamp + nonce' },
      { type: 'msg', from: 'client', to: 'attacker', label: 'POST /pagar · ts=1690000000, nonce=af81 · sig = HMAC(secret, ts+nonce+body)', kind: 'crypto' },
      { type: 'msg', from: 'attacker', to: 'server', label: 'reencaminha — MAC confere, ts na janela, nonce novo → aceito', kind: 'sync' },
      { type: 'msg', from: 'attacker', to: 'server', label: 'REPLAY: mesma requisição (mesmo ts + mesmo nonce)', kind: 'sync' },
      { type: 'self', actor: 'server', label: 'nonce já visto no cache → 409 rejeitado (ou ts fora da janela → 401)' },
    ],
    steps: [
      'MAC válido só prova que a mensagem é autêntica e íntegra — não que ela é **nova**.',
      'Sem replay protection, o atacante nem precisa entender o conteúdo: basta reenviar os bytes.',
      'Defesa em camadas: o **timestamp** entra no conteúdo assinado e o servidor só aceita uma janela (ex.: ±5 min).',
      'O **nonce** (número usado uma vez) é guardado em cache pelo tempo da janela: reenvio idêntico é detectado.',
      'Alternativa ou complemento: idempotency-key no nível da aplicação e TLS (que já protege contra captura em trânsito, mas não contra um cliente legítimo repetindo a chamada).',
    ],
    takeaway:
      'HMAC responde "esta mensagem é autêntica?". Para "esta mensagem é nova?", acrescente timestamp, nonce ou contador dentro do conteúdo assinado.',
  },
  {
    id: 'key-exchange',
    label: 'Distribuição de chave',
    title: 'Negociação e provisionamento do segredo compartilhado',
    intro:
      'HMAC é criptografia simétrica: os dois lados precisam do MESMO segredo antes de qualquer mensagem. O segredo nunca é enviado junto com os dados — é distribuído por um canal seguro separado.',
    actors: [
      { id: 'admin', label: 'Administrador' },
      { id: 'portal', label: 'Portal / KMS do provedor' },
      { id: 'client', label: 'Aplicação cliente' },
      { id: 'server', label: 'Servidor' },
    ],
    elements: [
      { type: 'msg', from: 'admin', to: 'portal', label: 'solicita credenciais de API', kind: 'sync' },
      { type: 'self', actor: 'portal', label: 'gera api_key (identificador público) + api_secret (CSPRNG, ≥ 256 bits)' },
      { type: 'msg', from: 'portal', to: 'server', label: 'armazena api_key → api_secret no backend', kind: 'crypto' },
      { type: 'msg', from: 'portal', to: 'admin', label: 'exibe api_secret UMA única vez', kind: 'return' },
      { type: 'msg', from: 'admin', to: 'client', label: 'provisiona api_secret via variável de ambiente / cofre de segredos', kind: 'crypto' },
      { type: 'divider', label: 'Operação normal' },
      { type: 'msg', from: 'client', to: 'server', label: 'requisições com HMAC usando api_secret (que nunca trafega)', kind: 'sync' },
      { type: 'divider', label: 'Rotação' },
      { type: 'msg', from: 'admin', to: 'portal', label: 'rotaciona segredo (vaza? política? saída de funcionário?)', kind: 'sync' },
      { type: 'self', actor: 'portal', label: 'emite novo secret; mantém o antigo válido por janela de transição' },
      { type: 'msg', from: 'portal', to: 'server', label: 'aceita 2 segredos durante a janela (verifica contra ambos)', kind: 'crypto' },
      { type: 'msg', from: 'admin', to: 'client', label: 'atualiza o segredo no cliente antes do fim da janela', kind: 'crypto' },
    ],
    steps: [
      'O segredo nasce no provedor (ou em um KMS/HSM) com entropia real — nada de senha memorável.',
      'A entrega usa canal separado do tráfego dos dados: painel web, cofre de segredos, variável de ambiente, provisionador.',
      'O `api_key` público identifica qual segredo usar — assim o servidor suporta milhares de clientes e rotação de chaves.',
      'Rotação sem downtime: o servidor aceita o segredo antigo e o novo por uma janela; o cliente migra e o antigo é revogado.',
      'Nunca exponha o segredo: nada de segredo em URL, log, front-end público ou repositório git.',
    ],
    takeaway:
      'A segurança do HMAC está toda no sigilo e na entropia da chave — o protocolo de distribuição é a parte frágil.',
  },
]
