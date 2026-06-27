export function parseError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes('Network')) return 'Tidak ada koneksi internet'
    if (error.message.includes('timeout')) return 'Koneksi timeout, coba lagi'
    if (error.message.includes('permission')) return 'Izin penyimpanan ditolak'
    if (error.message.includes('space')) return 'Penyimpanan penuh'
    if (error.message.includes('unsupported')) return 'Platform tidak didukung'
    return error.message
  }
  return 'Terjadi kesalahan, coba lagi'
}

export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: unknown
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (i < maxRetries - 1) await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw lastError
}
