export async function openURL(url: string): Promise<Window | null> {
  return window.open(url)
}

export async function canOpenURL(_url: string): Promise<boolean> {
  return true
}
