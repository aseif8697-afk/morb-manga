import express from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import app from './api/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')))

export default app

const PORT = process.env.PORT || 3000
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`[MORB-MANGA] Running at http://localhost:${PORT}`)
  })
}
