export async function openURL(url: string): Promise<Window | null> {
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  return window.open(url)
}

export async function canOpenURL(_url: string): Promise<boolean> {
  return true
}
