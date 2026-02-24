# Gestão Inspire

Frontend PWA (React + Vite + TypeScript) para gestão administrativa via API.

## Stack

- React + TypeScript + Vite
- Ant Design v6
- React Router
- Axios
- vite-plugin-pwa

## Ambiente

1. Copie `.env.example` para `.env`.
2. Confirme a base URL:

```env
VITE_API_BASE_URL=https://minc-api.onrender.com/api/udd
```

## Scripts

- `npm run dev` inicia desenvolvimento
- `npm run build` gera build de produção
- `npm run preview` testa build local

## Fluxo de autenticação

- Login por e-mail e senha (sem cadastro)
- Endpoint: `POST /admin/authenticate`
- Token salvo em `localStorage`
- Interceptor Axios injeta `Authorization: Bearer <token>`
- Rotas privadas protegidas por guard

## Estrutura resumida

- `src/pages/auth` tela de login
- `src/pages/dashboard` dashboard inicial
- `src/components/forms` campos reutilizáveis
- `src/components/layout` layout administrativo
- `src/services` cliente API e autenticação
- `src/router` rotas e guards
# mincapp-gestao
