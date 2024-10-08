import type { Index } from '@upstash/vector'
import { semanticSplitter, type flaggedForSetItem } from '.'

export async function splitTextIntoChunks(textArray: string) {
  if (textArray.length <= 1) return []
  const documents = await semanticSplitter.createDocuments([textArray])
  const chunks = documents.map(chunk => chunk.pageContent)
  return chunks
}

export function getWordChunksProfanityCheckPromises(
  wordChunks: string[],
  flaggedForSet: Set<flaggedForSetItem>,
  index: Index
) {
  const WordChunksProfanityCheckPromises = wordChunks.map(async wordChunk => {
    const [vector] = await index.query({
      topK: 1,
      data: wordChunk,
      includeMetadata: true,
    })
    console.log(vector)
    if (vector && vector.score > 0.95 && vector.metadata) {
      flaggedForSet.add({ text: vector.metadata.metadata_field as string, score: vector.score })
    }
    return vector ? vector : { score: 0 }
  })
  return WordChunksProfanityCheckPromises
}

export function getSematicChunksProfanityCheckPromises(
  semanticChunks: string[],
  flaggedForSet: Set<flaggedForSetItem>,
  index: Index
) {
  const sematicChunksProfanityCheckPromises = semanticChunks.map(async semanticChunk => {
    const [vector] = await index.query({
      topK: 1,
      data: semanticChunk,
      includeMetadata: true,
    })

    if (vector && vector.score > 0.86 && vector.metadata) {
      flaggedForSet.add({ text: vector.metadata.metadata_field as string, score: vector.score })
    }
    return vector ? vector : { score: 0 }
  })
  return sematicChunksProfanityCheckPromises
}

export function getHighestProfaneItem(flaggedForSet: Set<{ text: string; score: number }>) {
  const sortedList = Array.from(flaggedForSet).sort((a, b) => (a.score > b.score ? -1 : 1))
  return sortedList[0]
}
