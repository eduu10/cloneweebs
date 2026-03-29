# CloneWeebs IA

Plataforma SaaS de criacao de videos com avatares de IA — tipo HeyGen, mas brasileiro.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS, Radix UI |
| Backend | FastAPI, Python 3.12, SQLAlchemy async, Pydantic |
| Banco | PostgreSQL (Supabase) |
| Cache | Redis (Upstash) |
| Storage | Supabase Storage |
| LLM | Groq API (Llama 3) |
| Deploy | Vercel (frontend) + Render (backend) |

## Funcionalidades

- Landing page com pricing e features
- Auth (login/registro) com JWT
- Dashboard com stats e projetos recentes
- AI Studio — editor de video com cenas, avatares, vozes
- Video Agent — chat IA para gerar roteiros
- Traducao de video com lip-sync
- Galeria de avatares (criacao, upload, treinamento)
- Painel admin (usuarios, health, billing)
- Configuracoes e perfil do usuario

## Deploy

Veja [DEPLOY.md](DEPLOY.md) para instrucoes de deploy 100% gratuito.

## Dev Local

```bash
cp .env.example .env
# Preencha as variaveis

# Com Docker
docker compose up

# Sem Docker
cd services/api-gateway && pip install -r requirements.txt && uvicorn src.main:app --reload
cd apps/web && npm install && npm run dev
```

## Estrutura

```
clonestudio/
├── apps/web/              # Frontend Next.js
├── services/api-gateway/  # Backend FastAPI
├── docker-compose.yml     # Dev local
├── render.yaml            # Deploy Render
├── DEPLOY.md              # Guia de deploy
└── .env.example           # Template de env vars
```
