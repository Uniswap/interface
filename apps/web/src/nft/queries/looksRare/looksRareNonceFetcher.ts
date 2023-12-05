const looksRareApiAddress = 'https://api.looksrare.org/api/v1'

export const looksRareNonceFetcher = async (address: any): Promise<number | undefined> => {
  const res = await fetch(`${looksRareApiAddress}/orders/nonce?address=${address}`)

  if (res.status !== 200) {
    console.log(`LooksRare nonce API errored with status ${res.statusText}`)
    return
  }

  const json = await res.json()

  return parseFloat(json.data)
}
