// api/index.js — Vercel Serverless Function
import express from 'express'
import cors from 'cors'
import * as scraper from './scraper.js'

const app = express()

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MORB-MANGA API', time: new Date().toISOString() })
})

app.get('/api/home', async (req, res) => {
  try {
    const data = await scraper.getAnimes()
    res.set('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600')
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'تعذر جلب القائمة الرئيسية', details: err.message })
  }
})

app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q || ''
    const data = await scraper.searchAnime(q)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'فشل البحث', details: err.message })
  }
})

app.get('/api/episodes', async (req, res) => {
  try {
    const { url } = req.query
    if (!url) return res.status(400).json({ error: 'رابط العمل مطلوب' })
    const data = await scraper.getEpisodes(url)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'تعذر استخراج الفصول', details: err.message })
  }
})

app.get('/api/info', async (req, res) => {
  try {
    const { url } = req.query
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' })
    const data = await scraper.getEpisodeInfo(url)
    res.json(data || {})
  } catch (err) {
    res.status(500).json({ error: 'تعذر جلب تفاصيل العمل', details: err.message })
  }
})

app.get('/api/servers', async (req, res) => {
  try {
    const { url } = req.query
    if (!url) return res.status(400).json({ error: 'الرابط مطلوب' })
    const data = await scraper.getServers(url)
    res.json(data)
  } catch (err) {
    res.status(500).json({ error: 'تعذر استخراج السيرفرات', details: err.message })
  }
})

app.get('/api/stream', async (req, res) => {
  try {
    const { embed } = req.query
    if (!embed) return res.status(400).json({ error: 'رابط السيرفر مطلوب' })
    const m3u8 = await scraper.getM3u8Url(embed)
    if (!m3u8) {
      return res.status(404).json({ error: 'لم يتم العثور على بث مباشر مباشر', fallbackEmbed: embed })
    }
    res.json({ url: m3u8 })
  } catch (err) {
    res.status(500).json({ error: 'تعذر جلب رابط المشاهدة', details: err.message })
  }
})

export default app
