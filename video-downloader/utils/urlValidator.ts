const SUPPORTED_PATTERNS = [
  /tiktok\.com/,
  /vm\.tiktok\.com/,
  /vt\.tiktok\.com/,
  /instagram\.com/,
  /youtube\.com/,
  /youtu\.be/,
  /twitter\.com/,
  /x\.com/,
  /facebook\.com/,
  /fb\.watch/,
  /pinterest\.com/,
  /reddit\.com/,
  /redd\.it/,
  /dailymotion\.com/,
  /dai\.ly/,
  /vimeo\.com/,
]

export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function isSupportedPlatform(url: string): boolean {
  return SUPPORTED_PATTERNS.some((pattern) => pattern.test(url))
}

export function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    ;['utm_source', 'utm_medium', 'utm_campaign', 'igshid', 'fbclid'].forEach((p) =>
      u.searchParams.delete(p)
    )
    return u.toString()
  } catch {
    return url
  }
}

export function getPlatformName(url: string): string {
  if (/tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com/.test(url)) return 'TikTok'
  if (/instagram\.com/.test(url)) return 'Instagram'
  if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube'
  if (/twitter\.com|x\.com/.test(url)) return 'Twitter/X'
  if (/facebook\.com|fb\.watch/.test(url)) return 'Facebook'
  if (/pinterest\.com/.test(url)) return 'Pinterest'
  if (/reddit\.com|redd\.it/.test(url)) return 'Reddit'
  if (/dailymotion\.com|dai\.ly/.test(url)) return 'Dailymotion'
  if (/vimeo\.com/.test(url)) return 'Vimeo'
  return 'Unknown'
}
