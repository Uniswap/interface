export type RWAIssuer = string

export type RWAToken = {
  chainId: number
  address: string
  issuer: RWAIssuer
  // Display data for this specific tokenized asset (e.g. an `XX.on` token), sourced from the
  // data-api `Rwa.issuerData` map keyed by issuer. All tokens for the same issuer share these
  // values across chains, which is why they are keyed by issuer rather than by chain/address.
  // Required: tokens whose issuer has no `issuerData` entry are dropped during mapping
  // (see `toRWAWhitelistFromDataApi`), so a constructed `RWAToken` always carries display data.
  name: string
  symbol: string
  logoUrl: string
}

export type RWAAsset = {
  symbol: string
  name: string
  icon: string
  tokens: RWAToken[]
}

export type RWAWhitelist = RWAAsset[]
