import { DEFAULT_FEE_DATA, FeeData, PositionFlowStep, PriceRangeState } from 'components/Liquidity/Create/types'
import { DepositState } from 'components/Liquidity/types'
import { checkIsNative } from 'hooks/Tokens'
import { createParser, parseAsJson } from 'nuqs'
import { parseCurrencyFromURLParameter } from 'state/swap/hooks'
import { PositionField } from 'types/position'
import { WRAPPED_NATIVE_CURRENCY } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { getValidAddress } from 'uniswap/src/utils/addresses'
import { getChainIdFromChainUrlParam, getChainUrlParam } from 'utils/chainParams'
import { assume0xAddress } from 'utils/wagmi'
import { z } from 'zod'

const priceRangeStateSchema: z.ZodSchema<Partial<PriceRangeState>> = z
  .object({
    priceInverted: z.boolean(),
    fullRange: z.boolean(),
    minPrice: z.string(),
    maxPrice: z.string(),
    initialPrice: z.string(),
    isInitialPriceDirty: z.boolean(),
  })
  .partial()

const depositStateSchema: z.ZodSchema<Partial<DepositState>> = z
  .object({
    exactField: z.nativeEnum(PositionField),
    exactAmounts: z.record(z.nativeEnum(PositionField), z.string()),
  })
  .partial()

const feeDataSchema: z.ZodSchema<FeeData> = z.object({
  feeAmount: z.number(),
  tickSpacing: z.number(),
  isDynamic: z.boolean(),
})

export const parseAsFeeData = parseAsJson(feeDataSchema.parse).withDefault(DEFAULT_FEE_DATA)

export const parseAsPriceRangeState = parseAsJson(priceRangeStateSchema.parse).withDefault({})

export const parseAsDepositState = parseAsJson(depositStateSchema.parse).withDefault({})

export const parseAsCurrencyAddress = createParser({
  parse: (query: string) => {
    if (!query || typeof query !== 'string') {
      return null
    }

    const parsedAddress = parseCurrencyFromURLParameter(query, Platform.EVM)
    return parsedAddress || null
  },
  serialize: (value: string) => value,
})

// Create currency parser that prevents ETH/WETH conflicts
export function createCurrencyParsersWithValidation(chainId: number) {
  const isETHOrWETH = (address?: string) =>
    checkIsNative(address) || address === WRAPPED_NATIVE_CURRENCY[chainId]?.address

  return {
    currencyA: parseAsCurrencyAddress,
    currencyB: parseAsCurrencyAddress,
    validateCurrencies: (currencyA?: string, currencyB?: string) => {
      const parsedCurrencyAddressB = currencyB === currencyA ? undefined : currencyB

      // prevent weth + eth
      const isETHOrWETHA = isETHOrWETH(currencyA)
      const isETHOrWETHB = isETHOrWETH(parsedCurrencyAddressB)

      return {
        currencyAddressA: currencyA,
        currencyAddressB:
          parsedCurrencyAddressB && !(isETHOrWETHA && isETHOrWETHB) ? parsedCurrencyAddressB : undefined,
      }
    },
  }
}

export const parseAsChainId = createParser({
  parse: (query: string) => {
    if (!query || typeof query !== 'string') {
      return null
    }

    const chainId = getChainIdFromChainUrlParam(query)
    if (chainId !== undefined) {
      return chainId
    }

    return null
  },
  serialize: (value: UniverseChainId | undefined) => {
    return value ? getChainUrlParam(value) : ''
  },
})

export const parseAsPositionFlowStep = createParser({
  parse: (query: string) => {
    if (!query || typeof query !== 'string') {
      return null
    }

    const stepNumber = Number(query)
    if (!Number.isInteger(stepNumber) || stepNumber < 0) {
      return null
    }

    const validSteps = Object.values(PositionFlowStep) as number[]
    if (validSteps.includes(stepNumber)) {
      return stepNumber as PositionFlowStep
    }

    return null
  },
  serialize: (value: PositionFlowStep) => value.toString(),
})

export const parseAsHookAddress = createParser({
  parse: (query: string) => {
    if (!query || typeof query !== 'string') {
      return null
    }

    const validAddress = getValidAddress({ address: query, platform: Platform.EVM, withEVMChecksum: true })
    return validAddress ? assume0xAddress(validAddress) : null
  },
  serialize: (value: string) => value,
})
