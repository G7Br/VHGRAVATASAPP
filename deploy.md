# 🚀 GUIA COMPLETO DE DEPLOY

## 📋 PASSO A PASSO PARA DEPLOY GRATUITO

### 1. **CONFIGURAR SUPABASE (BANCO DE DADOS)**

1. **Criar conta no Supabase:**
   - Acesse: https://supabase.com
   - Clique em "Start your project"
   - Faça login com GitHub ou email

2. **Criar novo projeto:**
   - Clique em "New Project"
   - Nome: `ternos-producao`
   - Senha do banco: `TernosProducao2024!`
   - Região: `South America (São Paulo)`

3. **Executar SQL:**
   - Vá em `SQL Editor`
   - Cole o conteúdo do arquivo `backend/supabase-setup.sql`
   - Clique em `RUN`

4. **Obter credenciais:**
   - Vá em `Settings > API`
   - Copie:
     - `Project URL` (SUPABASE_URL)
     - `anon public` key (SUPABASE_ANON_KEY)

### 2. **DEPLOY NO VERCEL (BACKEND + WEB)**

1. **Preparar projeto:**
   ```bash
   # Instalar dependências do backend
   cd backend
   npm install @supabase/supabase-js
   
   # Voltar para raiz e instalar dependências web
   cd ..
   npm install
   ```

2. **Deploy no Vercel:**
   - Acesse: https://vercel.com
   - Conecte com GitHub ou faça upload do projeto
   - Configure variáveis de ambiente:
     - `SUPABASE_URL`: sua_url_do_supabase
     - `SUPABASE_ANON_KEY`: sua_chave_anonima
     - `JWT_SECRET`: ternos_supabase_2024
     - `NODE_ENV`: production

3. **Após deploy:**
   - Anote a URL: `https://seu-projeto.vercel.app`

### 3. **CONFIGURAR MOBILE (EXPO)**

1. **Atualizar URL da API:**
   - Edite `mobile/src/services/api.js`
   - Troque por sua URL do Vercel:
   ```javascript
   const API_BASE_URL = 'https://seu-projeto.vercel.app/api';
   ```

2. **Deploy mobile gratuito:**
   ```bash
   cd mobile
   npm install -g @expo/cli
   npx expo login
   npx expo publish
   ```

3. **Gerar APK (opcional):**
   ```bash
   npx expo build:android
   ```

### 4. **TESTAR TUDO**

1. **Testar API:**
   - Acesse: `https://seu-projeto.vercel.app/api/test`
   - Deve retornar: `{"message": "API funcionando!"}`

2. **Testar Web:**
   - Acesse: `https://seu-projeto.vercel.app`
   - Login: `admin` / `password`

3. **Testar Mobile:**
   - Abra o app Expo Go
   - Escaneie o QR code
   - Login: `admin` / `password`

## ✅ CHECKLIST FINAL

- [ ] Supabase configurado
- [ ] Tabelas criadas no banco
- [ ] Vercel configurado
- [ ] Variáveis de ambiente definidas
- [ ] Deploy realizado
- [ ] Mobile atualizado
- [ ] Testes realizados

## 🔧 SOLUÇÃO DE PROBLEMAS

**Erro de CORS:**
- Verificar se as URLs estão corretas
- Confirmar variáveis de ambiente

**Erro de banco:**
- Verificar credenciais do Supabase
- Confirmar se as tabelas foram criadas

**Mobile não conecta:**
- Verificar URL da API no código
- Testar API no navegador primeiro

## 💰 CUSTOS (TUDO GRATUITO!)

- **Supabase:** Gratuito até 500MB
- **Vercel:** Gratuito para projetos pessoais
- **Expo:** Gratuito para desenvolvimento

## 📱 PRÓXIMOS PASSOS

1. **Domínio personalizado (opcional):**
   - Configurar no Vercel
   - Atualizar URL no mobile

2. **Melhorias:**
   - Adicionar notificações push
   - Implementar backup automático
   - Adicionar analytics

## 🆘 SUPORTE

Se tiver problemas:
1. Verificar logs no Vercel
2. Testar API endpoints individualmente
3. Confirmar credenciais do Supabase