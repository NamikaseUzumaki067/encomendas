# 📦 Nova Saúde --- Sistema de Controle de Encomendas

Sistema web para controle de encomendas com autenticação no Supabase,
dashboard operacional, histórico de pedidos, notificações e estrutura
pronta para evolução SaaS multiempresa.

------------------------------------------------------------------------

## ✨ Funcionalidades

-   Cadastro de encomendas
-   Dashboard com contadores por status
-   Histórico com filtros
-   Atualização de status e data de chegada
-   Exportação CSV
-   Impressão / geração de PDF pelo navegador
-   Autenticação com Supabase
-   Tema dark / light
-   PWA com service worker
-   Base preparada para segregação por empresa

------------------------------------------------------------------------

## 🧱 Arquitetura

HTML └── js/app.js ├── core/ ├── data/ ├── pages/ └── services/

### Estrutura principal

/css styles.css

/js app.js chart.js theme.js

/core layout.js router.js ui.js

/data api.js auth.js storage.js

/pages dashboard.js historico.js login.js register.js

/services audit.js export.js

index.html historico.html login.html register.html manifest.webmanifest
sw.js README.md

------------------------------------------------------------------------

## 🛠 Tecnologias

-   HTML5
-   CSS3
-   JavaScript ES Modules
-   Supabase
-   Service Worker
-   PWA

------------------------------------------------------------------------

## 🔐 Modelo de dados

### companies

Armazena as empresas do sistema.

### profiles

Relaciona usuários autenticados com empresa e perfil de acesso.

### orders

Armazena os pedidos da empresa.

Campos principais: - company_id - user_id - cliente - produto - status -
data_pedido - data_chegada

------------------------------------------------------------------------

## 🔒 Segurança

-   Row Level Security (RLS)
-   Policies por empresa
-   Usuário acessa apenas dados da própria empresa

------------------------------------------------------------------------

## ⚙️ Configuração do Supabase

Adicione antes do carregamento do app:

```{=html}
<script>
window.__ENV__ = {
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "SUA_ANON_KEY"
};
</script>
```

------------------------------------------------------------------------

## ▶️ Executando localmente

git clone https://github.com/NamikaseUzumaki067/encomendas.git

cd encomendas

npx serve .

------------------------------------------------------------------------

## 📱 PWA

O sistema pode ser instalado como aplicativo.

------------------------------------------------------------------------

## 🚀 Roadmap

-   multiempresa completo
-   convite de usuários
-   painel admin
-   métricas avançadas

------------------------------------------------------------------------

## 📄 Licença

MIT