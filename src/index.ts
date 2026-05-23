import { handleRequest } from './handler'

declare global {
  const HAMMAL_CACHE: KVNamespace
}

addEventListener('fetch', (Silian_event) => {
  Silian_event.respondWith(handleRequest(Silian_event.request))
})
