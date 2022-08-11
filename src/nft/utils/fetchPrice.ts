export enum Currency {
  ETH = 'ETH',
  LOOKS = 'LOOKS',
  MATIC = 'MATIC',
}

export const fetchPrice = async (currency: Currency = Currency.ETH): Promise<number | undefined> => {
  try {
    const response = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${currency}`)
    return response.json().then((j) => j.data.rates.USD)
  } catch (e) {
    console.error(e)
    return
  }
}
