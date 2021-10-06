import * as Comlink from 'comlink'

import { getQuote } from './router'

const router = {
  getQuote,
}

export type GetQuoteFunctionType = typeof getQuote

Comlink.expose(router)
