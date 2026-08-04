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
| Login administrativo | ✅ Firebase Auth com claim `role: admin` |
| Painel admin | ❌ Ainda grava no `localStorage` — falta trocar as chamadas pela API |
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

## O que falta

**O painel admin ainda grava no `localStorage`.** As rotas de escrita da API já
existem e já exigem token, e o `authService.getIdToken()` já fornece esse token
— falta trocar as chamadas do `storageService` por `catalogApi` dentro do
`AdminDashboard`.

Vendedores, configurações do site e leads também continuam locais.

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
