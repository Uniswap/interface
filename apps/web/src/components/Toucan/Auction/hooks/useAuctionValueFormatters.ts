import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'
import { logger } from 'utilities/src/logger/logger'
import { formatUnits } from 'viem'
import { BidTokenInfo } from '~/components/Toucan/Auction/store/types'
import { approximateNumberFromRaw, computeFdvBidTokenRaw } from '~/components/Toucan/Auction/utils/fixedPointFdv'

/**
 * Unified hook for formatting auction values.
 *
 * This hook provides formatters that display values in FDV (Fully Diluted Valuation) format,
 * ensuring consistent formatting across the auction feature.
 *
 * @example
 * ```tsx
 * const { formatPrice, formatTokenAmount } = useAuctionValueFormatters({
 *   bidTokenInfo,
 *   totalSupply: '1000000000000000000000000',
 *   auctionTokenDecimals: 18,
 * })
 *
 * // Returns: "$5.2B FDV"
 * const formatted = formatPrice(bidMaxPrice, bidTokenInfo.decimals)
 * ```
 */
export function useAuctionValueFormatters(params: {
  bidTokenInfo: BidTokenInfo
  totalSupply?: string
  auctionTokenDecimals?: number
}) {
  const { bidTokenInfo, totalSupply, auctionTokenDecimals = 18 } = params
  const { formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()
  const { t } = useTranslation()

  /**
   * Formats a token amount (e.g., bid amount in USDC)
   */
  const formatTokenAmount = useCallback(
    (value: string, decimals: number): string => {
      try {
        const converted = formatUnits(BigInt(value), decimals)
        return formatNumberOrString({ value: converted, type: NumberType.TokenNonTx })
      } catch (error) {
        logger.error(error, {
          tags: { file: 'useAuctionValueFormatters', function: 'formatTokenAmount' },
          extra: { value, decimals },
        })
        return '-'
      }
    },
    [formatNumberOrString],
  )

  /**
   * Formats a price value as FDV (Fully Diluted Valuation).
   *
   * Calculates FDV by multiplying price by total supply (e.g., "$5.2B FDV")
   *
   * @param value - Price value in smallest units (e.g., bid maxPrice)
   * @param decimals - Decimals for the price value (typically bidTokenInfo.decimals)
   * @returns Formatted price string with FDV suffix
   */
  const formatPrice = useCallback(
    (value: string, decimals: number): string => {
      try {
        if (!totalSupply || bidTokenInfo.priceFiat === 0) {
          // Cannot calculate FDV without total supply or price data
          return `- ${t('stats.fdv')}`
        }

        const fdvBidTokenRaw = computeFdvBidTokenRaw({
          priceQ96: value,
          bidTokenDecimals: decimals,
          totalSupplyRaw: totalSupply,
          auctionTokenDecimals,
        })

        const fdvBidTokenApprox = approximateNumberFromRaw({
          raw: fdvBidTokenRaw,
          decimals,
          significantDigits: 15,
        })
        const fdvUsd = fdvBidTokenApprox * bidTokenInfo.priceFiat

        // Format with magnitude suffix (B/M/K)
        const formattedFdv = convertFiatAmountFormatted(fdvUsd, NumberType.FiatTokenStats)

        return `${formattedFdv} ${t('stats.fdv')}`
      } catch (error) {
        logger.error(error, {
          tags: { file: 'useAuctionValueFormatters', function: 'formatPrice' },
          extra: { value, decimals },
        })
        return `- ${t('stats.fdv')}`
      }
    },
    [bidTokenInfo.priceFiat, totalSupply, auctionTokenDecimals, convertFiatAmountFormatted, t],
  )

  return { formatPrice, formatTokenAmount }
}
