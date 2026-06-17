import { Token as SDKToken } from '@uniswap/sdk-core'
import { GraphQLApi } from '@universe/api'
import { memo, useMemo } from 'react'
import { Flex, Text } from 'ui/src'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { isUniverseChainId, toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TokenHoverCard } from '~/components/TokenHoverCard/TokenHoverCard'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'

interface TokenAmountDisplayProps {
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  formattedAmount: string | null
  usdValue: string | null
}

function TokenAmountDisplayInner({ currencyInfo, formattedAmount, usdValue }: TokenAmountDisplayProps) {
  // TokenHoverCard needs only chain + address; gqlToCurrency handles the rest internally
  const token = useMemo((): GraphQLApi.Token | undefined => {
    if (!currencyInfo) {
      return undefined
    }
    const { currency } = currencyInfo
    if (!isUniverseChainId(currency.chainId)) {
      return undefined
    }
    return {
      chain: toGraphQLChain(currency.chainId),
      address: currency.isNative ? NATIVE_CHAIN_ID : (currency as SDKToken).address,
    } as unknown as GraphQLApi.Token
  }, [currencyInfo])

  if (!currencyInfo || !formattedAmount) {
    return null
  }

  const content = (
    <Flex row alignItems="center" gap="$gap8">
      <CurrencyLogo currencyInfo={currencyInfo} size={32} />
      <Flex gap="$gap2">
        <Text variant="body3" fontWeight="500">
          {formattedAmount}
        </Text>
        {usdValue && (
          <Text variant="body3" color="$neutral2">
            {usdValue}
          </Text>
        )}
      </Flex>
    </Flex>
  )

  if (!token) {
    return content
  }

  return <TokenHoverCard token={token}>{content}</TokenHoverCard>
}

export const TokenAmountDisplay = memo(TokenAmountDisplayInner)
