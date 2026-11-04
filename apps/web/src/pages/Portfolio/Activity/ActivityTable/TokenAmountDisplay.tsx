import { Token as SDKToken } from '@uniswap/sdk-core'
import { Flex, Text } from '@universe/mycelium'
import { memo, useMemo } from 'react'
import AnimatedNumber from 'uniswap/src/components/AnimatedNumber/AnimatedNumber'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { TokenHoverCard, type TokenHoverCardToken } from '~/components/HoverCard/TokenHoverCard/TokenHoverCard'
import { NATIVE_CHAIN_ID } from '~/constants/tokens'

interface TokenAmountDisplayProps {
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  formattedAmount: string | null
  usdValue: string | null
}

function TokenAmountDisplayInner({ currencyInfo, formattedAmount, usdValue }: TokenAmountDisplayProps) {
  const token = useMemo((): TokenHoverCardToken | undefined => {
    if (!currencyInfo) {
      return undefined
    }
    const { currency } = currencyInfo
    if (!isUniverseChainId(currency.chainId)) {
      return undefined
    }
    return {
      chainId: currency.chainId,
      address: currency.isNative ? NATIVE_CHAIN_ID : (currency as SDKToken).address,
    }
  }, [currencyInfo])

  if (!currencyInfo || !formattedAmount) {
    return null
  }

  const content = (
    <Flex row alignItems="center" gap="$gap8">
      <CurrencyLogo currencyInfo={currencyInfo} size={32} />
      <Flex gap="$spacing2">
        <Text variant="body3" fontWeight="500">
          {formattedAmount}
        </Text>
        {usdValue && <AnimatedNumber value={usdValue} textVariant="$body3" color="$neutral2" />}
      </Flex>
    </Flex>
  )

  if (!token) {
    return content
  }

  return <TokenHoverCard token={token}>{content}</TokenHoverCard>
}

export const TokenAmountDisplay = memo(TokenAmountDisplayInner)
