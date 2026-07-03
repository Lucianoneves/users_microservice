# Checklist do Projeto — users_microservice

> Controle de responsabilidades e progresso do microsserviço ACME Corp.  
> **Fonte da verdade:** `SPEC.md` > `PROJECT_CONTEXT.md` > código compilável.  
> **Última revisão automática:** 2026-07-03 (soft delete completo + política de único admin)

## Resumo executivo (verificação automática)

| Verificação | Resultado | Detalhe |
|---|---|---|
| `npm test` (backend) | ✅ Passou | 30 testes, 5 suites |
| `npm run typecheck` (backend) | ✅ Passou | Sem erros |
| `npm run test:coverage` (backend) | ❌ Abaixo do threshold | Cobertura ainda abaixo da meta 90/85/90 |
| `npm run build` (frontend) | ✅ Passou | Vite build OK |
| Banco `microservice` | ✅ Confirmado | Tabela `users` em `public` |

### Progresso geral

| Área | Concluído | Parcial | Pendente |
|---|---:|---:|---:|
| Critérios de aceite (§1) | 5 | 1 | 0 |
| RF-01 a RF-04 (§2) | 18 | 2 | 1 |
| Não funcionais (§3) | 6 | 1 | 2 |
| API REST (§5) | 10 | 1 | 0 |
| Frontend (§7) | 13 | 0 | 1 |
| Testes / QA (§8) | 7 | 1 | 4 |
| Infra (§9) | 2 | 1 | 4 |

---

## Legenda

| Símbolo | Significado |
|---|---|
| `[x]` | Concluído e verificado |
| `[~]` | Parcial / precisa revisão |
| `[ ]` | Pendente |
| `[!]` | Regressão ou bloqueio detectado |

**Responsáveis sugeridos:** `BE` = Backend · `FE` = Frontend · `INF` = Infra/DevOps · `QA` = Qualidade/Testes

---

## 1. Critérios de aceite (SPEC §9)

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[x]` | `npm install` conclui sem erros (raiz, `backend/`, `frontend/`) | INF | Monorepo com scripts `dev:backend` / `dev:frontend` |
| `[x]` | `npm run dev` executa o backend (`backend/`, porta 3000) | BE | `ts-node-dev` + Express |
| `[x]` | `npm run dev` executa o frontend (`frontend/`, porta 5173) | FE | Vite + React |
| `[x]` | `npm test` passa localmente | QA | 30/30 testes (2026-07-03) |
| `[x]` | `npm run typecheck` passa sem erros | QA | OK em 2026-07-02 |
| `[~]` | CI verde com testes reais | INF | `.github/workflows/ci.yml` ainda usa `echo` simulado |
| `[~]` | Cobertura conforme SPEC (100%) / threshold Jest (85–90%) | QA | **9,28%** lines — muito abaixo da meta |

---

## 2. Requisitos funcionais (SPEC §3)

### RF-01 — Idempotência onde aplicável

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[~]` | `PUT /users/:id` seguro para retry | BE | Atualização parcial existe; sem chave de idempotência |
| `[~]` | `DELETE /users/:id` idempotente (retry) | BE | Segunda chamada retorna 404 se já excluído |
| `[ ]` | Política documentada para operações de escrita | BE | — |

### RF-02 — Validação de entrada externa (Zod)

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[x]` | Body validado nas rotas de usuários | BE | `createUserSchema`, `loginUserSchema`, `updateUserSchema` |
| `[x]` | Params validados (`:id`) | BE | `userIdParamSchema` |
| `[x]` | Query validada (`GET /users`) | BE | `listUsersQuerySchema` |
| `[x]` | Variáveis de ambiente validadas | BE | `backend/src/config/env.ts` |
| `[x]` | Formulários validados no frontend | FE | `register.schema.ts`, `login.schema.ts` |
| `[x]` | Middleware `validate` reutilizável | BE | `backend/src/middleware/validate.ts` |

### RF-03 — Erros HTTP consistentes

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[x]` | Handler global de erros | BE | `errorHandler.ts` |
| `[x]` | Erros Zod → 400 com `details` | BE | — |
| `[x]` | Duplicata (PostgreSQL 23505) → 409 | BE | E-mail/username únicos |
| `[x]` | Auth → 401 / RBAC → 403 | BE | `authenticate.ts` |
| `[~]` | Formato JSON padronizado em todas as rotas | BE | Mistura `{ error }` e `{ updated: true }` |

### RF-04 — Logs estruturados (Winston)

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[x]` | Logger configurado | BE | `backend/src/lib/logger.ts` |
| `[x]` | Log em registro de usuário (`user.created`) | BE | `logger.info` em `users.service.ts` |
| `[x]` | Log em login (`user.login`) | BE | `users.service.ts` |
| `[x]` | Log em atualização (`user.updated`) | BE | `users.service.ts` |
| `[x]` | Log de bootstrap (DB + servidor) | BE | `database.connected`, `server.started` |
| `[x]` | Log em exclusão (`user.deleted`) | BE | Winston em `softDelete()` |
| `[x]` | Log em reativação/restauração | BE | `user.reactivated`, `user.restored`, `user.login_blocked_deleted` |

---

## 3. Requisitos não funcionais (SPEC §4)

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[x]` | Secrets via variáveis de ambiente | BE/INF | `JWT_SECRET`, `DATABASE_URL` em `backend/.env` |
| `[x]` | Senhas com hash bcrypt (cost 12) | BE | Nunca retornadas na API pública |
| `[x]` | Health-check | BE | `GET /health` |
| `[x]` | Helmet (headers de segurança) | BE | `backend/src/index.ts` |
| `[x]` | Rate limit no registro | BE | `express-rate-limit` em `POST /users` |
| `[~]` | Observabilidade (métricas) | BE | Dashboard stub; sem Prometheus/métricas |
| `[ ]` | Redis integrado (cache/sessão) | BE | Dependência presente, não usada |
| `[ ]` | Timeout/retry com backoff em integrações externas | BE | — |

---

## 4. Stack e estrutura do repositório

### Monorepo

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[x]` | `backend/` — API Express + testes | BE | `backend/src/` |
| `[x]` | `frontend/` — UI React | FE | Login e cadastro |
| `[x]` | `SPEC.md` e `PROJECT_CONTEXT.md` na raiz | — | Documentação oficial |
| `[x]` | `CHECKLIST.md` na raiz | — | Este arquivo |
| `[x]` | Scripts raiz: `dev:backend`, `dev:frontend`, `test`, `build` | INF | `package.json` raiz |

### Backend — tecnologias obrigatórias

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[x]` | TypeScript | BE | `backend/tsconfig.json` |
| `[x]` | Express 4.x | BE | Entry: `backend/src/index.ts` |
| `[x]` | PostgreSQL + TypeORM + `pg` | BE | **Não usar Prisma** (fora da stack do projeto) |
| `[x]` | JWT com `jsonwebtoken` + `verify` | BE | `backend/src/lib/auth.ts` |
| `[x]` | Zod | BE | `backend/src/schemas/user.schema.ts` |
| `[x]` | Winston | BE | Uso consistente em create/login/update |
| `[x]` | dotenv | BE | Twelve-Factor App |

### Backend — arquitetura em camadas

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[x]` | Módulo `components/users/` (routes + service) | BE | Padrão `backend/src/components/<nome>/` |
| `[x]` | Módulo `components/dashboard/` | BE | Montado em `/dashboard` |
| `[x]` | Entidades em `entities/` | BE | `UserEntity` |
| `[x]` | Middleware separado (auth, validate, errors) | BE | — |
| `[x]` | SQL parametrizado via TypeORM Repository | BE | Sem interpolação de input do usuário |

### Frontend — tecnologias

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[x]` | React 18 + TypeScript | FE | — |
| `[x]` | Vite | FE | Porta 5173 |
| `[x]` | React Router | FE | `/login`, `/cadastro` |
| `[x]` | Tailwind CSS | FE | — |
| `[x]` | Zod nos formulários | FE | — |
| `[x]` | react-toastify | FE | Feedback ao usuário |
| `[x]` | Serviço de API separado da UI | FE | `frontend/src/services/authApi.ts` |

---

## 5. API REST — Backend

| Status | Método | Rota | Auth | Resp. | Notas |
|---|---|---|---|---|---|
| `[x]` | `GET` | `/health` | Não | — | `{ status, service }` |
| `[x]` | `POST` | `/users` | Não | BE | Registro → `{ id, token }` |
| `[x]` | `POST` | `/users/login` | Não | BE | Login → `{ id, token }` |
| `[x]` | `GET` | `/users/:id` | Sim | BE | Perfil (self ou admin) via `findById` |
| `[x]` | `PUT` | `/users/:id` | Sim | BE | Atualização parcial (self ou admin) |
| `[x]` | `GET` | `/users` | Sim (admin) | BE | Listagem com `?role=` e `?search=` |
| `[x]` | `DELETE` | `/users/:id` | Sim | BE | Soft delete — self ou admin |
| `[x]` | `POST` | `/users/reactivate` | Não | BE | Reativação com e-mail + senha |
| `[x]` | `GET` | `/users/deleted` | Sim (admin) | BE | Lista contas soft-deleted |
| `[x]` | `POST` | `/users/:id/restore` | Sim (admin) | BE | Restaura conta excluída |
| `[~]` | `GET` | `/dashboard` | Não | BE | Rota existe; `getSummary()` retorna stub |

### Segurança nas rotas

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[x]` | Bearer token no header `Authorization` | BE | — |
| `[x]` | `jwt.verify()` (não apenas `decode`) | BE | — |
| `[x]` | Ownership em `/:id` (`requireSelfOrAdmin`) | BE | IDOR mitigado na rota |
| `[x]` | Listagem restrita a `admin` | BE | RBAC |
| `[x]` | Campos públicos sem hash de senha | BE | `PUBLIC_FIELDS` no service |
| `[x]` | CORS para frontend local (`localhost:5173`) | BE | `backend/src/index.ts` |
| `[x]` | Token JWT invalidado após soft delete | BE | `authenticate` valida usuário ativo no banco |
| `[x]` | Login bloqueado para contas excluídas | BE | `UsersService.login()` + log |
| `[x]` | Cadastro sempre como `user` (sem `role` na API pública) | BE | `createUserSchema` sem campo `role` |
| `[x]` | Apenas um administrador ativo | BE | `ForbiddenError` em promoção/rebaixamento |
| `[x]` | Usuário comum não altera `role` via `PUT` | BE | Rota remove `role` do body se não for admin |

---

## 6. Banco de dados (PostgreSQL + TypeORM)

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[x]` | Entidade `UserEntity` (`users`) | BE | `id`, `username`, `email`, `password`, `role`, timestamps, `deletedAt` |
| `[x]` | `data-source.ts` configurado | BE | `DATABASE_URL` + `synchronize` fora de produção |
| `[x]` | Tabela `users` no banco `microservice` | BE/INF | Schema `public` — confirmado em sessão anterior |
| `[x]` | Migrations TypeORM versionadas no repositório | BE | `1730500000000-AddSoftDeleteAndTimestamps.ts` |
| `[~]` | `synchronize` apenas fora de produção | BE | Dev: sync; prod: usar `npm run migration:run` |
| `[x]` | `createdAt` / `updatedAt` / `deletedAt` na entidade | BE | `@CreateDateColumn`, `@UpdateDateColumn`, `@DeleteDateColumn` |
| `[x]` | Soft delete funcional (`DELETE` + `@DeleteDateColumn`) | BE | `UsersService.softDelete()` + log `user.deleted` |
| `[x]` | Reativação por cadastro (mesmo e-mail) | BE | `create()` reativa conta excluída em vez de duplicar |
| `[x]` | Política de reutilização de e-mail documentada no fluxo | BE | Reativar via cadastro, `/reactivate` ou restore admin |

---

## 7. Frontend — funcionalidades

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[x]` | Tela de login (`/login`) | FE | — |
| `[x]` | Tela de cadastro (`/cadastro`) | FE | — |
| `[x]` | Integração `POST /users` (cadastro) | FE | `authApi.ts` → testado via API |
| `[x]` | Integração `POST /users/login` | FE | `authApi.ts` → testado via API |
| `[x]` | Token salvo em `localStorage` | FE | Chave `auth_token` |
| `[x]` | Tela de perfil (`GET /users/:id`) | FE | `/perfil` — `PerfilForm.tsx` + Bearer token |
| `[x]` | Tela admin (gestão de perfis de usuários) | FE | `/admin` — listar, editar e excluir (soft delete) |
| `[x]` | Proteção de rotas admin no React Router | FE | `AdminRoute` — token + role `admin` |
| `[x]` | Exclusão de conta (soft delete) no perfil e admin | FE | `DELETE /users/:id` via `usersApi.deleteUser()` |
| `[x]` | Tela de reativação (`/reativar`) | FE | `ReactivateForm.tsx` — `POST /users/reactivate` |
| `[x]` | Admin: listar e restaurar contas excluídas | FE | `GET /users/deleted` + `POST /users/:id/restore` |
| `[x]` | Cadastro sem opção de administrador | FE | `RegisterForm` — sempre usuário comum |
| `[x]` | `/admin` bloqueado para não-admins com feedback | FE | `AdminRoute` redireciona + toast de acesso negado |
| `[x]` | Perfil admin somente leitura no painel | FE | Role não editável em `AdminUsersPanel` |
| `[ ]` | `VITE_API_URL` documentada (`.env.example`) | FE/INF | Default: `http://localhost:3000` |

---

## 8. Testes e qualidade (QA)

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[x]` | Testes JWT (`createToken`, `verifyToken`) | QA | `backend/tests/users.test.ts` |
| `[x]` | Testes RBAC (`rolesMatch`) | QA | — |
| `[x]` | Testes core (utilitários) | QA | `backend/tests/core.test.ts` |
| `[x]` | `npm run typecheck` sem erros | QA | OK em 2026-07-02 |
| `[x]` | `npm run build` no frontend | QA | OK em 2026-07-03 |
| `[~]` | Testes de `UsersService` com DB mock | QA | `users.service.test.ts` — soft delete + único admin |
| `[ ]` | Testes de integração HTTP (supertest) | QA | Dependência instalada, não usada |
| `[ ]` | Testes de segurança (JWT inválido, IDOR, SQLi) | QA | — |
| `[ ]` | Testes frontend (Jest + RTL) | QA | Não configurado |
| `[ ]` | ESLint configurado e rodando | QA | Script existe; config ausente |
| `[!]` | `npm run test:coverage` atinge threshold | QA | **9,28%** lines vs meta **90%** |

### Cobertura atual (2026-07-03)

| Arquivo / área | Lines | Status |
|---|---|---|
| `src/lib/auth.ts` | ~92% | Parcialmente coberto |
| `src/config/env.ts` | ~86% | Parcialmente coberto |
| `src/components/users/users.service.ts` | Parcial | Testes unitários com mock |
| `src/middleware/*` | 0% | Sem testes |
| `src/index.ts` | 0% | Sem testes |

---

## 9. Infraestrutura e deploy (INF)

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[x]` | `backend/Dockerfile` (Node 20, porta 3000) | INF | — |
| `[x]` | `Makefile` (install, build, test, docker) | INF | — |
| `[~]` | `backend/k8s/deployment.yaml` | INF | Typos (`byts`, `byt`); probe porta 8080; senha hardcoded |
| `[ ]` | CI real (`npm ci`, lint, test, build) | INF | Substituir steps `echo` em `ci.yml` |
| `[ ]` | Secrets no K8s via `Secret` (não inline) | INF | — |
| `[ ]` | `.env.example` sem valores reais | INF | Ausente na raiz e em `backend/` |
| `[ ]` | Pipeline de deploy documentado | INF | — |

---

## 10. Dashboard (módulo WIP)

| Status | Item | Resp. | Notas |
|---|---|---|---|
| `[x]` | Router montado em `/dashboard` | BE | — |
| `[x]` | `DashboardService` + tipos | BE | — |
| `[ ]` | Agregar contagem de usuários | BE | TODO em `dashboard.service.ts` |
| `[ ]` | Métricas de auth / stats | BE | — |
| `[ ]` | UI de dashboard no frontend | FE | — |

---

## 11. Itens explicitamente fora de escopo / não fazer

Conforme `PROJECT_CONTEXT.md` e regras do projeto:

| Item | Motivo |
|---|---|
| Prisma ou outro ORM | Stack definida: **TypeORM + PostgreSQL** |
| `jwt.decode()` sem `verify` | Vulnerabilidade; usar `jwt.verify()` |
| Secrets hardcoded no código | Usar variáveis de ambiente |
| SQL com interpolação de input | Usar TypeORM Repository / queries parametrizadas |
| Seguir anti-padrões do `README.md` | README é didático; priorizar `SPEC.md` |
| `console.log` em produção | Usar Winston (RF-04) |

---

## 12. Próximos passos sugeridos (prioridade)

1. **[INF]** CI real em `.github/workflows/ci.yml`
2. **[QA]** Testes de integração com supertest (incl. soft delete e RBAC)
3. **[BE]** Agregações reais no `DashboardService`
4. **[INF]** Corrigir manifests K8s (portas, secrets, typos)
5. **[BE/INF]** Seed ou script para criar o único administrador inicial
6. **[INF]** `.env.example` com `VITE_API_URL` e variáveis do backend

---

## 13. Comandos para re-verificação automática

```bash
# Backend
cd backend
npm run typecheck
npm test
npm run test:coverage

# Frontend
cd frontend
npm run build

# Monorepo (raiz)
npm test
npm run typecheck
```

---

## 14. Histórico deste checklist

| Data | Alteração |
|---|---|
| 2026-07-02 | Criação inicial com base no código, SPEC e PROJECT_CONTEXT |
| 2026-07-02 | Atualização automática: métricas de teste/cobertura/typecheck; alertas `findById` e `console.log` |
| 2026-07-02 | Correção: `findById` restaurado; `user.created` com Winston; typecheck verde |
| 2026-07-02 | Frontend: tela `/perfil`, `ProtectedRoute`, `fetchUserProfile` com Bearer token |
| 2026-07-03 | Soft delete: `DELETE /users/:id`, `@DeleteDateColumn`, migration, UI perfil/admin |
| 2026-07-03 | Reativação: `POST /users/reactivate`, `GET /users/deleted`, `POST /users/:id/restore`, tela `/reativar` |
| 2026-07-03 | Política único admin: cadastro só `user`, RBAC reforçado, `AdminRoute` com toast, 30 testes |
