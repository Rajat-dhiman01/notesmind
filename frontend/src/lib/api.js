// frontend/src/lib/api.js

import axios from 'axios'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function authHeaders(token) {
  return { Authorization: `Bearer ${token}` }
}

export const uploadPDF = (file, token) => {
  const fd = new FormData()
  fd.append('file', file)
  return axios.post(`${BASE}/upload`, fd, {
    headers: { ...authHeaders(token) },
  })
}

export const askQuestion = (question, token) =>
  axios.post(`${BASE}/ask`, { question }, {
    headers: authHeaders(token),
  })

export const getDocuments = (token) =>
  axios.get(`${BASE}/documents`, {
    headers: authHeaders(token),
  })

export const resetIndex = (token) =>
  axios.post(`${BASE}/reset`, {}, {
    headers: authHeaders(token),
  })

// NEW — tell the backend which document is active
export const selectDocument = (document, token) =>
  axios.post(`${BASE}/select`, { document }, {
    headers: authHeaders(token),
  })

export function streamQuestion(question, token, onToken, onDone, onError) {
  fetch(`${BASE}/ask/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(token),
    },
    body: JSON.stringify({ question }),
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(err.detail ?? 'Stream request failed.')
        })
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      function read() {
        reader.read().then(({ done, value }) => {
          if (done) return

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop()

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const token = line.slice(6)
            if (token === '[DONE]') { onDone(); return }
            if (token) onToken(token.replace(/\\n/g, '\n'))
          }

          read()
        })
      }

      read()
    })
    .catch(err => onError(err.message))
}