export type RWAIssuer = string

export type RWAToken = {
  chainId: number
  address: string
  issuer: RWAIssuer
}

export type RWAAsset = {
  symbol: string
  icon: string
  tokens: RWAToken[]
}

export type RWAWhitelist = RWAAsset[]
