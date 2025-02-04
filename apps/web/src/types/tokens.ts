import { Token } from '@taraswap/sdk-core'

export class UserAddedToken extends Token { }

export type CrossChainCurrency = {
  "_id": string,
  "name": string,
  "symbol": string,
  "img": string,
  "network": string,
  "address": string | null,
  "isFiat": boolean,
  "createdAt": string | Date,
}

export function equalsCrossChainCurrency(currency: CrossChainCurrency, otherCurrency: CrossChainCurrency) {
  return currency._id === otherCurrency._id
}