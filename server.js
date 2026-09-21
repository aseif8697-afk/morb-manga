import express from 'express'
import * as scraper from './scraper.js'

const app = express()
app.use(express.json())

// ===== API Routes =====
app.get('/api/home', async (req, res) => {
  res.json(await scraper.getAnimes())
})

app.get('/api/search', async (req, res) => {
  res.json(await scraper.searchAnime(req.query.q || ''))
})

app.get('/api/episodes', async (req, res) => {
  res.json(await scraper.getEpisodes(req.query.url))
})

app.get('/api/info', async (req, res) => {
  res.json(await scraper.getEpisodeInfo(req.query.url))
})

app.get('/api/servers', async (req, res) => {
  res.json(await scraper.getServers(req.query.url))
})

app.get('/api/stream', async (req, res) => {
  const m3u8 = await scraper.getM3u8Url(req.query.embed)
  if (!m3u8) return res.status(404).json({ error: 'مفيش رابط' })
  res.json({ url: m3u8 })
})

export default app