---
trigger: always_on
---

# Diretrizes de segurança do backend Rapport Cripto Chat

Regras obrigatórias para toda alteração no backend do Rapport Cripto Chat. Agentes (Windsurf, Devin ou outro) devem seguir este documento antes de tocar em autenticação, relay, banco de dados, variáveis de ambiente, logs ou deploy.

## 1. Segredos

- `RELAYER_PRIVATE_KEY`, `SERVER_ENCRYPTION_PRIVATE_KEY`, `RESPONSE_SIGNING_KEY`, `POSTGRES_PASSWORD` e `GOOGLE_CLIENT_SECRET` devem ficar apenas em `.env` e nos Secrets da Vercel.
- Nunca commitar `.env`, `.env.local` ou arquivos `*.key`.
- Nunca expor segredos em logs, mensagens de erro, respostas da API ou documentação.
- `.env.example` deve conter apenas placeholders.
- Ao ler segredos, usar `process.env.VAR_NAME`; nunca hardcode.

## 2. Autenticação e autorização

- Todo payload financeiro deve ser assinado pelo usuário (EIP-191) e cifrado com ECIES usando a chave pública do servidor.
- O backend deve validar a assinatura, `chainId`, `nonce` único e `timestamp` dentro da janela permitida.
- Respostas devem ser assinadas pelo servidor (`RESPONSE_SIGNING_KEY`) para o dApp validar.
- Endpoints administrativos exigem autenticação federada (Google) com sessão válida.

## 3. Validação de entrada

- Usar `zod` para validar todo payload.
- Rejeitar endereços não normalizados (`getAddress`), nonces duplicados e chainIds inválidos.
- Sanitizar qualquer string que vá para logs ou banco.

## 4. Relay de pagamentos

- Verificar `relayed_payments.nonce` antes de enviar qualquer transação.
- Verificar se o relayer possui saldo de POL suficiente antes do `relay`.
- Esperar 1 confirmação e só então marcar `CONFIRMED` no banco.
- Em caso de falha de rede, não reenviar automaticamente sem verificar o nonce.
- Nunca logar a `RELAYER_PRIVATE_KEY` ou a assinatura completa do usuário.

## 5. Logs

- Usar o formato estruturado `[YYYY-MM-DD HH:MM:SS] [file:function:line] level message - {requestId, safeParams}`.
- Nunca logar assinaturas completas, chaves privadas, senhas, tokens ou PII.
- Incluir `requestId` em toda cadeia de chamadas para rastreabilidade.

## 6. Banco de dados

- Acessar o PostgreSQL apenas do servidor com `POSTGRES_URL`/`POSTGRES_PRISMA_URL`.
- Nunca executar queries concatenadas; usar prepared statements / cliente tipado.
- Truncar nomes longos e validar UUIDs antes de usá-los em chaves primárias.

## 7. Comunicação

- TLS 1.3 obrigatório.
- HSTS e certificado fixo.
- CORS restrito ao domínio do dApp.
- Resposta padrão do servidor assinada para evitar tampering.

## 8. Resposta padrão

- Todo endpoint retorna `{ code, message, data?, details?, next_step }`.
- Erros nunca incluem stack trace, trechos de código ou detalhes de infraestrutura.
- Mensagens não revelam se um endereço ou nonce existe no banco.

## 9. Deploy

- Antes de publicar, executar `npm run typecheck` e `npm run test`.
- Verificar se `.env` e `.env.local` estão no `.gitignore`.
- Sincronizar os Secrets da Vercel antes do primeiro deploy.
- Nunca fazer deploy com chaves de teste em produção.

