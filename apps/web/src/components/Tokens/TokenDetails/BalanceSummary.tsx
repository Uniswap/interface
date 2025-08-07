import { Currency } from '@uniswap/sdk-core'
import { PortfolioBalance } from 'appGraphql/data/portfolios'
import { getTokenDetailsURL, gqlToCurrency, supportedChainIdFromGQLChain } from 'appGraphql/data/util'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { useAccount } from 'hooks/useAccount'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ThemedText } from 'theme/components'
import { Flex } from 'ui/src'
import { Chain } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

interface BalanceProps {
  currency?: Currency
  chainId?: UniverseChainId
  gqlBalance?: PortfolioBalance
  alignLeft?: boolean
  onClick?: () => void
}
const Balance = ({
  currency,
  chainId = UniverseChainId.Mainnet,
  gqlBalance,
  alignLeft = false,
  onClick,
}: BalanceProps) => {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const currencies = useMemo(() => [currency], [currency])

  const formattedGqlBalance = formatNumberOrString({
    value: gqlBalance?.quantity,
    type: NumberType.TokenNonTx,
  })
  const formattedUsdGqlValue = convertFiatAmountFormatted(
    gqlBalance?.denominatedValue?.value,
    NumberType.PortfolioBalance,
  )

  return (
    <Flex mt="$spacing12" row alignItems="center" onPress={onClick}>
      <PortfolioLogo
        currencies={currencies}
        chainId={chainId}
        images={[gqlBalance?.token?.project?.logoUrl]}
        size={32}
      />
      <Flex
        shrink
        row
        width="100%"
        justifyContent={alignLeft ? 'flex-start' : 'space-between'}
        gap={alignLeft ? '$spacing8' : 'unset'}
        alignItems="center"
        ml="$spacing12"
      >
        <Flex>
          <ThemedText.BodyPrimary>{formattedUsdGqlValue}</ThemedText.BodyPrimary>
        </Flex>
        <Flex>
          <ThemedText.BodySecondary>{formattedGqlBalance}</ThemedText.BodySecondary>
        </Flex>
      </Flex>
    </Flex>
  )
}

export const PageChainBalanceSummary = ({
  pageChainBalance,
  alignLeft = false,
}: {
  pageChainBalance?: PortfolioBalance
  alignLeft?: boolean
}) => {
  const { t } = useTranslation()
  if (!pageChainBalance || !pageChainBalance.token) {
    return null
  }
  const currency = gqlToCurrency(pageChainBalance.token)
  return (
    <Flex height="fit-content" width="100%">
      <ThemedText.HeadlineSmall color="neutral1">{t('tdp.balanceSummary.title')}</ThemedText.HeadlineSmall>
      <Balance currency={currency} chainId={currency?.chainId} gqlBalance={pageChainBalance} alignLeft={alignLeft} />
    </Flex>
  )
}

const OtherChainsBalanceSummary = ({
  otherChainBalances,
  hasPageChainBalance,
}: {
  otherChainBalances: readonly PortfolioBalance[]
  hasPageChainBalance: boolean
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { defaultChainId } = useEnabledChains()

  if (!otherChainBalances.length) {
    return null
  }
  return (
    <Flex>
      {hasPageChainBalance ? (
        <ThemedText.SubHeaderSmall>{t('tdp.balanceSummary.otherNetworks')}</ThemedText.SubHeaderSmall>
      ) : (
        <ThemedText.HeadlineSmall>{t('tdp.balanceSummary.otherNetworksBalance')}</ThemedText.HeadlineSmall>
      )}
      {otherChainBalances.map((balance) => {
        const currency = balance.token && gqlToCurrency(balance.token)
        const chainId = (balance.token && supportedChainIdFromGQLChain(balance.token.chain)) ?? defaultChainId
        return (
          <Balance
            key={balance.id}
            currency={currency}
            chainId={chainId}
            gqlBalance={balance}
            onClick={() =>
              navigate(
                getTokenDetailsURL({
                  address: balance.token?.address,
                  chain: balance.token?.chain ?? Chain.Ethereum,
                }),
              )
            }
          />
        )
      })}
    </Flex>
  )
}

export default function BalanceSummary() {
  const account = useAccount()
  const { currencyChain, multiChainMap } = useTDPContext()

  const pageChainBalance = multiChainMap[currencyChain]?.balance
  const otherChainBalances: PortfolioBalance[] = []
  for (const [key, value] of Object.entries(multiChainMap)) {
    if (key !== currencyChain && value.balance !== undefined) {
      otherChainBalances.push(value.balance)
    }
  }
  otherChainBalances.sort((a, b) => {
    const aQty = Number(a.quantity ?? 0)
    const bQty = Number(b.quantity ?? 0)
    return bQty - aQty
  })
  const hasBalances = pageChainBalance || Boolean(otherChainBalances.length)

  if (!account.isConnected || !hasBalances) {
    return null
  }
  return (
    <Flex flexDirection="column" gap="$gap24" height="fit-content" width="100%">
      <PageChainBalanceSummary pageChainBalance={pageChainBalance} />
      <OtherChainsBalanceSummary otherChainBalances={otherChainBalances} hasPageChainBalance={!!pageChainBalance} />
    </Flex>
  )
}
