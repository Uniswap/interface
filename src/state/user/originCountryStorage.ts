const originCountryKey = 'origin-country'

export function getPersistedOriginCountry(): string | undefined {
  try {
    const value = localStorage.getItem(originCountryKey)
    if (typeof value === 'string') {
      return value
    }
  } catch (e) {
    console.warn(e)
  }
  return undefined
}

export function setPersistedOriginCountry(country: string) {
  console.log('we are setting')
  localStorage.setItem(originCountryKey, country)
}

export function deletePersistedOriginCountry() {
  localStorage.removeItem(originCountryKey)
}
