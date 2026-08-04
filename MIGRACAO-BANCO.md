# Migração do catálogo: localStorage → Firestore

O site nasceu guardando tudo no `localStorage` do navegador. Isso significa que
cada visitante vê o próprio catálogo: um produto cadastrado no painel não
aparece para mais ninguém, e um lead registrado fica preso no aparelho do
cliente.

Este documento descreve a virada para o Firestore, que já está implementada
mas **desligada por padrão**.

## Estado atual

| Camada | Situação |
| --- | --- |
| Persistência no backend | ✅ Firestore (`src/services/dbClient.ts`) |
| API de catálogo | ✅ `GET /api/v1/products` — pública, com ETag e delta sync |
| API de escrita | ✅ `PUT/DELETE /api/v1/products/admin` — exige token Firebase com role `admin` |
| Vitrine do site | ⚙️ Atrás da chave `VITE_USE_API_CATALOG` (padrão: `localStorage`) |
| Painel admin | ❌ Ainda grava no `localStorage` — depende do login real (ver abaixo) |
| Vendedores, configurações, leads | ❌ Ainda no `localStorage` |

## Por que a chave existe

Ligar a vitrine na API antes do backend estar servindo o catálogo deixa o site
**sem produtos**. Como o site está no ar e funcionando, a virada é explícita e
reversível: você liga quando confirmar que o backend responde.

Com a chave ligada não há retorno silencioso ao `localStorage`. Se a API falhar,
a loja diz na tela que não conseguiu carregar e oferece o WhatsApp. Exibir preço
antigo como se fosse o vigente seria pior — o cliente fecharia negócio por um
valor que não vale mais.

## Passo a passo da virada

**1. Credenciais.** Crie uma service account em
Firebase Console → Configurações do projeto → Contas de serviço → Gerar nova
chave privada. Preencha no ambiente da função (não no repositório):

```
FIREBASE_PROJECT_ID=paris-dakar-rodas-pneus
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@....iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**2. Crie o banco.** Firebase Console → Firestore Database → Criar banco de
dados (modo produção). Publique as regras e os índices:

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

As regras negam todo acesso direto de cliente — o site fala com a API, que usa
o Admin SDK. Uma chave pública da Web vazada não alcança o catálogo.

**3. Confirme a conexão.** Depois de publicar a função:

```bash
curl https://www.parisdakarrodas.com.br/health/db
```

Só siga quando `"status": "ok"` e `"persistent": true`.

**4. Semeie o catálogo.**

```bash
npm run seed:catalog
```

Idempotente: grava por SKU, então rodar de novo atualiza em vez de duplicar.

**5. Confira que a API devolve os produtos.**

```bash
curl "https://www.parisdakarrodas.com.br/api/v1/products?limit=3"
```

**6. Ligue a chave e publique.** Defina `VITE_USE_API_CATALOG=true` no ambiente
de build (no workflow do GitHub Actions, em `env:`) e faça o deploy.

**Para reverter:** volte a chave para `false` e publique. A loja retoma o
`localStorage` na hora.

## O que falta

**O painel admin ainda grava no `localStorage`.** Enquanto isso não mudar, o
que você cadastrar no painel não vai para o Firestore nem aparece para os
visitantes com a chave ligada.

Isso não é acidente de escopo: as rotas de escrita exigem um token Firebase
com a claim `admin`, e hoje o login de administrador é falso — as senhas estão
no código do navegador (`AuthModal.tsx`), e existe um botão que concede acesso
sem senha nenhuma. Qualquer visitante que abra o DevTools vira administrador.

Ligar o painel na API exige, antes, trocar esse login por Firebase Auth real e
atribuir a claim de role com `npm run set-admin`. É a próxima etapa, e ela
fecha a falha de segurança junto.

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
