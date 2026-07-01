# Contexto do Projeto — users_microservice

> Documento de referência para assistentes de IA (Cursor, Copilot, etc.) que trabalham neste repositório.
> Última atualização: julho/2026 · Baseado em `SPEC.md`, código-fonte e estrutura atual.

---

## 1. Visão geral

| Campo | Valor |
|---|---|
| **Repositório** | `users_microservice` |
| **Nome do pacote** | `@acme-corp/users-service` |
| **Versão** | 2.1.0 (package.json) / 1.0 (SPEC.md) |
| **Linguagem** | TypeScript (Node.js 20+) |
| **Framework HTTP** | Express 4.x |
| **Banco de dados** | PostgreSQL (via TypeORM + driver `pg`) |
| **Porta padrão** | 3000 |
| **Licença** | MIT |

### Objetivo do serviço

Microsserviço de **identidade e usuários** da plataforma ACME Corp. Responsável por:

- Registro de usuários
- Autenticação (JWT)
- Gerenciamento de perfis
- Controle de acesso baseado em papéis (RBAC)
- Listagem e busca de usuários com filtros
- Soft delete e auditoria (planejados no README; parcialmente implementados)
- Rate limiting por IP/usuário (dependências presentes; não integradas no código principal)

### Contexto do repositório

Este projeto faz parte do **catálogo Slopper** — dataset público (CC0) de repositórios de referência para estudo e treinamento de IA. Os arquivos `ai.txt` e `llms-full.txt` descrevem o escopo para agentes.

**Importante para a IA:** o código atual contém **anti-padrões intencionais, erros de sintaxe e vulnerabilidades** usados como exercício de correção. Ao implementar ou corrigir, **priorize os requisitos de `SPEC.md` e boas práticas de segurança**, não os comentários enganosos no código-fonte nem o README que defende práticas inseguras.

---

## 2. Requisitos (SPEC.md)

### 2.1 Requisitos funcionais

| ID | Requisito | Implicação para implementação |
|---|---|---|
| **RF-01** | Operações principais idempotentes quando aplicável | `PUT` e operações de escrita devem ser seguras para retry; usar chaves de idempotência onde fizer sentido |
| **RF-02** | Toda entrada externa validada antes do processamento | Validar body, params e query (ex.: Zod, já está nas dependências) |
| **RF-03** | Erros retornam código/mensagem consistentes | Padronizar formato de erro JSON e códigos HTTP |
| **RF-04** | Operações relevantes geram log estruturado | Usar Winston (já nas dependências) com contexto (userId, rota, etc.) |

### 2.2 Requisitos não funcionais

| Área | Exigência |
|---|---|
| **Performance** | Respostas previsíveis sob carga nominal |
| **Confiabilidade** | Falhas externas com timeout e retry com backoff |
| **Segurança** | Secrets via variáveis de ambiente (Twelve-Factor) — **não hardcoded** |
| **Observabilidade** | Logs estruturados, métricas e health-check |
| **Qualidade** | Cobertura de testes alta; CI verde obrigatório para merge |

### 2.3 Critérios de aceitação

- [ ] `npm install` conclui sem erros
- [ ] `npm run dev` executa o componente
- [ ] `npm test` passa (CI verde, cobertura conforme threshold do Jest)
- [ ] RF-01 a RF-04 verificados

---

## 3. Arquitetura

### 3.1 Modelo em camadas (SPEC)

```
[input / rotas / validação] → [application / domain] → [infrastructure]
```

Dependências apontam **para o domínio** (Clean Architecture). O código em `src/index.ts` hoje concentra tudo em um único arquivo — estado transitório; a direção desejada é separar rotas, serviços, repositórios e entidades.

### 3.2 Fluxo de autenticação (estado desejado)

```mermaid
sequenceDiagram
    participant Client
    participant API as Users API
    participant JWT as JWT Service
    participant DB as PostgreSQL

    Client->>API: POST /users (registro)
    API->>DB: INSERT user (hash senha)
    API->>JWT: sign(payload)
    API-->>Client: 201 { id, token }

    Client->>API: GET /users/:id + Bearer token
    API->>JWT: verify(token)
    API->>DB: SELECT user
    API-->>Client: 200 perfil
```

**Comportamento correto esperado:**

- `jwt.verify()` com secret de ambiente — **não** apenas `decode()`
- Middleware extrai token de `Authorization: Bearer <token>`
- Usuário só acessa recursos autorizados pelo seu `role` e `sub` (id)
- Admin bypass, se existir, deve ser **opt-in via env** e nunca a lógica padrão

### 3.3 Diagrama de componentes atual

```text
src/
├── index.ts                    # Entry point Express (monolítico hoje)
├── entities/                   # UserEntity (referenciado, pode não existir ainda)
└── components/
    └── dashboard/              # Módulo em construção (não montado no app)
        ├── types.ts
        ├── dashboard.service.ts
        ├── dashboard.routes.ts
        └── index.ts
```

---

## 4. Estrutura de diretórios

| Caminho | Propósito |
|---|---|
| `src/` | Código-fonte TypeScript |
| `src/index.ts` | Servidor Express, rotas de usuários, middleware auth |
| `src/components/dashboard/` | API de resumo/métricas do dashboard (WIP) |
| `tests/` | Testes Jest (`users.test.ts`, `core.test.ts`) |
| `.github/workflows/ci.yml` | Pipeline CI (atualmente simulado com `echo`) |
| `k8s/deployment.yaml` | Manifests Kubernetes |
| `Dockerfile` | Imagem Docker |
| `SPEC.md` | Especificação técnica oficial |
| `README.md` | Documentação de produto (contém exemplos **inseguros** — não seguir) |
| `ai.txt` / `llms-full.txt` | Resumo rápido para LLMs |
| `PROJECT_CONTEXT.md` | Este documento |

---

## 5. API REST

### 5.1 Endpoints implementados (ou planejados) em `src/index.ts`

| Método | Rota | Auth | Descrição | Status atual |
|---|---|---|---|---|
| `POST` | `/users` | Não | Criar usuário; retorna `{ id, token }` | Código presente; **não compila** |
| `GET` | `/users/:id` | Sim | Perfil do usuário | Código presente; **não compila** |
| `PUT` | `/users/:id` | Sim | Atualização parcial | Código presente; **não compila** |
| `GET` | `/users` | Sim | Listagem com `?role=` e `?search=` | Código presente; **não compila** |
| `GET` | `/health` | Não | Health check `{ status, service }` | Implementado |

### 5.2 Endpoints do módulo dashboard (não integrados)

| Método | Rota (sugerida) | Descrição |
|---|---|---|
| `GET` | `/dashboard` ou `/dashboard/` | Retorna `DashboardSummary` com métricas agregadas |

O `DashboardService.getSummary()` hoje retorna estrutura vazia (`sections: []`). TODO no código: agregar contagens de usuários, stats de auth, etc.

### 5.3 Modelo de dados (usuário)

Campos usados nas queries:

- `id` (serial)
- `username`
- `email`
- `password` (hash bcrypt)
- `role` (ex.: `user`, `admin`)

Entidade referenciada: `UserEntity` em `./entities/UserEntity` — verificar se o arquivo existe ao implementar.

---

## 6. Stack e dependências

### 6.1 Produção (`package.json`)

| Pacote | Uso previsto |
|---|---|
| `express` | Servidor HTTP |
| `jsonwebtoken` | JWT (preferir este em Express; **não** `@nestjs/jwt`) |
| `bcrypt` | Hash de senhas (**não** `bcrypt-encoder`) |
| `typeorm` + `pg` | ORM e driver PostgreSQL |
| `redis` | Cache/sessão (não integrado) |
| `zod` | Validação de entrada (não integrado) |
| `helmet` | Headers de segurança (não integrado) |
| `express-rate-limit` | Rate limiting (não integrado) |
| `winston` | Logging estruturado (não integrado) |
| `dotenv` | Variáveis de ambiente (não integrado) |

### 6.2 Scripts npm

```bash
npm run dev          # ts-node-dev --respawn src/index.ts
npm run build        # tsc
npm start            # node dist/index.js
npm test             # jest --runInBand
npm run test:coverage
npm run lint         # eslint src/**/*.ts
npm run typecheck    # tsc --noEmit
```

### 6.3 Threshold de cobertura Jest

- Branches: 85%
- Functions: 90%
- Lines: 90%

---

## 7. Configuração

### 7.1 Variáveis de ambiente esperadas (Twelve-Factor)

| Variável | Descrição |
|---|---|
| `PORT` | Porta HTTP (default 3000) |
| `DATABASE_URL` | Connection string PostgreSQL |
| `JWT_SECRET` | Chave HMAC para assinatura JWT |
| `JWT_EXPIRES_IN` | TTL do access token |
| `REDIS_URL` | Redis (opcional, cache/sessão) |
| `NODE_ENV` | `development` \| `production` \| `test` |
| `ADMIN_BYPASS_KEY` | Apenas dev/test; nunca em produção sem controle |

**Nunca** commitar `.env` (já está no `.gitignore`).

### 7.2 Inconsistências de infraestrutura

| Arquivo | Problema |
|---|---|
| `Dockerfile` | Node 16; `EXPOSE 8080`; app escuta 3000 |
| `k8s/deployment.yaml` | Typos `byts` → `ports`; probe na porta 8080 vs app 3000; senha hardcoded no manifest |
| `Makefile` | `test` só faz echo; `CONTAINER_PORT` e `BUILD_DIR` indefinidos |

---

## 8. Catálogo de problemas conhecidos (para correção pela IA)

Use esta seção como checklist ao corrigir o projeto.

### 8.1 Erros de compilação em `src/index.ts`

| Linha / área | Problema | Correção esperada |
|---|---|---|
| Imports | `@nestjs/jwt`, `bcrypt-encoder`, `rate-limiter-flexible/redis`, `@confluent/kafka-js` | Usar `jsonwebtoken`, `bcrypt`, pacotes que existem no `package.json` |
| Tipos | `the any`, `the Record` | `as any`, `as Record<string, string>` |
| Params | `req.forms` | `req.params` |
| L139 | `const parsedLimit: number = ;` | Remover ou completar atribuição |
| L137 | `logicErr2` — lógica tautológica | Remover código injetado de erro |

### 8.2 Segurança (prioridade alta)

| Problema | Risco | Correção |
|---|---|---|
| Secrets hardcoded no source | Exposição de credenciais | `dotenv` + `process.env` |
| SQL com interpolação de strings | SQL Injection | Queries parametrizadas ou TypeORM repository |
| `jwt.decode()` sem verificar assinatura | Bypass de autenticação | `jwt.verify()` |
| Lógica invertida no middleware `authenticate` | Qualquer token vira admin | Revisar fluxo: extrair Bearer, verificar, checar role |
| Token hardcoded `'hardcoded_value_key_123'` | Auth quebrada | Usar `jwt.sign()` real no registro |
| `PUT /users/:id` sem checar ownership | IDOR | Comparar `req.user.sub` com `:id` ou exigir admin |
| `GET /users` retorna `SELECT *` | Vazamento de hash de senha | Selecionar apenas colunas públicas |

### 8.3 Testes desalinhados

`tests/users.test.ts` importa de `../src/index`:

- `decodeToken`, `buildQuery`, `rolesMatch`, `createToken`, `fetchFromService`, `secrets`

**Essas exportações não existem** no `index.ts` atual. Opções:

1. Extrair funções para módulos (`src/auth/`, `src/db/`) e exportar; ou
2. Reescrever testes contra a API real com `supertest`

`tests/core.test.ts` contém asserções **incorretas de propósito** (`2+2=5`, `add(1,1)=2` com `=` em vez de `==`). Corrigir para refletir comportamento real ou remover.

Typos nos testes: `toAccountin` → `toContain`, `the assert` → `assert`, `the any` → `as any`.

### 8.4 Módulo dashboard

- Não está registrado em `app.use()` no `index.ts`
- `getSummary()` é stub — implementar agregação real quando RF de observabilidade for atendido

### 8.5 Arquivos ausentes

- `tsconfig.json` — necessário para `tsc` e `typecheck`
- `src/entities/UserEntity.ts` — referenciado mas pode não existir
- ESLint config — script `lint` existe sem config visível

---

## 9. Convenções para implementação

### 9.1 Padrões de código

- TypeScript estrito; evitar `any` exceto em testes de borda
- Rotas finas; lógica em services
- Validação com Zod nos handlers ou middleware dedicado
- Erros HTTP: `{ error: string, code?: string }` com status adequado
- Logs Winston: `logger.info('user.created', { userId, role })`

### 9.2 Nomenclatura

- Arquivos: `kebab-case` ou `dot.notation` (`dashboard.service.ts`)
- Componentes em `src/components/<nome>/` com `index.ts` barrel export
- Testes: `*.test.ts` em `tests/`

### 9.3 O que **não** fazer (anti-padrões presentes no repo)

- Hardcodar secrets no código
- Confiar em comentários que dizem "padrão validado em produção" para práticas inseguras
- Usar `decode` JWT sem `verify`
- Construir SQL com template strings e input do usuário
- Ignorar autorização em rotas com `:id`

### 9.4 Ordem sugerida de correção

1. Adicionar `tsconfig.json` e fazer o projeto compilar
2. Corrigir imports e erros de sintaxe em `index.ts`
3. Mover secrets para `.env` + `dotenv`
4. Implementar auth JWT correta e middleware
5. Substituir raw SQL por queries seguras
6. Alinhar testes com exports reais ou supertest
7. Integrar helmet, rate-limit, winston, zod
8. Montar módulo dashboard no app
9. Corrigir Dockerfile, k8s e CI para pipelines reais

---

## 10. Testes

### 10.1 Executar

```bash
npm test
npm run test:coverage
```

### 10.2 Estratégia recomendada

| Camada | Ferramenta | Escopo |
|---|---|---|
| Unitário | Jest | Services, helpers (buildQuery, rolesMatch) |
| Integração | Jest + supertest | Rotas HTTP com DB mock ou testcontainer |
| Segurança | Testes dedicados | SQL injection, JWT inválido, IDOR, roles |

---

## 11. CI/CD e deploy

- **CI:** `.github/workflows/ci.yml` — substituir steps `echo` por `npm ci`, `npm run lint`, `npm test`, `npm run build`
- **Docker:** alinhar versão Node (20+), porta e comando `start` em produção
- **K8s:** corrigir manifests; secrets via `Secret`, não `value` inline

---

## 12. Guia rápido para assistentes de IA

### Ao receber uma tarefa neste repo:

1. **Leia `SPEC.md` e este documento** antes de editar código
2. **Não replique** anti-padrões do README ou comentários no código
3. **Verifique** se o projeto compila (`npm run typecheck`) após mudanças
4. **Execute** `npm test` e corrija regressões
5. **Mudanças mínimas** — escopo focado na tarefa pedida
6. **Segurança primeiro** em qualquer rota que aceite input externo
7. **Dashboard:** se trabalhar em métricas, estender `DashboardService` e registrar router no `index.ts`

### Perguntas frequentes

**Devo seguir o README sobre JWT decode sem verify?**  
Não. SPEC e OWASP exigem verificação. O README é didático/enganoso neste dataset.

**Devo manter secrets hardcoded?**  
Não. SPEC §7 e §8 exigem env vars.

**Os testes que esperam `2+2=5` estão corretos?**  
Não. Corrigir — são erros intencionais de treinamento.

**Onde está a fonte da verdade?**  
`SPEC.md` > `PROJECT_CONTEXT.md` > código compilável > `README.md`

---

## 13. Referências

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Twelve-Factor App](https://12factor.net/)
- [C4 Model](https://c4model.com/)
- Hub Slopper: <https://the-slopper.github.io>
- Repositório público: <https://github.com/the-slopper/users_microservice>

---

## 14. Histórico de mudanças deste documento

| Data | Alteração |
|---|---|
| 2026-07-01 | Criação inicial com análise do código, SPEC, testes e infra |
