export function openURL(url: string): Window | null {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return window.open(url)
}

export function canOpenURL(_url: string): boolean {
  return true
}
