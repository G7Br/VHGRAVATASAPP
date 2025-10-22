# 🚀 SUPABASE DEPLOY - API TERNOS

## 📋 PASSO A PASSO

### 1. **CRIAR PROJETO SUPABASE**
1. Acesse [supabase.com](https://supabase.com)
2. Clique "Start your project"
3. Crie novo projeto
4. Anote a URL e API Key

### 2. **CONFIGURAR BACKEND**
Atualize `.env` com:
```
SUPABASE_URL=sua_url_supabase
SUPABASE_ANON_KEY=sua_chave_anonima
NODE_ENV=production
JWT_SECRET=ternos_supabase_2024
```

### 3. **DEPLOY NO VERCEL**
1. Vá para [vercel.com](https://vercel.com)
2. Conecte GitHub ou faça upload
3. Configure variáveis de ambiente
4. Deploy automático

### 4. **ATUALIZAR MOBILE**
Troque URL em `mobile/src/services/api.js`:
```javascript
const API_BASE_URL = 'https://seu-projeto.vercel.app/api';
```

## ✅ ARQUIVOS NECESSÁRIOS
- `backend/server.js`
- `backend/package.json`
- `backend/.env`
- `mobile/` (completo)