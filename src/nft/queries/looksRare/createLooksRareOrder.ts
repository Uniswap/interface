import { getNftUrl } from '../url'

export const createLooksRareOrder = async (payload: any): Promise<boolean> => {
  const url = `${getNftUrl()}/createLooksRareOrder`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  try {
    const data = await res.json()
    return data.success
  } catch (e) {
    return false
  }
}
