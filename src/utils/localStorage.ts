export function setLocalStorage(key: string, value: string, onError: (error: any) => void = console.error): void {
  try {
    localStorage.setItem(key, value)
  } catch (e) {
    if (
      e instanceof DOMException &&
      (e.code === 22 || e.code === 1014 || e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
    ) {
      // The user's browser has hit the localStorage quota, clear the storage and retry once
      localStorage.clear()
      try {
        localStorage.setItem(key, value)
      } catch (e) {
        onError(e)
      }
    } else {
      // Handle other localStorage errors
      onError(e)
      console.log('here')
    }
  }
}
