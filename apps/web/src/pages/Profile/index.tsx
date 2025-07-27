import MiniPortfolio from 'components/AccountDrawer/MiniPortfolio/MiniPortfolio'
import { DeltaArrow } from 'components/Tokens/TokenDetails/Delta'
import { useAccount } from 'hooks/useAccount'
import { Flex, Text } from 'ui/src'
import { INTERFACE_NAV_HEIGHT } from 'ui/src/theme'
import { usePortfolioTotalValue } from 'uniswap/src/features/dataApi/balances'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export default function Profile() {
  const account = useAccount()
  const { convertFiatAmountFormatted, formatPercent } = useLocalizationContext()

  const { data: portfolioTotalValue, loading: portfolioLoading } = usePortfolioTotalValue({
    address: account.address,
  })

  return (
    <Flex minHeight="100vh" mt={-INTERFACE_NAV_HEIGHT} pt={INTERFACE_NAV_HEIGHT} px="$spacing20" width="100%">
      <Flex
        backgroundColor="$surface1"
        borderRadius="$rounded16"
        p="$spacing24"
        maxWidth={1200}
        width="100%"
        mx="auto"
        flex={1}
        flexDirection="column"
      >
        <Flex flexDirection="column" mb="$spacing32">
          <Text variant="heading2" mb="$spacing16">
            Portfolio
          </Text>
          {account.address && (
            <Flex flexDirection="column" gap="$spacing8">
              <Text variant="heading1" fontSize={48} lineHeight={56}>
                {portfolioLoading
                  ? '...'
                  : portfolioTotalValue?.balanceUSD
                    ? convertFiatAmountFormatted(portfolioTotalValue.balanceUSD, NumberType.PortfolioBalance)
                    : '$0.00'}
              </Text>
              {portfolioTotalValue?.percentChange && (
                <Flex flexDirection="row" alignItems="center" gap="$spacing8">
                  <DeltaArrow
                    delta={portfolioTotalValue.percentChange}
                    formattedDelta={formatPercent(Math.abs(portfolioTotalValue.percentChange))}
                  />
                  <Text
                    variant="subheading2"
                    color={portfolioTotalValue.percentChange >= 0 ? '$statusSuccess' : '$statusCritical'}
                  >
                    {formatPercent(Math.abs(portfolioTotalValue.percentChange))} (24h)
                  </Text>
                </Flex>
              )}
            </Flex>
          )}
        </Flex>
        {account.address ? (
          <MiniPortfolio account={account.address} />
        ) : (
          <Text variant="body1" color="$neutral2" textAlign="center">
            Connect your wallet to view your portfolio
          </Text>
        )}
      </Flex>
    </Flex>
  )
}
