export const isValidDate = (date: number): boolean => {
  const d = Date.parse(date.toString())
  return isNaN(d) ? false : true
}

export const getTimeDifference = (eventTimestamp: string, isNftGraphqlEnabled: boolean) => {
  const date = isNftGraphqlEnabled ? parseFloat(eventTimestamp) : new Date(eventTimestamp).getTime()
  const diff = new Date().getTime() - date

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  if (minutes > 1) return `${minutes} minutes ago`
  return 'Just now'
}
