/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ChainId } from '@kyberswap/ks-sdk-core'
import { Connection } from '@solana/web3.js'

import { NETWORKS_INFO } from 'constants/networks'

const hasKey = <T extends Connection>(obj: T, k: any): k is keyof T => k in obj

const callingCache: {
  [func: string]:
    | {
        [args: string]: any | undefined
      }
    | undefined
} = {}
// {
//   result: Promise<any>
//   // blockNumber: number // solana is very fast, so no need to store block number then compare later since it will obsolete anyway
// }

const connection: Connection = (() => {
  const proxy = new Proxy(NETWORKS_INFO[ChainId.SOLANA].connection, {
    get(target, prop) {
      if (hasKey(target, prop)) {
        const origMethod = target[prop]
        if (origMethod instanceof Function) {
          return async function (...args: any[]) {
            const stringifiedArgs = JSON.stringify(args)
            callingCache[origMethod.name] = callingCache[origMethod.name] || {}
            // callingCache[origMethod.name]![stringifiedArgs] = callingCache[origMethod.name]![stringifiedArgs] || {}
            callingCache[origMethod.name]![stringifiedArgs] =
              callingCache[origMethod.name]?.[stringifiedArgs] || (origMethod as any).apply(target, args)

            const result = await callingCache[origMethod.name]?.[stringifiedArgs]
            setTimeout(() => (callingCache[origMethod.name]![stringifiedArgs] = undefined), 1000)
            return result
          }
        } else return target[prop]
      }
      return null
    },
  })
  return proxy
})()
export default connection
