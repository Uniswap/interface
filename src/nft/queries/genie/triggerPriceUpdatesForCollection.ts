export const triggerPriceUpdatesForCollection = async (address: string) => {
  const url = `${process.env.REACT_APP_GENIE_API_URL}/collections/refresh`
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address,
    }),
  })
  return r.json()
}
