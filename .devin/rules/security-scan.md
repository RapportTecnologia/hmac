---
trigger: model_decision
description: Análise obrigatória de segurança em toda alteração de código, buscando backdoors, códigos maliciosos e falhas sistêmicas que possam vazar dados sensíveis, com geração de relatório em docs/secure-tests/.
---

# Security Scan Rule

Toda alteração de código, configuração, dependência ou script de deploy deve passar por uma análise de segurança completa antes de ser considerada concluída. O objetivo é detectar backdoors, códigos maliciosos, falhas sistêmicas e vazamentos de dados sensíveis.

## 1. Quando executar

- Sempre que arquivos fonte (`src/`, `app/`, `smartcontracts/`, testes, scripts) forem criados, alterados ou movidos.
- Sempre que dependências forem adicionadas, removidas ou atualizadas (`package.json`, `package-lock.json`, `requirements.txt`, `Cargo.toml`, etc.).
- Sempre que arquivos de configuração, CI/CD, Docker, infra ou deploy forem alterados (`.github/`, `eas.json`, `metro.config.js`, Dockerfiles, scripts de deploy).
- Sempre que secrets, chaves, permissões ou fluxos de autenticação forem modificados.

## 2. Escopo

A análise cobre todo o aplicativo, sem exceção de camada:

- **Mobile / Frontend** (`app/`, `src/presentation/`, componentes, hooks, telas, QR Code, armazenamento local)
- **Backend / API** (`src/application/`, `src/infrastructure/`, rotas, serviços, autenticação, validação, queries, logs)
- **Domínio e regras de negócio** (`src/domain/`)
- **Smart contracts** (`smartcontracts/`, Solidity)
- **Infraestrutura e configuração** (CI/CD, Docker, scripts de deploy, `.env*`, manifestos)
- **Testes e fixtures** (`src/tests/`, `tests/`, `src/fixtures/`)

## 3. Categorias de ameaça

Verifique sistematicamente:

1. **Backdoors e acesso não autorizado**
   - Portas dos fundos, endpoints ocultos, contas privilegiadas hard-coded, bypass de autenticação.
   - Funções administrativas sem controle de acesso, endpoints de debug expostos.
   - Código ofuscado, minificado suspeito, imports dinâmicos não justificados, uso de `eval` ou `Function`.

2. **Código malicioso e injeção**
   - Scripts ou dependências que executam comandos arbitrários, exfiltram dados ou mineram criptomoeda.
   - Uso de bibliotecas não declaradas, URLs externas não autorizadas, comunicação com domínios desconhecidos.
   - Injeção de SQL, NoSQL, command injection, path traversal, XSS, SSRF.

3. **Falhas sistêmicas que vazam dados sensíveis**
   - Logs contendo senhas, tokens, chaves privadas, seeds, PINs, dados biométricos, localização precisa ou PII.
   - Armazenamento inseguro: AsyncStorage, SQLite, SharedPreferences, clipboard, QR Code, PDF, cache não criptografado.
   - **Chaves privadas e dados sensíveis devem ser guardados exclusivamente em vaults de alta segurança** (keystore/Keychain, Secure Enclave, HSM, TPM, enclave seguro ou equivalente do SO), nunca em storage de alto nível, bancos de dados locais, arquivos, `AsyncStorage`, logs, analytics, QR Code ou PDF.
   - Verifique se a chave privada só sai do vault para assinar transações ou exportar com autorização local; em runtime, minimize o tempo de exposição na memória.
   - Respostas de API expondo campos sensíveis, stack traces ou detalhes internos.
   - Envio de dados por HTTP ou TLS mal configurado, ausência de pinning/validação de certificado.

4. **Controle de acesso e permissões**
   - Rotas privadas sem autenticação e autorização adequadas.
   - Escopo de permissões exagerado em bibliotecas nativas, plugins Expo/EAS ou manifestos.
   - Reuso indevido de tokens de sessão ou ausência de rotação.

5. **Configuração e dependências**
   - Secrets em arquivos fonte, commits acidentais de `.env`, valores default inseguros.
   - Dependências desatualizadas, conhecidamente vulneráveis ou não mantidas.
   - Scripts de build/deploy que aceitam chaves por argumento de linha de comando.

## 4. Checklist obrigatório

Antes de encerrar qualquer tarefa, responda:

- [ ] Nenhuma chave privada, seed, senha, token, PIN ou dado biométrico está hard-coded.
- [ ] Chaves privadas e dados sensíveis estão armazenados em **vaults de alta segurança** (keystore/Keychain, Secure Enclave, HSM/TPM ou enclave do SO), nunca em `AsyncStorage`, SQLite, arquivo, log, analytics, QR Code ou PDF.
- [ ] Nenhum secret é logado, enviado para analytics, impresso em QR Code/PDF ou armazenado em storage não seguro.
- [ ] Toda entrada externa é validada e sanitizada antes de uso.
- [ ] Todas as queries/uso de banco usam parametrização ou ORM seguro.
- [ ] Rotas privadas exigem autenticação e autorização no backend.
- [ ] Comunicação sensível usa TLS 1.3 ou superior; URLs HTTP são justificadas e seguras.
- [ ] Não há `eval`, `Function`, `dangerouslySetInnerHTML` ou dynamic import não justificado.
- [ ] Não há dependências conhecidamente vulneráveis (npm audit / dependabot sem findings críticos).
- [ ] Smart contracts não possuem reentrância, controle de acesso fraco, overflows ou calls externas não verificadas.
- [ ] Arquivos de configuração e deploy não expõem secrets em variáveis de ambiente padrão.
- [ ] Logs estruturados não incluem payloads sensíveis.

## 5. Ferramentas automatizadas

Execute as ferramentas disponíveis para a stack do projeto. Se alguma não estiver instalada, registre no relatório e faça verificação manual equivalente.

- `npm audit` (ou `yarn audit`, `pnpm audit`) para dependências Node.js.
- `semgrep --config=auto` ou regras padrão de segurança, se disponível.
- `slither .` ou `mythril` para contratos Solidity quando `smartcontracts/` for alterado.
- `grep` / `ripgrep` para padrões críticos: `private_key`, `PRIVATE_KEY`, `password`, `secret`, `api_key`, `token`, `0x` + 64 hex, `-----BEGIN`, `eval(`, `Function(`, `dangerouslySetInnerHTML`.

> **Importante:** ferramentas automatizadas são complementares, não substitutas da revisão manual.

## 6. Condição de bloqueio

- Se um finding de **severidade crítica** ou **alta** for detectado, **pare o trabalho imediatamente** e notifique o usuário.
- Não prossiga com merge, deploy ou consideração da tarefa como concluída até que:
  - A causa raiz seja corrigida;
  - A correção seja validada por reexecução das ferramentas e checklist;
  - O relatório seja atualizado com a mitigação e evidência de correção.

## 7. Relatório obrigatório

Ao final da análise, crie ou atualize o arquivo:

```text
docs/secure-tests/<YYYY-MM-DD-HH-mm>.md
```

Use a data e hora UTC do momento da análise (ano, mês, dia, hora e minuto). Se já existir um relatório no mesmo minuto, incremente com `-v2`, `-v3` etc.

### Estrutura do relatório

O relatório deve conter:

1. **Resumo executivo** — status geral (Aprovado / Bloqueado / Em mitigação), escopo, data e analista.
2. **Inventário revisado** — arquivos, diretórios, dependências e contratos examinados.
3. **Vulnerabilidades / findings** — tabela com: ID, severidade, categoria, localização, descrição, evidência.
4. **Provas / evidências** — trechos de código, logs sanitizados, saídas de ferramentas (sem secrets).
5. **Mitigações recomendadas ou aplicadas** — ação corretiva, responsável, prazo.
6. **Checklist de reexecução** — itens validados após correção.
7. **Aprovação** — bloco para assinatura/data do revisor.

### Regras de conteúdo

- **Nunca** inclua valores reais de secrets, chaves, tokens, PINs, seeds ou dados pessoais.
- Mascare ou substitua valores sensíveis por `<REDACTED>` ou `<MASKED>`.
- Use nomes de variáveis e caminhos de arquivo, nunca payloads secretos.
- Siga o formato de cabeçalho, badges e rodapé definidos em `documentacao.md`.

## 8. Protocolo de alerta

- Liste os findings no final da resposta ao usuário.
- Para findings críticos, destaque com severidade e instrução de bloqueio.
- Indique o caminho do relatório `docs/secure-tests/<date>.md` gerado.
- Se nenhum problema for encontrado, declare explicitamente: "Nenhuma vulnerabilidade crítica ou alta detectada na análise de segurança."

## 9. Referências

- `security.md` — princípios gerais de segurança e autenticação.
- `private_key.md` — tratamento de segredos e chaves privadas.
- `solidity-security.md` — regras específicas de contratos inteligentes.
- `AGENTS.md` — restrições de domínio, armazenamento e operações financeiras.
- `documentacao.md` — formatação obrigatória de documentação.
