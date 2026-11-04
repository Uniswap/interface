// Kept dependency-free so web's redux slice can import it without pulling the provider into the store's type graph
export type AddFundsPressParams = {
  currencyId?: string
  fiatAmount?: string
}
