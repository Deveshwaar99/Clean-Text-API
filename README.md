# Clean-Text-API

The Clean-Text-API is designed to filter and detect profanity in textual messages using Upstash Vector, a vector database that powers the semantic analysis. The API can split a given message into smaller chunks, both by individual words and semantically, then check each chunk for potentially offensive content. The system returns a profanity score based on a predefined threshold, allowing users to identify messages that might contain inappropriate language.

## Key Features:

- **Profanity Detection**: Detects offensive language based on word chunks and semantic analysis using vector queries.
- **Chunk Splitting**: Splits text into smaller chunks (both word-level and semantically) to provide accurate detection.
- **Custom Whitelist**: Configurable whitelist to exclude certain non-profane words (e.g., "black", "swear").
- **Profanity Scoring**: Each profane item is scored, and the system flags the highest-scoring profanity for each request.
- **Upstash Vector Integration**: Uses Upstash Vector for querying offensive language.

## API Endpoint

POST `/`

**Request Headers:**

- `Content-Type: application/json`

**Request Body:**

```json
{
  "message": "Your text message here"
}
```

| Parameter | Type   | Required | Description                                |
| --------- | ------ | -------- | ------------------------------------------ |
| `message` | string | Yes      | The message text that needs to be checked. |

**Response:**

On success, the API returns whether the message contains profanity and the most offensive word or phrase, if any:

- If profanity is detected:

```json
{
  "containsProfanity": true,
  "profanity": "Detected offensive word or phrase",
  "score": 0.95
}
```

- If no profanity is detected:

```json
{
  "containsProfanity": false,
  "score": 0.02
}
```

**Error Responses:**

- `400`: Missing or invalid message parameter
- `406`: Invalid content type (must be `application/json`)
- `413`: Message length exceeds the 1000 characters or 35 words limit
- `500`: Internal server error

## Text Splitting

The API uses a `RecursiveCharacterTextSplitter` to split messages into semantic chunks. This helps in detecting profanity not only in word-level chunks but also within meaningful semantic groups of text.

## Whitelist

A configurable whitelist is applied to exclude non-offensive words that might otherwise be flagged as profane. The default whitelist includes:

```json
["black", "swear", "shut up"]
```

## Profanity Thresholds

By default, the API considers a word or phrase profane if the returned score from the Upstash Vector query is greater than `0.86`. You can adjust this threshold as per your requirements by modifying the respective logic in the utility functions.

## Example Use Case

You can send a request to check a message for profanity:

```bash
curl -X POST https://your-api-url/ \
  -H "Content-Type: application/json" \
  -d '{"message": "This is a test message."}'
```

## License

This project is licensed under the MIT License.
