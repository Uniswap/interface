// eslint-disable-next-line no-restricted-imports
import {
  Position,
  PositionStatus,
  ProtocolVersion,
  Token as RestToken,
} from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useAppSelector } from 'state/hooks'
import { AppTFunction } from 'ui/src/i18n/types'

export function getProtocolVersionLabel(version: ProtocolVersion): string | undefined {
  switch (version) {
    case ProtocolVersion.V2:
      return 'V2'
    case ProtocolVersion.V3:
      return 'V3'
    case ProtocolVersion.V4:
      return 'V4'
  }
  return undefined
}

export function getProtocolVersionFromString(version?: string): ProtocolVersion {
  if (!version) {
    return ProtocolVersion.V4
  }

  switch (version.toLowerCase()) {
    case 'v2':
      return ProtocolVersion.V2
    case 'v3':
      return ProtocolVersion.V3
    case 'v4':
      return ProtocolVersion.V4
  }

  return ProtocolVersion.V4
}

export function getProtocolStatusLabel(status: PositionStatus, t: AppTFunction): string | undefined {
  switch (status) {
    case PositionStatus.IN_RANGE:
      return t('common.withinRange')
    case PositionStatus.OUT_OF_RANGE:
      return t('common.outOfRange')
    case PositionStatus.CLOSED:
      return t('common.closed')
  }
  return undefined
}

function parseRestToken(token?: RestToken): Token | undefined {
  if (!token) {
    return undefined
  }
  return new Token(token.chainId, token.address, token.decimals, token.symbol)
}

export type PositionInfo = {
  restPosition: Position
  status: PositionStatus
  version: ProtocolVersion
  currency0Amount: CurrencyAmount<Currency>
  currency1Amount: CurrencyAmount<Currency>
  feeTier?: string
  v4hook?: string
  liquidityToken?: Token
}

export function usePositionInfo(position?: Position): PositionInfo | undefined {
  // TODO(WEB-4920): remove this as the API should return the needed information - make this function a synchronous non-hook.
  // Optimistically fetch the v3Pool, which should be undefined for non-v3 positions
  // const [, v3Pool] = usePool(
  //   (position as any)?.v3Position?.token0 ? parseRestToken((position as any).v3Position.token0) : undefined,
  //   (position as any)?.v3Position?.token1 ? parseRestToken((position as any).v3Position.token1) : undefined,
  //   parseInt((position as any)?.v3Position?.feeTier),
  // )
  return useMemo(() => {
    if (!position?.position) {
      return undefined
    } else if (position.position.case === 'v2Pair') {
      const v2Pair = position.position.value
      const token0 = parseRestToken(v2Pair.token0)
      const token1 = parseRestToken(v2Pair.token1)
      if (!token0 || !token1) {
        return undefined
      }

      return {
        status: position.status,
        feeTier: undefined,
        v4hook: undefined,
        version: position.protocolVersion,
        restPosition: position,
        liquidityToken: parseRestToken(v2Pair.liquidityToken),
        // TODO(WEB-4920): test this with a real position and verify the decimals are correct here
        currency0Amount: CurrencyAmount.fromRawAmount(token0, v2Pair.reserve0.toString()),
        currency1Amount: CurrencyAmount.fromRawAmount(token1, v2Pair.reserve1.toString()),
      }
    } else if (position.position.case === 'v3Position') {
      const v3Position = position.position.value
      const token0 = parseRestToken(v3Position.token0)
      const token1 = parseRestToken(v3Position.token1)
      if (!token0 || !token1) {
        return undefined
      }

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      // const v3PositionSDK = new V3PositionSDK({
      //   pool: v3Pool,
      //   liquidity: v3Position.liquidity,
      //   tickLower: parseInt(v3Position.tickLower),
      //   tickUpper: parseInt(v3Position.tickUpper),
      // })
      return {
        status: position.status,
        feeTier: v3Position.feeTier,
        version: position.protocolVersion,
        v4hook: undefined,
        liquidityToken: undefined,
        restPosition: position,
        // TODO(WEB-4920): test this with a real position and use instead of the hardcoded amounts
        // currency0Amount: v3PositionSDK.amount0,
        // currency1Amount: v3PositionSDK.amount1,
        currency0Amount: CurrencyAmount.fromRawAmount(token0, '1'),
        currency1Amount: CurrencyAmount.fromRawAmount(token1, '1'),
      }
    } else {
      const v4Position = position.position.value
      const token0 = parseRestToken(v4Position?.poolPosition?.token0)
      const token1 = parseRestToken(v4Position?.poolPosition?.token1)
      if (!token0 || !token1) {
        return undefined
      }

      return {
        status: position.status,
        feeTier: undefined,
        version: position.protocolVersion,
        v4hook: v4Position?.hooks[0]?.address,
        liquidityToken: undefined,
        restPosition: position,
        currency0Amount: CurrencyAmount.fromRawAmount(
          token0,
          '1', // TODO(WEB-4920): how to get the amount for a v4 position?
        ),
        currency1Amount: CurrencyAmount.fromRawAmount(
          token1,
          '1', // TODO(WEB-4920): how to get the amount for a v4 position?
        ),
      }
    }
  }, [position])
}

/**
 * Parses the Positions API object from the modal state and returns the relevant information for the modals.
 */
export function useModalLiquidityPositionInfo(): PositionInfo | undefined {
  const modalState = useAppSelector((state) => state.application.openModal)
  const position = modalState?.initialState
  return usePositionInfo(position)
}
