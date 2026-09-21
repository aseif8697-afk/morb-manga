import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import app from './api/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Serve static frontend from public directory
app.use(express.static(path.join(__dirname, 'public')))

// Root fallback to index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

export default app

const PORT = process.env.PORT || 3000
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[MORB-MANGA] Running at http://localhost:${PORT}`)
  })
}
