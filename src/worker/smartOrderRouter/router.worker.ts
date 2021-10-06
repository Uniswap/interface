import * as Comlink from 'comlink'

import { getQuote } from './router'

// object to expose via Comlink
const router = {
  getQuote,
}

export type RouterType = typeof router

Comlink.expose(router)
