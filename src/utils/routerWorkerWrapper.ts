import { TradeType } from '@uniswap/sdk-core'
import * as Comlink from 'comlink'
import Worker from 'worker-loader!./routerWorker'

const worker = new Worker()
const obj = Comlink.wrap(worker) as any

export async function getQuote({ type }: { type: TradeType }) {
  const quote = await obj.getQuote(type)
  console.log(quote)
}
