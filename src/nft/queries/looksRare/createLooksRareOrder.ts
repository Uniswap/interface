export const createLooksRareOrder = async (payload: any): Promise<boolean> => {
  const url = `${process.env.REACT_APP_GENIE_API_URL}/createLooksRareOrder`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  try {
    const data = await res.json()
    return data.code === 200
  } catch (e) {
    return false
  }
}
