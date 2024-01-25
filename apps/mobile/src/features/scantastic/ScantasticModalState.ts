export interface ScantasticModalState {
  uuid: string
  pubKey: string
  vendor: string
  model: string
  browser: string
  expiry: string // unix timestamp when the uuid should expire
}
