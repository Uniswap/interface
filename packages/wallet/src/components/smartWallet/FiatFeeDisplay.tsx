import { Flex, Text } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NetworkLogo } from 'uniswap/src/components/CurrencyLogo/NetworkLogo'

interface FiatFeeDisplayProps {
  logoChainId: number | null
  isLoading: boolean
  hasError: boolean
  gasFeeFormatted: string | null
}

export const FiatFeeDisplay = ({
  logoChainId,
  isLoading,
  hasError,
  gasFeeFormatted,
}: FiatFeeDisplayProps): JSX.Element => (
  <Flex centered row gap="$spacing4">
    <NetworkLogo chainId={logoChainId} size={iconSizes.icon16} loading={isLoading} />
    <Text loading={isLoading && !hasError} loadingPlaceholderText="$0.00" color="$neutral1" variant="body3">
      {gasFeeFormatted}
    </Text>
  </Flex>
)
