import { Hono } from 'hono'
import { logger } from 'hono/logger'

const WHITELIST = ['black', 'swear']
const PROFANITY_THRESHOLD = 0.86

const app = new Hono()

app.use(logger())
app.get('/', c => {
  return c.text('Hello Hono!')
})

app.post('/', async c => {
  try {
    if (c.req.header('Content-Type') !== 'application/json') {
      return c.json({ error: 'JSON body required' }, 406)
    }
    const body = await c.req.json()
    const { message } = body as { message: string }

    if (!message) {
      return c.json({ error: 'Message param in body is required' }, 400)
    }

    if (message.length > 1000 || message.split(/\s/).length > 35) {
      return c.json({ error: 'Maximum message length is 1000 characters' }, 413)
    }

    const filteredMessage = message
      .split(/\s/)
      .filter(word => !WHITELIST.includes(word))
      .join(' ')
  } catch (error) {
    return c.json({ error: 'Somthing went wrong' }, 500)
  }
})

export default app
