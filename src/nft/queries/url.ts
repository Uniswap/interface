export function getTokenUrl() {
  const url = process.env.REACT_APP_TEMP_API_URL
  if (!url) throw new Error('Token API URL missing from environment')
  return url
}

export function getNftUrl() {
  const url = process.env.REACT_APP_GENIE_V3_API_URL
  if (!url) throw new Error('Genie V3 API URL missing from environment')
  return url
}
