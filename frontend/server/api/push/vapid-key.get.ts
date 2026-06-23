export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  return { publicKey: config.public.vapidPublicKey }
})
