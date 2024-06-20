// entities/route.ts

import { Currency, Price, Token } from '@ubeswap/sdk-core'
import { Pair, Route as V2RouteSDK } from '@uniswap/v2-sdk'
import { Pool, Route as V3RouteSDK } from '@uniswap/v3-sdk'
import { MixedRouteSDK } from './mixedRoute/route'
import { Protocol } from './protocol'

export interface IRoute<TInput extends Currency, TOutput extends Currency, TPool extends Pool | Pair> {
  protocol: Protocol
  // array of pools if v3 or pairs if v2
  pools: TPool[]
  path: Token[]
  midPrice: Price<TInput, TOutput>
  input: TInput
  output: TOutput
}

// V2 route wrapper
export class RouteV2<TInput extends Currency, TOutput extends Currency>
  extends V2RouteSDK<TInput, TOutput>
  implements IRoute<TInput, TOutput, Pair>
{
  public readonly protocol: Protocol = Protocol.V2
  public readonly pools: Pair[]

  constructor(v2Route: V2RouteSDK<TInput, TOutput>) {
    super(v2Route.pairs, v2Route.input, v2Route.output)
    this.pools = this.pairs
  }
}

// V3 route wrapper
export class RouteV3<TInput extends Currency, TOutput extends Currency>
  extends V3RouteSDK<TInput, TOutput>
  implements IRoute<TInput, TOutput, Pool>
{
  public readonly protocol: Protocol = Protocol.V3
  public readonly path: Token[]

  constructor(v3Route: V3RouteSDK<TInput, TOutput>) {
    super(v3Route.pools, v3Route.input, v3Route.output)
    this.path = v3Route.tokenPath
  }
}

// Mixed route wrapper
export class MixedRoute<TInput extends Currency, TOutput extends Currency>
  extends MixedRouteSDK<TInput, TOutput>
  implements IRoute<TInput, TOutput, Pool | Pair>
{
  public readonly protocol: Protocol = Protocol.MIXED

  constructor(mixedRoute: MixedRouteSDK<TInput, TOutput>) {
    super(mixedRoute.pools, mixedRoute.input, mixedRoute.output)
  }
}
