# Catálogo Paris Dakar no Firebase

Guia da camada de dados: como o catálogo é modelado, como a planilha do ERP entra
no sistema e como as permissões são aplicadas.

---

## 1. Modelo de dados

| Coleção         | Documento         | Quem lê                        | Conteúdo |
|-----------------|-------------------|--------------------------------|----------|
| `products`      | `{Produto_Codigo}`| **público**, só `ativo == true`| catálogo exibido no site |
| `productCosts`  | `{Produto_Codigo}`| **sênior e gerência**          | `ValorReposicao` e derivados |
| `categories`    | `{slug}`          | público                        | taxonomia + schema da ficha técnica |
| `imports`       | `{importId}`      | equipe administrativa          | relatório de cada importação |
| `settings`      | `site`            | público                        | textos e contatos |
| `users`         | `{uid}`           | próprio usuário + equipe       | perfil (papel real vive no custom claim) |
| `inquiries`     | auto              | equipe administrativa          | cotações vindas do site |
| `auditLog`      | auto              | sênior e gerência              | trilha de auditoria (só Admin SDK escreve) |

### Por que o custo mora em outra coleção

Firestore não filtra campos na leitura: quem pode ler o documento lê **todos** os
campos dele. Se `ValorReposicao` estivesse dentro de `products`, qualquer visitante
extrairia a margem de todo o estoque com três linhas de SDK no console do navegador —
nenhuma regra de front-end impediria isso. Separando em `productCosts`, a regra de
leitura é aplicada no servidor e o custo simplesmente não trafega para quem não tem
o papel `senior` ou `gerencia`.

### Mapeamento das colunas da planilha

| Coluna do ERP                     | Campo no Firestore              | Uso |
|-----------------------------------|---------------------------------|-----|
| `Produto_Codigo`                  | `products/{id}`, `codigo`       | código exibido no painel **e** no site |
| `Produto_Descricao`               | `descricao`                     | nome do produto |
| `Produto_DescricaoDetalhada`      | `descricaoDetalhada`            | texto da ficha |
| `TipoProduto_Descricao`           | `tipoProduto` → `categoriaSlug` | gera as categorias do site |
| `Unidade_Sigla`                   | `unidade`, `unidadeLabel`       | UN, PR, JG, KT, PC, LT, CX, PT, SR |
| `ProdutoEstoque_QtdeDisponivel`   | `quantidade`                    | zerou ⇒ sai do site |
| `ValorVenda`                      | `valorVenda`                    | preço público |
| `ValorReposicao`                  | `productCosts/{id}`             | **restrito**: gerência e simulação de desconto |
| `ProdutoMarca_Referencia`         | `referencia`                    | referência do fabricante |
| `LocalizacaoProduto_Identificad`  | `localizacao`                   | endereço no estoque |

Campos preenchidos **manualmente** no painel e nunca sobrescritos pela importação:
`fichaTecnica`, `marcasAtendidas`, `modelosAtendidos`, `imagens`, `badge`,
`destaque` e `ativoManual`.

---

## 2. A invariante de publicação

```
ativo === ativoManual && quantidade > 0
```

Aplicada em **quatro camadas independentes**:

1. `normalizarEstadoPublicacao()` — toda escrita passa por ela no cliente;
2. `firestore.rules` — recusa gravação em que `ativo` não bata com a fórmula;
3. `onProdutoEscrito` (Cloud Function) — corrige escrita feita via Admin SDK,
   console do Firebase ou integração direta do ERP, que ignoram as rules;
4. `varreduraDeConsistencia` — cron diário às 04:00 que conserta o que escapou.

Consequência prática: **estoque zerado tira o produto do site automaticamente**, e o
botão "Ativar produto no site" fica bloqueado até haver reposição. Reposto o estoque,
o produto volta com o estado que o painel havia definido.

---

## 3. Ficha técnica por categoria

Cada categoria carrega em `campos[]` o schema do formulário que o painel exibe.
O schema é escolhido pelo **grupo** da categoria (`src/config/fichaTecnica.ts`):

| Grupo          | Campos principais |
|----------------|-------------------|
| `rodas`        | aro, **furação (PCD)**, tala, offset, center bore, material, acabamento, carga, peso, **marcas atendidas**, modelos, garantia |
| `pneus`        | medida, **tipo (MT/AT/HT/LT/RT)**, índice carga/velocidade, lonas, construção, banda, uso, DOT, garantia |
| `kits-lift`    | altura de elevação, posição, itens inclusos, material, alinhamento, **marcas**, modelos, garantia |
| `acessorios`   | tipo, material, medidas, lado, instalação, **marcas**, modelos, garantia |
| `pecas`        | sistema, posição, número OEM, fabricante, original, **marcas**, garantia |
| `iluminacao`   | tipo, potência, voltagem, lúmens, temperatura de cor, facho, IP, homologação |
| `engate`       | tipo, capacidade de tração, carga vertical, bola, **homologação Contran**, chicote |
| `capota`       | tipo, material, cor, santantônio, travamento, **marcas** |
| `fixacao`      | tipo, rosca, chave, assento, comprimento, peças/embalagem, **furação** |
| `lubrificantes`| tipo de fluido, viscosidade, volume, base, fabricante, validade |
| `usados`       | estado de conservação, vida útil, procedência, **avarias declaradas**, aro, furação |
| `consumo`      | aplicação, material, medidas, uso interno |
| `outros`       | aplicação, especificação, medidas, marcas |

`marcasAtendidas` é multisseleção — um alargador pode atender Toyota, Ford, Chevrolet
e Mitsubishi ao mesmo tempo, e o filtro "busca por veículo" do site usa exatamente
esse campo. Para editar os campos de uma categoria, use a aba
**Categorias & Ficha Técnica** do painel: o schema fica no Firestore e muda sem deploy.

---

## 4. Desconto à vista — teto de 8%

`simularDescontoAvista()` (`src/utils/pricing.ts`) aplica `Math.min(pedido, 8)`.
O corte é por *clamp*, não por validação de formulário: percentual negativo, `NaN`,
`Infinity` ou 500% resultam num valor sempre dentro da política.

Para quem tem acesso a custo, a simulação também devolve margem resultante, markup,
alerta de venda abaixo do custo e o **desconto máximo seguro** (o maior desconto que
ainda não fura o `ValorReposicao`, limitado aos mesmos 8%).

A proposta oficial é emitida pela Cloud Function `simularDesconto`, que lê preço e
custo direto do Firestore — o cliente envia apenas o código do produto e o percentual
pretendido, nunca valores.

---

## 5. Papéis

Papel vem de **custom claim** assinado pelo Firebase Auth, nunca de campo em documento.

| Papel      | Catálogo | Vê `ValorReposicao` | Concede papéis |
|------------|:--------:|:-------------------:|:--------------:|
| `senior`   | ✅ total | ✅ | ✅ |
| `gerencia` | ✅ total | ✅ | ❌ |
| `admin`    | ✅ opera | ❌ | ❌ |
| `b2b`      | leitura  | ❌ | ❌ |
| `b2c`      | leitura  | ❌ | ❌ |

Conceder papel:

```js
// no console do navegador, logado como sênior
const { getFunctions, httpsCallable } = await import('firebase/functions');
await httpsCallable(getFunctions(undefined, 'southamerica-east1'), 'definirPapel')({
  email: 'gerente@parisdakar.com.br',
  papel: 'gerencia'
});
```

O claim só passa a valer no próximo login (ou após `getIdToken(true)`).

---

## 6. Instalação

```bash
# 1. dependências
npm install
npm --prefix functions install

# 2. variáveis de ambiente
cp .env.example .env.local     # preencha com os dados do seu projeto Firebase

# 3. projeto Firebase
npx firebase login
npx firebase use --add          # cria o .firebaserc (fora do git)

# 4. publicar regras, índices e functions
npx firebase deploy --only firestore:rules,firestore:indexes,storage,functions

# 5. rodar local
npm run dev
```

Sem as variáveis `VITE_FIREBASE_*` o app cai no **modo local** (localStorage): tudo
funciona, inclusive a importação, mas os dados ficam só naquele navegador. O painel
sinaliza isso na barra de status. Não use assim em produção.

Emuladores:

```bash
npx firebase emulators:start --only auth,firestore,functions,storage
```

---

## 7. Importação da planilha

### Pelo painel (recomendado)

**Painel → 2. Importar Planilha do ERP** → arraste o `.xlsx` → *Simular* → *Importar*.

A simulação mostra o que vai acontecer sem gravar nada. A importação real:

1. lê a planilha inteira e valida o cabeçalho (aborta se faltar coluna obrigatória);
2. cria as categorias novas a partir de `TipoProduto_Descricao`;
3. cria os produtos que não existiam — **desativados**, à espera da ficha técnica;
4. atualiza descrição, unidade, quantidade e preço dos existentes;
5. desativa quem zerou o estoque; reativa quem foi reposto;
6. desativa quem sumiu da planilha (opcional);
7. grava o relatório em `imports/{id}` e oferece o CSV.

Rodar o mesmo arquivo duas vezes é seguro: a segunda passada devolve tudo como
"inalterado".

### Pela linha de comando

```bash
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
npx tsx scripts/import-planilha.ts ./RPR053_LISTAPRECO.xlsx --simular
```

Sem `--simular`, grava. `--manter-ausentes` preserva os produtos que não vieram na
planilha. Use para automatizar via cron a partir da pasta de exportação do ERP.

> A service account ignora Security Rules e não expira. Mantenha o arquivo fora do
> git (já coberto pelo `.gitignore`) e com permissão `600`.

---

## 8. Notas de segurança

- **Planilhas não vão para o repositório.** O `.gitignore` bloqueia `*.xlsx` porque o
  arquivo do ERP carrega o `ValorReposicao` de todo o estoque.
- **Fórmulas não são lidas** (`cellFormula: false`) e células que começam com `=`,
  `+`, `-` ou `@` são prefixadas com aspas na exportação do CSV — bloqueia injeção
  de fórmula no Excel de quem abrir o relatório.
- **Upload limitado** a 25 MB e 20.000 linhas; XLSX é um zip com XML dentro e arquivo
  malformado derruba a aba do navegador.
- **SVG não é aceito** como imagem de produto (`storage.rules`): SVG com `<script>`
  vira XSS armazenado quando servido no mesmo domínio.
- **URLs de imagem** aceitam apenas `http:`/`https:`; `javascript:` e `data:text/html`
  são descartados no adaptador de exibição.
- **Cotações têm rate limit** (3 por minuto por identidade) e preço recalculado no
  servidor — o cliente não dita o valor do lead.
- **Cabeçalhos de segurança** (CSP, HSTS, `X-Frame-Options`, `Permissions-Policy`)
  ficam em `firebase.json` na seção `hosting.headers`.
