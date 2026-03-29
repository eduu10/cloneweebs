# Deploy CloneWeebs IA — 100% Free

Todos os servicos abaixo tem free tier. Custo total: **R$ 0**.

## Arquitetura de Deploy

| Componente | Servico | Free Tier |
|-----------|---------|-----------|
| Frontend (Next.js) | **Vercel** | Ilimitado |
| Backend (FastAPI) | **Render** | 750h/mes (sleep apos 15min) |
| Banco de dados | **Supabase** | PostgreSQL 500MB |
| Cache/Redis | **Upstash** | 10k commands/dia |
| Storage (arquivos) | **Supabase Storage** | 1GB |
| LLM (IA) | **Groq** | Llama 3, 14.4k tokens/min |

---

## Passo 1 — Criar contas (5 min)

1. **Supabase** — [supabase.com](https://supabase.com) — crie um projeto
2. **Upstash** — [upstash.com](https://upstash.com) — crie um database Redis
3. **Groq** — [console.groq.com](https://console.groq.com) — crie uma API key
4. **Render** — [render.com](https://render.com) — conecte seu GitHub
5. **Vercel** — [vercel.com](https://vercel.com) — conecte seu GitHub

---

## Passo 2 — Configurar Supabase (3 min)

1. Crie um projeto no Supabase
2. Va em **Settings → Database** e copie a **Connection string (URI)**
   - Troque `postgres://` por `postgresql+asyncpg://`
   - Essa e sua `DATABASE_URL`
3. Va em **Settings → API** e copie:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** → `SUPABASE_SERVICE_KEY`
4. Va em **Storage** e crie um bucket chamado `avatars`
   - Marque como **public** se quiser URLs publicas para fotos

---

## Passo 3 — Configurar Upstash (2 min)

1. Crie um database Redis no Upstash
2. Copie a **Redis URL** (formato `rediss://default:xxxx@xxxx.upstash.io:6379`)
   - Essa e sua `REDIS_URL`

---

## Passo 4 — Deploy Backend no Render (5 min)

1. Va em [render.com](https://render.com) → **New → Web Service**
2. Conecte o repositorio GitHub
3. Configure:
   - **Root Directory**: `services/api-gateway`
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn src.main:app --workers 1 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120`
4. Adicione as **Environment Variables**:
   ```
   DATABASE_URL=postgresql+asyncpg://...
   REDIS_URL=rediss://...
   SUPABASE_URL=https://xxxx.supabase.co
   SUPABASE_SERVICE_KEY=eyJ...
   JWT_SECRET_KEY=(gere um token aleatorio)
   GROQ_API_KEY=gsk_xxxx
   CORS_ORIGINS=https://seu-app.vercel.app
   ENVIRONMENT=production
   ```
5. Clique **Create Web Service**
6. Anote a URL do deploy (ex: `https://cloneweebs-api.onrender.com`)

### Rodar seed (criar usuarios iniciais)

Apos o deploy, va no **Shell** do Render e execute:
```bash
python -m src.seed
```

---

## Passo 5 — Deploy Frontend na Vercel (3 min)

1. Va em [vercel.com](https://vercel.com) → **New Project**
2. Conecte o repositorio GitHub
3. Configure:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Next.js
4. Adicione a **Environment Variable**:
   ```
   NEXT_PUBLIC_API_URL=https://cloneweebs-api.onrender.com
   ```
5. Clique **Deploy**

---

## Passo 6 — Atualizar CORS (1 min)

Apos o deploy da Vercel, copie a URL (ex: `https://cloneweebs.vercel.app`) e atualize no Render:

```
CORS_ORIGINS=https://cloneweebs.vercel.app
```

---

## Verificacao

1. Acesse `https://cloneweebs-api.onrender.com/health` — deve retornar status saudavel
2. Acesse `https://cloneweebs.vercel.app` — deve carregar a landing page
3. Faca login com `admin@cloneweebs.ai` / `Admin@2026`

---

## Desenvolvimento Local

Para rodar local com Docker:
```bash
cp .env.example .env
# Preencha as variaveis
docker compose up
```

Ou sem Docker:
```bash
# Backend
cd services/api-gateway
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000

# Frontend
cd apps/web
npm install
npm run dev
```

---

## Limitacoes do Free Tier

- **Render**: Backend dorme apos 15min sem trafego. Primeiro request apos sleep demora ~30s.
- **Supabase**: 500MB de banco, 1GB de storage, 50k rows.
- **Upstash**: 10k commands/dia. Se exceder, cache para de funcionar (app continua ok, so sem cache).
- **Groq**: Rate limit de 14.4k tokens/min. Se exceder, Video Agent retorna erro temporario.
