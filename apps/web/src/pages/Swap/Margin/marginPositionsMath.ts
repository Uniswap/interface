const AGE_STEPS: Array<{ seconds: number; suffix: string }> = [
  { seconds: 86_400, suffix: 'd' },
  { seconds: 3_600, suffix: 'h' },
  { seconds: 60, suffix: 'm' },
]

export function formatAge({ openedAtSeconds, nowSeconds }: { openedAtSeconds: number; nowSeconds?: number }): string {
  const elapsed = Math.max(0, (nowSeconds ?? Math.floor(Date.now() / 1000)) - openedAtSeconds)
  for (const { seconds, suffix } of AGE_STEPS) {
    if (elapsed >= seconds) {
      return `${Math.floor(elapsed / seconds)}${suffix}`
    }
  }
  return '<1m'
}
