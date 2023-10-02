import ms from 'ms'

const originCountryKey = 'origin-country'

interface OriginCountryMeta {
  country: string
  timestamp: number
}

export function getPersistedOriginCountry(): string | undefined {
  try {
    const value = localStorage.getItem(originCountryKey)
    if (value) {
      const originCountryMeta = JSON.parse(value) as OriginCountryMeta
      const diffFromNow = Date.now() - originCountryMeta.timestamp
      return diffFromNow > ms(`1d`) ? undefined : originCountryMeta.country
    }
  } catch (e) {
    console.warn(e)
  }
  return undefined
}

export function setPersistedOriginCountry(country: string) {
  const meta: OriginCountryMeta = {
    country,
    timestamp: Date.now(),
  }
  localStorage.setItem(originCountryKey, JSON.stringify(meta))
}

export function deletePersistedOriginCountry() {
  localStorage.removeItem(originCountryKey)
}
