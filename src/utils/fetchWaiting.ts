export default async function fetchWaiting(input: RequestInfo, init?: RequestInit, minimumLoadingTime = 0) {
  const startTime = Date.now()
  const response = await fetch(input, init)
  const endTime = Date.now()
  const timeoutTime = minimumLoadingTime - (endTime - startTime)
  await new Promise(resolve => setTimeout(resolve, timeoutTime))
  return response
}
