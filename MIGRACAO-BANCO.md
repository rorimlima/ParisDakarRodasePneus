# Migração do catálogo: localStorage → Firestore

O site nasceu guardando tudo no `localStorage` do navegador. Isso significa que
cada visitante vê o próprio catálogo: um produto cadastrado no painel não
aparece para mais ninguém, e um lead registrado fica preso no aparelho do
cliente.

## Estado atual — VIRADA CONCLUÍDA

Com o catálogo real já carregando mais de mil produtos no Firestore
(cadastrados via importação de planilha, antes desta virada), a vitrine e o
painel foram ligados à API de forma definitiva. O pipeline de deploy passou a
publicar Hosting, Cloud Function, regras do Firestore e índices compostos
**juntos, a cada push** — antes só o Hosting ia automaticamente, e o resto
dependia de deploy manual esquecível.

| Camada | Situação |
| --- | --- |
| Persistência no backend | ✅ Firestore (`src/services/dbClient.ts`) — 1000+ produtos reais |
| API de catálogo | ✅ `GET /api/v1/products` — pública, com ETag e delta sync |
| API de escrita | ✅ `PUT/DELETE /api/v1/products/admin` — exige token Firebase com role `admin` |
| Vitrine do site | ✅ `VITE_USE_API_CATALOG=true` no workflow — lê o Firestore, não mais `localStorage` |
| Login administrativo | ✅ Firebase Auth com claim `role: admin` |
| Painel admin | ✅ Grava pela API (mesma chave da vitrine) |
| Deploy | ✅ `firebase deploy --only hosting,functions,firestore:rules,firestore:indexes` a cada push |
| Vendedores, configurações, leads | ❌ Ainda no `localStorage` |

### Por que era seguro ligar com dados reais já em produção

O único caminho de código que já escreveu produtos no Firestore é
`dbClient.upsertBySku` — não existe nenhum outro. Os 1000+ registros só
puderam entrar por ali (importação de planilha, `PUT /api/v1/products/admin`),
o que garante que o formato gravado já é exatamente o que a API de leitura e o
storefront esperam. Não houve necessidade de escrever ou migrar nada — só de
fechar o pipeline que faltava.

A importação em massa por planilha não carrega foto nem veículos compatíveis
(a planilha não tem essas colunas), então produtos importados assim aparecem
com um selo "FOTO EM CADASTRO" no lugar da imagem (`src/utils/productImage.ts`)
em vez de ícone de imagem quebrada. Isso é visual, não estrutural — cadastre a
foto e os veículos pelo painel quando quiser completar o item.

### Auditoria antes de qualquer novo push que mexa nisso

```bash
npm run verify:prod -- https://www.parisdakarrodas.com.br
```

Só lê — não grava nada. Confere `/health/db`, valida o formato de uma amostra
do catálogo real contra o que o storefront espera, testa ETag/304, e avisa
qualidade de dado (fotos e specs faltando). Falha estrutural sai com código de
saída 1. Rode antes de reintroduzir a chave se algum dia ela for desligada e
religada, ou depois de qualquer mudança no schema do produto.

### Rollback

Uma linha: `VITE_USE_API_CATALOG: 'true'` → `'false'` no workflow
(`.github/workflows/firebase-hosting-deploy.yml`), commit, push. A loja volta
a ler do `localStorage` no deploy seguinte — não apaga nem toca no Firestore.

### Segredos necessários no GitHub (Settings → Secrets and variables → Actions)

| Secret | Já existia? | Para quê |
| --- | --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_PARIS_DAKAR_RODAS_PNEUS` | Sim | Autentica o `firebase deploy` no CI |
| `VITE_FIREBASE_API_KEY` | **Não — precisa criar** | Config Web do Firebase Auth (pública por design, mas fica em secret por padronização) |

**Atenção de permissão (IAM) — bloqueio confirmado em produção:** o primeiro
deploy deste pipeline (run do GitHub Actions, commit `48787af`) falhou
exatamente aqui. Índices e regras do Firestore chegaram a ser publicados; a
função `api` não:

```
Error: Missing required permission on project paris-dakar-rodas-pneus to
deploy new HTTPS functions. The permission cloudfunctions.functions.setIamPolicy
is required to deploy the following functions: api

To address this error, please ask a project Owner to assign your account the
"Cloud Functions Admin" role at the following URL:
https://console.cloud.google.com/iam-admin/iam?project=paris-dakar-rodas-pneus
```

O service account `FIREBASE_SERVICE_ACCOUNT_PARIS_DAKAR_RODAS_PNEUS` foi
criado só para Hosting. Deploy de função com trigger HTTPS (a função `api` é
Gen2/Cloud Run por baixo) exige poder alterar a política de IAM do invoker —
é isso que falta. `Cloud Functions Developer` **não é suficiente** (não inclui
`setIamPolicy`); é preciso `Cloud Functions Admin` mesmo, como o próprio
Firebase indicou.

**Correção, feita por um Owner do projeto**, no link acima:
1. Encontre o service account (e-mail termina em
   `...iam.gserviceaccount.com`, o mesmo cujo JSON está no secret do GitHub).
2. Adicione a role **Cloud Functions Admin**.
3. Se ainda faltar permissão numa tentativa seguinte, adicione também
   **Service Account User** (necessária para o Cloud Build implantar em nome
   da função).

Não tenho como conceder essas roles por aqui — só um Owner do projeto no
Console consegue. Depois de concedida, me avise: eu reexecuto o workflow sem
precisar de novo push.

## Criar o administrador

O login antigo era falso: as senhas estavam no código do navegador e havia um
botão que concedia acesso sem senha alguma. Isso foi removido. Agora o acesso
depende de uma conta real com a claim `role: admin`.

**1. Habilite o provedor.** Firebase Console → Authentication → Sign-in method
→ ative *E-mail/senha*.

**2. Crie a conta.** Authentication → Users → Add user. Use um e-mail real e
uma senha forte, gerada por gerenciador de senhas. Copie o **UID**.

**3. Conceda a permissão de administrador:**

```bash
npm run set-admin <UID_COPIADO>
```

Sem esse passo a conta autentica mas **não** abre o painel — é o que impede
que qualquer usuário do projeto vire administrador.

**4. Publique com a config Web** (Console → Configurações do projeto → Seus
apps → Web). Estas variáveis entram no build:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=paris-dakar-rodas-pneus.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=paris-dakar-rodas-pneus
```

Elas são públicas por design e ficam visíveis no bundle — não são segredo. O
que protege o painel é a claim, que só o Admin SDK atribui. Sem elas, o login
administrativo aparece indisponível na tela.

> Para revogar um acesso: Authentication → Users → desativar ou excluir a
> conta. O painel fecha sozinho na sessão aberta, porque o token deixa de ser
> válido.

## O painel e a vitrine compartilham a mesma chave

`VITE_USE_API_CATALOG` governa os dois lados através de
`src/services/catalogRepository.ts`. Isso é proposital: se o painel gravasse
na API enquanto a loja lê do `localStorage` (ou o contrário), o administrador
veria um catálogo e o cliente veria outro. Hoje os dois estão em `true`.

Com a chave ligada, toda gravação do painel (criar, editar, ativar/desativar,
excluir, importar planilha) recarrega a lista a partir do servidor depois de
salvar — a tela nunca mostra um "sucesso" otimista que não foi de fato
confirmado pela API. Se a gravação falhar (token expirado, validação, rede),
o painel mantém o estado anterior e mostra o motivo.

Verificado com login real contra os emuladores de Auth e Firestore: o login
abre o painel, uma edição de estoque disparou o `PUT` autenticado, e o valor
gravado foi conferido direto no Firestore.

## O que falta

Vendedores, configurações do site e leads continuam no `localStorage`. São o
próximo lote a migrar, seguindo o mesmo padrão desta seção: repositório com
chave de corte, teste HTTP de autorização, verificação no navegador.

## Desenvolvimento local

```bash
npm run emulator                       # Firestore em 127.0.0.1:8080
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run seed:catalog
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 npm run dev

npm run test:db                        # 26 verificações contra o emulador
npm run check:db                       # diagnóstico da camada de dados
```

Contra o emulador o Admin SDK sobe sem credencial. O `test:db` se recusa a
rodar fora do emulador, porque ele apaga a coleção de produtos.
