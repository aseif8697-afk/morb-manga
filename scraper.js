// scraper.js — MORB-MANGA Scraper
import axios from 'axios'
import cheerio from 'cheerio'

const UA = 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
const BASE = 'https://ristoanime.me'
const TIMEOUT = 15000

const http = axios.create({
  headers: { 'User-Agent': UA },
  timeout: TIMEOUT,
  validateStatus: () => true
})

// ===== بحث =====
export async function searchAnime(query) {
  try {
    const { data } = await http.get(`${BASE}/?s=${encodeURIComponent(query)}`)
    const $ = cheerio.load(data)
    const results = []

    $('.MovieItem a').each((i, el) => {
      const link = $(el).attr('href') || ''
      const title = $(el).find('h4').text().trim()
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
  } catch {
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
      const title = $(el).find('h4').text().trim()
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
  } catch {
    return []
  }
}

// ===== الفصول =====
export async function getEpisodes(animeUrl) {
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
  } catch {
    return []
  }
}

// ===== معلومات الحلقة =====
export async function getEpisodeInfo(episodeUrl) {
  try {
    const { data } = await http.get(episodeUrl)
    const $ = cheerio.load(data)

    const genres = []
    $('.TaxContent a').each((i, el) => genres.push($(el).text().trim()))

    return {
      title: $('h1').text().trim(),
      img: $('.Poster img').attr('src') || '',
      desc: $('.StoryArea p').text().trim(),
      rating: $('.imdbRBox').text().trim(),
      genres
    }
  } catch {
    return null
  }
}

// ===== السيرفرات =====
export async function getServers(watchUrl) {
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
  } catch {
    return []
  }
}

// ===== رابط m3u8 =====
export async function getM3u8Url(embedUrl) {
  try {
    const { data } = await http.get(embedUrl)
    const m3u8 = data.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/g) || []
    return m3u8[0] || ''
  } catch {
    return ''
  }
}