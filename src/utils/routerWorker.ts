import { TradeType } from '@uniswap/sdk-core'
import * as Comlink from 'comlink'

const obj = {
  getQuote({ type }: { type: TradeType }) {
    return type
  },
}

Comlink.expose(obj)
