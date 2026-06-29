// Set this to your Make.com webhook URL after creating the scenario.
// In Make: Webhooks > Custom webhook > copy the URL it gives you, paste it here.
export const WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_URL || ''

export async function sendToWebhook(payload) {
  if (!WEBHOOK_URL) {
    throw new Error('No webhook URL configured yet')
  }
  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    throw new Error('Webhook request failed: ' + res.status)
  }
  return res
}
