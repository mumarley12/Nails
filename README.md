# Luxe Nails by MVN — site, marcações online e painel

Site da Matilde (Luxe Nails, Agualva-Cacém), marcação online pensada para telemóvel e painel privado para gerir agenda, clientes, serviços, fotos e relatórios.

- **Site público** (`/`): serviços, portefólio a passar sozinho, preços, opiniões, contactos e WhatsApp.
- **Marcação online** (`/marcar`): serviço → dia → hora → dados. Sem criar conta.
- **Link privado da cliente** (`/m/…`): ver, remarcar, cancelar e adicionar ao calendário.
- **Painel** (`/admin`): visão geral, agenda (dia/semana), marcações, clientes, serviços e preços, “O Meu Site” (logótipo, fotos, contactos, horário, opiniões), notificações e relatórios.
- **Avisos**: email para a cliente (confirmação + lembrete na véspera), email e notificação no telemóvel para a Matilde a cada marcação nova. **SMS em pausa** (pode ligar mais tarde).

Tudo em português de Portugal, preços em euros, fuso horário de Lisboa.

---

## Onde está alojado (tudo no plano grátis)

- **Site:** [Netlify](https://netlify.com) — projeto `polish-and-glow` (o plano grátis permite uso comercial). Publica sozinho sempre que há alterações no ramo `main` do GitHub.
- **Base de dados:** [Supabase](https://supabase.com) — projeto `polish-and-glow` (Paris). O site liga-se com um utilizador próprio (`salon_app`) e as tabelas estão fechadas à API pública da Supabase.
- **Fotos:** Netlify Blobs (automático, sem configuração).
- **Lembretes na véspera:** função agendada da Netlify (`netlify/functions/lembretes.mts`), todos os dias às 17h UTC.

Em cada publicação, o comando de build (`netlify.toml`) aplica as migrações, cria os dados de exemplo se a base estiver vazia e o primeiro acesso ao painel a partir de `ADMIN_EMAIL` + `ADMIN_PASSWORD`.

### Variáveis de ambiente (Netlify › Project configuration › Environment variables)

| Nome | Para quê |
|---|---|
| `DATABASE_URL` | ligação à Supabase pelo *transaction pooler* (porta 6543) |
| `DIRECT_URL` | ligação à Supabase pelo *session pooler* (porta 5432), usada nas migrações |
| `AUTH_SECRET` | assinatura da sessão do painel (32+ caracteres) |
| `NEXT_PUBLIC_SITE_URL` | endereço público do site, sem barra no fim |
| `ADMIN_EMAIL` / `ADMIN_NAME` / `ADMIN_PASSWORD` | primeiro acesso ao painel — no 1.º login o painel pede uma password nova (muda-se depois em **A minha conta**) |
| `CRON_SECRET` | protege o envio dos lembretes |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | avisos no telemóvel da Matilde |
| `RESEND_API_KEY` / `EMAIL_FROM` | emails (opcional até configurar a [Resend](https://resend.com)) |

### Avisos no telemóvel da manicure
- **iPhone**: Safari › Partilhar › “Adicionar ao ecrã principal”. Abra o painel pelo ícone novo.
- **Android**: Chrome › menu › “Instalar app”.
- Depois: painel › **Notificações** › “Ativar avisos neste aparelho” › “Testar aviso”.

### Domínio próprio (opcional)
Netlify › **Domain management** › acrescente o domínio e siga as instruções. Depois atualize `NEXT_PUBLIC_SITE_URL` e publique de novo.

### Nota sobre a Supabase grátis
Um projeto grátis é pausado após 1 semana sem atividade. Com marcações e o lembrete diário isso não deve acontecer; se acontecer, reative-o no painel da Supabase.

---

## Ligar os SMS mais tarde
1. Crie conta na Twilio e acrescente `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_SENDER_ID` (ex.: `PolishGlow`) na Netlify.
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

Sem `RESEND_API_KEY` os emails aparecem só nos registos; fora da Netlify as fotos ficam em `public/uploads` (só em desenvolvimento).

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · PostgreSQL (Supabase) · Drizzle ORM · Resend (email) · Web Push · Netlify (site, Blobs, função agendada) · Twilio (SMS, em pausa).

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
- **Sem marcações duplicadas:** a base de dados tem uma restrição `EXCLUDE` (btree_gist) que impede duas marcações ativas sobrepostas na agenda, mesmo com pedidos em simultâneo.
- **Preço nunca vem do browser:** o servidor lê preço e duração da tabela de serviços.
- **Datas:** tudo guardado em UTC e mostrado em Europe/Lisbon (mudança de hora tratada).
- **Segurança:** painel com sessão assinada (cookie httpOnly), passwords com bcrypt, limites de tentativas, links privados das clientes guardados só como hash, validação com Zod, segredos apenas no servidor.
- **RGPD:** consentimento guardado com data; página `/privacidade` com texto base (reveja antes de publicar); link para o Livro de Reclamações no rodapé.
