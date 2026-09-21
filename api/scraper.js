// Scraper Engine for RistoAnime / Witanime
import axios from 'axios'
import cheerio from 'cheerio'

const UA = 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36'
const BASE = 'https://ristoanime.me'
const TIMEOUT = 15000

const http = axios.create({
  headers: {
    'User-Agent': UA,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ar,en-US;q=0.8,en;q=0.5'
  },
  timeout: TIMEOUT,
  validateStatus: () => true
})

// ===== بحث عن أنمي =====
export async function searchAnime(query) {
  try {
    if (!query || !query.trim()) return []
    const url = `${BASE}/?s=${encodeURIComponent(query.trim())}`
    const { data } = await http.get(url)

    if (!data || data.length === 0) return []

    const $ = cheerio.load(data)
    const results = []

    $('.MovieItem a').each((i, el) => {
      const link = $(el).attr('href') || ''
      const title = $(el).find('h4').text().trim() || $(el).text().trim().slice(0, 60)
      const posterStyle = $(el).find('.poster').attr('data-style') || $(el).find('.poster').attr('style') || ''
      const thumbMatch = posterStyle.match(/url\(([^)]+)\)/)
      const thumb = thumbMatch ? thumbMatch[1].replace(/["']/g, '').trim() : ''
      const genre = $(el).find('.genre').text().trim() || ''
      const year = $(el).find('.release-year').text().trim() || ''
      const quality = $(el).find('.quality').text().trim() || ''

      if (link && title && !results.find(r => r.link === link)) {
        results.push({
          title: title.slice(0, 60),
          link,
          thumb,
          genre,
          year,
          quality
        })
      }
    })

    return results
  } catch (e) {
    console.error('searchAnime error:', e.message)
    return []
  }
}

// ===== جلب قائمة الصفحة الرئيسية =====
export async function getAnimes() {
  try {
    const { data } = await http.get(`${BASE}/`)
    if (!data) return []

    const $ = cheerio.load(data)
    const animes = []

    $('.MovieItem a').each((i, el) => {
      const link = $(el).attr('href') || ''
      const title = $(el).find('h4').text().trim() || $(el).text().trim().slice(0, 60)
      const posterStyle = $(el).find('.poster').attr('data-style') || $(el).find('.poster').attr('style') || ''
      const thumbMatch = posterStyle.match(/url\(([^)]+)\)/)
      const thumb = thumbMatch ? thumbMatch[1].replace(/["']/g, '').trim() : ''
      const genre = $(el).find('.genre').text().trim() || ''
      const quality = $(el).find('.quality').text().trim() || ''

      if (link && title && !animes.find(a => a.link === link)) {
        animes.push({ title: title.slice(0, 60), link, thumb, genre, quality })
      }
    })

    return animes
  } catch (e) {
    console.error('getAnimes error:', e.message)
    return []
  }
}

// ===== جلب قائمة الحلقات / الفصول =====
export async function getEpisodes(animeUrl) {
  try {
    if (!animeUrl) return []
    const { data } = await http.get(animeUrl)
    if (!data) return []

    const $ = cheerio.load(data)
    const episodes = []

    $('.EpisodesList a').each((i, el) => {
      const href = $(el).attr('href') || ''
      const text = $(el).text().trim()

      if (href.startsWith('http') && text) {
        episodes.push({ title: text.slice(0, 60), link: href })
      }
    })

    return [...new Map(episodes.map(e => [e.link, e])).values()]
  } catch (e) {
    console.error('getEpisodes error:', e.message)
    return []
  }
}

// ===== معلومات العمل أو الحلقة =====
export async function getEpisodeInfo(episodeUrl) {
  try {
    if (!episodeUrl) return null
    const { data } = await http.get(episodeUrl)
    if (!data) return null

    const $ = cheerio.load(data)
    const title = $('h1').text().trim() || 'تفاصيل العمل'
    const img = $('.Poster img').attr('src') || ''
    const desc = $('.StoryArea p').text().trim() || ''
    const rating = $('.imdbRBox').text().trim() || ''

    const genres = []
    $('.TaxContent a').each((i, el) => {
      const g = $(el).text().trim()
      if (g) genres.push(g)
    })

    return { title, img, desc, rating, genres }
  } catch (e) {
    console.error('getEpisodeInfo error:', e.message)
    return null
  }
}

// ===== جلب سيرفرات المشاهدة =====
export async function getServers(watchUrl) {
  try {
    if (!watchUrl) return []
    let url = watchUrl
    if (!url.includes('/watch')) {
      url = url.replace(/\/$/, '') + '/watch/'
    }

    const { data } = await http.get(url)
    if (!data) return []

    const matches = [...new Set(data.match(/https?:\/\/[^"'\s]+embed-[^"'\s]+/g) || [])]

    return matches.map(link => ({
      name: link
        .replace(/https?:\/\/(www\.)?/, '')
        .split('/')[0]
        .replace(/\..*/, ''),
      url: link
    }))
  } catch (e) {
    console.error('getServers error:', e.message)
    return []
  }
}

// ===== جلب رابط m3u8 للبث المباشر =====
export async function getM3u8Url(embedUrl) {
  try {
    if (!embedUrl) return ''
    const { data } = await http.get(embedUrl)
    if (!data) return ''

    const m3u8 = data.match(/https?:\/\/[^"'\s]+\.m3u8[^"'\s]*/g) || []
    return m3u8[0] || ''
  } catch (e) {
    console.error('getM3u8Url error:', e.message)
    return ''
  }
}
