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

## 5. Variáveis de ambiente do backend

Copie `.env.example` para `.env` e preencha. Em produção (Cloud Functions), o
Admin SDK usa as credenciais padrão do ambiente — `FIREBASE_PRIVATE_KEY` só é
necessária para execução fora do Google Cloud (servidor próprio, scripts locais
como `set-admin`).

## 6. Pendência conhecida (importante)

O frontend **ainda não usa o Firebase Auth**: `AuthModal` valida login contra o
`localStorage` (`src/services/storageService.ts`) e existe uma credencial de
administrador fixa no código do cliente. Isso significa que:

- as regras acima protegem o Firestore/Storage, mas o painel administrativo do
  site ainda pode ser aberto por quem inspecionar o bundle JavaScript;
- nenhum dado real trafega pelo Firestore hoje — tudo vive no navegador.

Próximo passo recomendado: migrar `AuthModal`/`storageService` para o SDK web do
Firebase (`signInWithEmailAndPassword` + `onAuthStateChanged`), passar a ler e
gravar o catálogo no Firestore e remover as credenciais fixas do código.
