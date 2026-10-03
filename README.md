# Polish & Glow — site, marcações online e painel

Site do salão, marcação online pensada para telemóvel e painel privado para gerir agenda, clientes, serviços, equipa, fotos e relatórios.

- **Site público** (`/`): serviços, galeria a passar sozinha, opiniões, contactos e WhatsApp.
- **Marcação online** (`/marcar`): serviço → técnica → dia → hora → dados. Sem criar conta.
- **Link privado da cliente** (`/m/…`): ver, remarcar, cancelar e adicionar ao calendário.
- **Painel** (`/admin`): visão geral, agenda (dia/semana), marcações, clientes, serviços e equipa, “O Meu Site” (logótipo, fotos, contactos, horário, opiniões), notificações e relatórios.
- **Avisos**: email para a cliente (confirmação + lembrete na véspera), email e notificação no telemóvel para o salão a cada marcação nova. **SMS em pausa** (pode ligar mais tarde).

Tudo em português de Portugal, preços em euros, fuso horário de Lisboa.

---

## Pôr o site online (passo a passo, sem programar)

Vai precisar de três contas **grátis**: [GitHub](https://github.com) (já tem), [Vercel](https://vercel.com) (onde o site corre) e [Supabase](https://supabase.com) (a base de dados). Para os emails, uma conta grátis na [Resend](https://resend.com).

### 1. Base de dados (Supabase)
1. Entre em supabase.com › **New project**. Escolha uma região na Europa e guarde a password da base de dados.
2. No projeto: **Connect** (botão no topo) › **Connection string**.
3. Copie a ligação **Transaction pooler** (porta 6543) — será o `DATABASE_URL`.
4. Copie a ligação **Session pooler** (porta 5432) — será o `DIRECT_URL`.
5. Em ambas, troque `[YOUR-PASSWORD]` pela password do passo 1.

### 2. Site (Vercel)
1. Entre em vercel.com com a conta do GitHub › **Add New… › Project** › escolha o repositório **Nails** › **Import**.
2. Antes de carregar em *Deploy*, abra **Environment Variables** e acrescente:

| Nome | O que pôr |
|---|---|
| `DATABASE_URL` | ligação *Transaction pooler* do Supabase |
| `DIRECT_URL` | ligação *Session pooler* do Supabase |
| `AUTH_SECRET` | uma frase longa e aleatória (32+ caracteres) |
| `NEXT_PUBLIC_SITE_URL` | o endereço do site, ex.: `https://nails.vercel.app` (depois troca pelo domínio) |
| `ADMIN_EMAIL` | o seu email para entrar no painel |
| `ADMIN_NAME` | o seu nome |
| `ADMIN_PASSWORD` | a password do painel (10+ caracteres) |
| `CRON_SECRET` | outra frase secreta qualquer |

3. Carregue em **Deploy**. Na primeira publicação o sistema cria sozinho as tabelas, os serviços e equipa de exemplo, e o seu acesso ao painel.
4. Abra `o-seu-site/admin`, entre com o email e a password, e mude tudo em **O Meu Site** e **Serviços e Equipa**.

### 3. Fotos (Vercel Blob)
1. No projeto da Vercel: **Storage › Create › Blob** › ligue-o ao projeto.
2. Isto acrescenta `BLOB_READ_WRITE_TOKEN` automaticamente. Vá a **Deployments › ⋯ › Redeploy**.

### 4. Emails (Resend)
1. Crie conta em resend.com › **Domains** › adicione o seu domínio e siga as instruções (ou use o endereço de testes deles enquanto não tiver domínio).
2. **API Keys › Create** › copie a chave.
3. Na Vercel acrescente `RESEND_API_KEY` (a chave) e `EMAIL_FROM` (ex.: `Polish & Glow <ola@polishandglow.pt>`) › Redeploy.
4. No painel › **Notificações** › “Testar email”.

### 5. Avisos no telemóvel da manicure
1. Acrescente na Vercel `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` e `VAPID_SUBJECT` (`mailto:o-seu-email`). As chaves geram-se com `npx web-push generate-vapid-keys`. Redeploy.
2. No telemóvel, abra o painel:
   - **iPhone**: Safari › Partilhar › “Adicionar ao ecrã principal”. Abra pelo ícone novo.
   - **Android**: Chrome › menu › “Instalar app”.
3. Painel › **Notificações** › “Ativar avisos neste aparelho” › “Testar aviso”.

### 6. Domínio (opcional)
Na Vercel › **Settings › Domains** › acrescente `polishandglow.pt` e siga as instruções. Depois atualize `NEXT_PUBLIC_SITE_URL` e faça Redeploy.

### Lembretes na véspera
Já estão configurados (`vercel.json`): todos os dias às 17h UTC (18h em Lisboa no inverno) o sistema envia o email de lembrete das marcações do dia seguinte.

---

## Ligar os SMS mais tarde
1. Crie conta na Twilio e acrescente `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_SENDER_ID` (ex.: `PolishGlow`) na Vercel.
2. Ligue a opção `sms_enabled` (coluna da tabela `site_settings`). Os textos já estão prontos e sem acentos para caberem em 1 SMS.

---

## Para programadores

```bash
cp .env.example .env.local   # preencher DATABASE_URL, DIRECT_URL, AUTH_SECRET…
npm install
npm run db:migrate           # migrações + dados de exemplo + admin (ADMIN_*)
npm run dev                  # http://localhost:3000
npm test                     # testes da disponibilidade/horas
npm run typecheck
```

Sem `RESEND_API_KEY` os emails aparecem só nos registos; sem `BLOB_READ_WRITE_TOKEN` as fotos ficam em `public/uploads` (só em desenvolvimento).

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · PostgreSQL · Drizzle ORM · Resend (email) · Web Push · Vercel Blob · Twilio (SMS, em pausa).

**Estrutura**
```
src/app/                 páginas (site, /marcar, /m/[token], /admin/…) e API (/api/…)
src/components/          site/, booking/, admin/ e ícones
src/db/schema.ts         modelo de dados
src/lib/availability.ts  motor de disponibilidade (função pura, testada)
src/lib/booking.ts       criar/remarcar/cancelar (preço sempre calculado no servidor)
src/lib/notify/          email, notificações no telemóvel, SMS (em pausa) e textos
drizzle/                 migrações SQL (inclui a regra que impede marcações sobrepostas)
scripts/                 migrate (+seed +admin), seed, create-admin
tests/                   testes
```

**Regras importantes**
- **Sem marcações duplicadas:** a base de dados tem uma restrição `EXCLUDE` (btree_gist) que impede duas marcações ativas sobrepostas para a mesma técnica, mesmo com pedidos em simultâneo.
- **Preço nunca vem do browser:** o servidor lê preço e duração da tabela de serviços.
- **Datas:** tudo guardado em UTC e mostrado em Europe/Lisbon (mudança de hora tratada).
- **Segurança:** painel com sessão assinada (cookie httpOnly), passwords com bcrypt, limites de tentativas, links privados das clientes guardados só como hash, validação com Zod, segredos apenas no servidor.
- **RGPD:** consentimento guardado com data; página `/privacidade` com texto base (reveja antes de publicar); link para o Livro de Reclamações no rodapé.
