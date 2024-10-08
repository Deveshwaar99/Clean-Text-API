import { Index } from '@upstash/vector'

const index = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
})
// console.log(UPSTASH_VECTOR_REST_URL)
async function parseCSV(filePath: string): Promise<string[]> {
  const file = Bun.file(filePath)

  //for smaller data set
  // const text = await file.text()
  // const rows: string[] = text.split(/\r?\n/)
  // return rows

  //for larger data we can use streams
  const rows: string[] = []
  const stream = file.stream()

  for await (const chunk of stream) {
    const chunkString = new TextDecoder().decode(chunk)
    const stringArr = chunkString.split(/\r?\n/) as string[]
    rows.push(...stringArr)
  }
  return rows
}

async function seed() {
  const wordsArray = await parseCSV('./word-list.csv')

  const BATCH = 50

  for (let i = 0; i < wordsArray.length; i += BATCH) {
    const data = wordsArray.slice(i, i + BATCH)

    const formattedText = data.map((word, index) => {
      return {
        id: i + index,
        data: word,
        metadata: {
          metadata_field: word,
        },
      }
    })

    await index.upsert(formattedText)
  }
  console.log('Data upload successfull')
}

seed()
