# Firebase — Autenticação, Regras e Deploy

Projeto: **paris-dakar-rodas-pneus** (definido em `.firebaserc`).

## 1. Modelo de autorização

A autorização é baseada em **Custom Claims** do Firebase Auth, não em campos de
documento. O claim `role` viaja assinado dentro do JWT e não pode ser forjado
pelo navegador.

| Papel | Como é atribuído | O que pode fazer |
| --- | --- | --- |
| visitante (sem login) | — | ler catálogo, configurações do site e vendedores |
| `client` (padrão) | qualquer usuário autenticado sem claim | ler/editar o próprio cadastro, criar orçamentos, ler os próprios pedidos |
| `admin` | `npm run set-admin <UID>` | gerenciar catálogo, contas B2B, descontos e importação de estoque |

Para promover um usuário a administrador (exige as credenciais de serviço no `.env`):

```bash
npm run set-admin <UID_DO_USUARIO>
```

O usuário precisa renovar o token (`getIdToken(true)` ou novo login) para o
claim passar a valer.

## 2. Arquivos de regras

| Arquivo | Cobre |
| --- | --- |
| `firestore.rules` | Firestore — negação por padrão; toda coleção não declarada é inacessível pelo SDK cliente |
| `storage.rules` | Cloud Storage — leitura pública só do catálogo/branding; upload com validação de tipo e tamanho |
| `firestore.indexes.json` | Índices compostos das consultas de catálogo, pedidos e orçamentos |

Pontos de proteção mais importantes já cobertos por teste automatizado:

- Catálogo é público para leitura e **somente admin** grava (com validação de `price`/`stockQuantity` não negativos).
- Cadastro de cliente é isolado por UID; um usuário não lê nem edita o cadastro de outro.
- Autocadastro B2B nasce obrigatoriamente com `status: 'pending'` e `discountPercentage: 0` — só o admin aprova e define desconto.
- `orders` é **somente leitura** no cliente: valores financeiros só são gravados pelo backend (Admin SDK), que ignora as regras.
- `adminUsers` não aceita escrita nem de admin pelo navegador — a promoção acontece apenas via Admin SDK.
- Nenhuma escrita do cliente pode conter os campos `role`, `isAdmin`, `claims` ou `grantedBySenior`.

### Testar as regras localmente

```bash
npm run test:rules
```

Sobe o emulador do Firestore, carrega `firestore.rules` e executa
`src/tests/firestore.rules.test.mjs` (24 casos de permissão/negação). Requer Java
instalado — é o runtime do emulador.

## 3. Build

| Comando | Saída | Para quê |
| --- | --- | --- |
| `npm run build` | `lib/` | backend TypeScript → Cloud Function `api` (`tsconfig.server.json`) |
| `npm run build:client` | `dist/` | SPA React via Vite → Firebase Hosting |
| `npm run typecheck` | — | checagem de tipos do frontend |

As duas saídas são separadas de propósito: `dist/` é publicado no Hosting e
`lib/` é empacotado na Cloud Function (`main` do `package.json`).

## 4. Deploy

Requer login uma única vez na máquina:

```bash
npx firebase login
```

Depois:

```bash
npm run deploy          # regras + índices + storage + hosting + functions
npm run deploy:rules    # apenas firestore rules/indexes + storage rules
npm run deploy:hosting  # apenas o site
```

Em CI/CD (sem navegador), autentique com uma conta de serviço:

```bash
export GOOGLE_APPLICATION_CREDENTIALS=/caminho/service-account.json
npx firebase deploy --only firestore:rules,firestore:indexes,storage,hosting,functions --project paris-dakar-rodas-pneus
```

Os `predeploy` do `firebase.json` já rodam o build correspondente antes de cada
alvo, então não é preciso buildar manualmente.

## 5. Deploy automático pelo GitHub Actions

| Workflow | Quando roda | O que faz |
| --- | --- | --- |
| `.github/workflows/ci.yml` | pull request e push fora da `main` | typecheck, build do backend e do site, testes das regras |
| `.github/workflows/firebase-deploy.yml` | push na `main` e execução manual | roda os testes das regras e publica no Firebase |

Secrets necessários no repositório (**Settings → Secrets and variables → Actions**):

| Secret | Conteúdo |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | JSON completo de uma conta de serviço com os papéis *Firebase Admin* e *Cloud Functions Admin* |
| `VITE_FIREBASE_API_KEY` e demais `VITE_FIREBASE_*` | mesmos valores do `.env` do frontend, usados no build do site |

A execução manual (**Actions → Deploy Firebase → Run workflow**) aceita mudar os
alvos, por exemplo `firestore:rules,storage` para publicar só as regras.

## 6. Autenticação no frontend

O login usa o SDK Web do Firebase (`src/config/firebaseClient.ts` +
`src/services/authService.ts`):

- **Entrada por e-mail e senha** nas três abas (CPF, CNPJ e Admin). O CPF/CNPJ
  continua sendo coletado no cadastro e gravado no perfil, mas o identificador de
  login é o e-mail — é o que o Firebase Auth autentica.
- **Cadastro B2C** cria a conta e o documento `clients/{uid}`.
- **Cadastro B2B** cria `b2bAccounts/{uid}` sempre com `status: 'pending'` e
  `discountPercentage: 0`; as regras rejeitam qualquer tentativa de nascer
  aprovado. A liberação do desconto é feita pelo administrador.
- **Aba Admin** só entra se o token trouxer o claim `role: admin`; qualquer outra
  conta é deslogada na hora, mesmo com a senha correta.
- A sessão vem de `onAuthStateChanged` — recarregar a página mantém o login e
  `signOut` encerra de verdade. O antigo `pd_user_session` do `localStorage` é
  apagado na inicialização.
- "Esqueci minha senha" dispara o e-mail de redefinição do próprio Firebase.

### Preparar o ambiente pela primeira vez

1. No Console do Firebase, **Authentication → Sign-in method**, habilite
   *E-mail/senha*.
2. Preencha as variáveis `VITE_FIREBASE_*` no `.env` (valores em
   *Configurações do projeto → Seus apps → App da Web*). Sem elas o site exibe um
   aviso no modal de acesso e o login fica desabilitado.
3. Crie a conta do administrador pelo próprio site (aba Cliente CPF) ou pelo
   Console, copie o UID em *Authentication → Users* e rode:

   ```bash
   npm run set-admin <UID>
   ```

4. Saia e entre de novo na aba **Painel Admin** — o token novo já vem com o claim.

## 7. Variáveis de ambiente do backend

Copie `.env.example` para `.env` e preencha. Em produção (Cloud Functions), o
Admin SDK usa as credenciais padrão do ambiente — `FIREBASE_PRIVATE_KEY` só é
necessária para execução fora do Google Cloud (servidor próprio, scripts locais
como `set-admin`).

## 8. Pendência conhecida

Catálogo, configurações do site, vendedores e orçamentos ainda vivem no
`localStorage` (`src/services/storageService.ts`). As coleções e regras
correspondentes já existem no Firestore; falta trocar o `storageService` por
leituras e escritas reais para que o conteúdo passe a ser compartilhado entre
dispositivos em vez de ficar preso ao navegador de quem cadastrou.
