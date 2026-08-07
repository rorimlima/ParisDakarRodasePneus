// Service worker do Paris Dakar Rodas e Pneus.
//
// Regras de ouro deste arquivo:
//  - só GET entra em cache (`cache.put` lança TypeError em POST);
//  - só resposta 200 do próprio site entra (resposta opaca de terceiro tem
//    status 0 e cachearia erro como se fosse conteúdo bom);
//  - nada de Firebase/API no cache: catálogo e preço vêm sempre da rede.

const CACHE_NAME = 'pd-cache-v2';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png'
];

const HOSTS_SEMPRE_NA_REDE = ['googleapis.com', 'firebaseio.com', 'cloudfunctions.net', 'gstatic.com'];

/** Resposta que pode ser guardada sem risco de servir erro depois. */
const podeCachear = (request, response) =>
  request.method === 'GET' &&
  response &&
  response.status === 200 &&
  response.type === 'basic';

const guardar = async (request, response) => {
  if (!podeCachear(request, response)) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      // `addAll` é tudo-ou-nada: um 404 num item aborta a instalação inteira.
      .then((cache) => Promise.allSettled(ASSETS_TO_CACHE.map((asset) => cache.add(asset))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(nomes.filter((nome) => nome !== CACHE_NAME).map((nome) => caches.delete(nome)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  // Permite ao app pedir a ativação imediata de uma versão nova.
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Escrita nunca é servida de cache.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;
  if (HOSTS_SEMPRE_NA_REDE.some((host) => url.hostname.includes(host))) return;

  // Navegação: rede primeiro (conteúdo fresco), com a página offline de reserva.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          void guardar(request, response);
          return response;
        })
        .catch(async () => (await caches.match(request)) || caches.match('/offline.html'))
    );
    return;
  }

  // Estáticos versionados pelo build: cache primeiro, revalidando em segundo plano.
  if (['script', 'style', 'font', 'image'].includes(request.destination)) {
    event.respondWith(
      caches.match(request).then((emCache) => {
        const daRede = fetch(request)
          .then((response) => {
            void guardar(request, response);
            return response;
          })
          .catch(() => emCache);
        return emCache || daRede;
      })
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        void guardar(request, response);
        return response;
      })
      .catch(() => caches.match(request))
  );
});
