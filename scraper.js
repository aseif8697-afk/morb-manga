// api/scraper.js — MORB-MANGA High-Res Scraper Engine
import axios from 'axios'
import cheerio from 'cheerio'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
const BASE = 'https://ristoanime.me'
const TIMEOUT = 15000

const http = axios.create({
  headers: {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3',
    'Referer': BASE
  },
  timeout: TIMEOUT,
  validateStatus: () => true
})

// ===== بحث =====
export async function searchAnime(query) {
  if (!query || !query.trim()) return []
  try {
    const { data } = await http.get(`${BASE}/?s=${encodeURIComponent(query.trim())}`)
    const $ = cheerio.load(data)
    const results = []

    $('.MovieItem a').each((i, el) => {
      const link = $(el).attr('href') || ''
      const title = $(el).find('h4').text().trim() || $(el).attr('title') || ''
      const style =
        $(el).find('.poster').attr('data-style') ||
        $(el).find('.poster').attr('style') || ''
      const m = style.match(/url\(([^)]+)\)/)
      const thumb = m ? m[1].replace(/["']/g, '').trim() : ''

      if (link && title && !results.find(r => r.link === link)) {
        results.push({ title, link, thumb })
      }
    })

    return results
  } catch (err) {
    console.error('searchAnime error:', err.message)
    return []
  }
}

// ===== الرئيسية =====
export async function getAnimes() {
  try {
    const { data } = await http.get(BASE)
    const $ = cheerio.load(data)
    const animes = []

    $('.MovieItem a').each((i, el) => {
      const link = $(el).attr('href') || ''
      const title = $(el).find('h4').text().trim() || $(el).attr('title') || ''
      const style =
        $(el).find('.poster').attr('data-style') ||
        $(el).find('.poster').attr('style') || ''
      const m = style.match(/url\(([^)]+)\)/)
      const thumb = m ? m[1].replace(/["']/g, '').trim() : ''

      if (link && title && !animes.find(a => a.link === link)) {
        animes.push({ title, link, thumb })
      }
    })

    return animes
  } catch (err) {
    console.error('getAnimes error:', err.message)
    return []
  }
}

// ===== الفصول / الحلقات =====
export async function getEpisodes(animeUrl) {
  if (!animeUrl) return []
  try {
    const { data } = await http.get(animeUrl)
    const $ = cheerio.load(data)
    const episodes = []

    $('.EpisodesList a').each((i, el) => {
      const href = $(el).attr('href') || ''
      const text = $(el).text().trim()
      if (href.startsWith('http') && text) {
        episodes.push({ title: text, link: href })
      }
    })

    return [...new Map(episodes.map(e => [e.link, e])).values()]
  } catch (err) {
    console.error('getEpisodes error:', err.message)
    return []
  }
}

// ===== معلومات العمل =====
export async function getEpisodeInfo(episodeUrl) {
  if (!episodeUrl) return null
  try {
    const { data } = await http.get(episodeUrl)
    const $ = cheerio.load(data)

    const genres = []
    $('.TaxContent a').each((i, el) => {
      const t = $(el).text().trim()
      if (t) genres.push(t)
    })

    return {
      title: $('h1').text().trim() || 'تفاصيل العمل',
      img: $('.Poster img').attr('src') || '',
      desc: $('.StoryArea p').text().trim() || 'لا يوجد وصف متاح حالياً.',
      rating: $('.imdbRBox').text().trim() || 'N/A',
      genres
    }
  } catch (err) {
    console.error('getEpisodeInfo error:', err.message)
    return null
  }
}

// ===== السيرفرات =====
export async function getServers(watchUrl) {
  if (!watchUrl) return []
  try {
    let url = watchUrl
    if (!url.includes('/watch')) {
      url = url.replace(/\/$/, '') + '/watch/'
    }

    const { data } = await http.get(url)
    const matches = [
      ...new Set(data.match(/https?:\/\/[^"'\s]+embed-[^"'\s]+/g) || [])
    ]

    return matches.map(u => ({
      name: u
        .replace(/https?:\/\/(www\.)?/, '')
        .split('/')[0]
        .replace(/\..*/, ''),
      url: u
    }))
  } catch (err) {
    console.error('getServers error:', err.message)
    return []
  }
}

// ===== رابط m3u8 =====
export async function getM3u8Url(embedUrl) {
  if (!embedUrl) return ''
  try {
    const { data } = await http.get(embedUrl)
    const m3u8 = data.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/g) || []
    return m3u8[0] || ''
  } catch (err) {
    console.error('getM3u8Url error:', err.message)
    return ''
  }
}
