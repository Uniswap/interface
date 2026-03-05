export function createHistogramSignature(data: { time: number; value: number }[]): string {
  if (data.length === 0) {
    return 'empty'
  }
  const first = data[0]
  const last = data[data.length - 1]
  return `${data.length}-${first.time}-${first.value}-${last.time}-${last.value}`
}
