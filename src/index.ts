import { Index } from '@upstash/vector'
import { Hono } from 'hono'
import { env } from 'hono/adapter'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import {
  getHighestProfaneItem,
  getSematicChunksProfanityCheckPromises,
  getWordChunksProfanityCheckPromises,
  splitTextIntoChunks,
} from './utils'

type Environment = {
  UPSTASH_VECTOR_REST_URL: string
  UPSTASH_VECTOR_REST_TOKEN: string
}

export type flaggedForSetItem = {
  text: string
  score: number
}

export const semanticSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 25,
  separators: [' '],
  chunkOverlap: 12,
})

const WHITELIST = ['black', 'swear', 'shut up']
// export const PROFANITY_THRESHOLD = 0.86

const app = new Hono()

app.use(cors())

app.use(logger())

app.post('/', async c => {
  if (c.req.header('Content-Type') !== 'application/json') {
    return c.json({ error: 'JSON body required' }, 406)
  }
  try {
    const { UPSTASH_VECTOR_REST_URL, UPSTASH_VECTOR_REST_TOKEN } = env<Environment>(c)

    const index = new Index({
      url: UPSTASH_VECTOR_REST_URL,
      token: UPSTASH_VECTOR_REST_TOKEN,
      cache: false,
    })

    const body = await c.req.json()
    const { message } = body as { message: string }

    if (!message) {
      return c.json({ error: 'Message param in body is required.' }, 400)
    }

    if (message.length > 1000 || message.split(/\s/).length > 35) {
      return c.json({ error: 'Maximum message length is 1000 characters.' }, 413)
    }

    const filteredMessage = message
      .split(/\s+/)
      .filter(word => !WHITELIST.includes(word.toLowerCase()))
      .join(' ')

    const wordChunks = filteredMessage.split(/\s/)
    const semanticChunks = await splitTextIntoChunks(filteredMessage)

    const flaggedForSet = new Set<{ text: string; score: number }>()
    const vectorRes = await Promise.all([
      ...getWordChunksProfanityCheckPromises(wordChunks, flaggedForSet, index),
      ...getSematicChunksProfanityCheckPromises(semanticChunks, flaggedForSet, index),
    ])
    if (flaggedForSet.size > 0) {
      const highestProfanePhrase = getHighestProfaneItem(flaggedForSet)

      return c.json({
        containsProfanity: true,
        profanity: highestProfanePhrase.text,
        score: highestProfanePhrase.score,
      })
    }

    return c.json({
      containsProfanity: false,
      score: vectorRes.sort((a, b) => (a.score > b.score ? -1 : 1))[0].score,
    })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Somthing went wrong.' }, 500)
  }
})

export default app
