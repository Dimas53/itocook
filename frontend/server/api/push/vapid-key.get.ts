/**
 * Serves the VAPID public key to the client.
 *
 * The public key is read from runtime config (set via .env NUXT_PUBLIC_VAPID_PUBLIC_KEY).
 * It is never hardcoded in client code — this server route is the single source of truth.
 * The VAPID private key stays server-side in .env (never reaches the browser).
 *
 * Called by: usePushNotifications.getVapidPublicKey()
 */
export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  return { publicKey: config.public.vapidPublicKey }
})
