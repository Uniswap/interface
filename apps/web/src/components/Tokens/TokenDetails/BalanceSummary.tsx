import { getTokenDetailsURL } from 'appGraphql/data/util'
import { Currency } from '@uniswap/sdk-core'
import { PortfolioLogo } from 'components/AccountDrawer/MiniPortfolio/PortfolioLogo'
import { useModalState } from 'hooks/useModalState'
import { useAtom } from 'jotai'
import { useTDPContext } from 'pages/TokenDetails/TDPContext'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, Text, TouchableArea } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { getBridgedAsset } from 'uniswap/src/components/BridgedAsset/utils'
import { WormholeModalAtom } from 'uniswap/src/components/BridgedAsset/WormholeModal'
import { useConnectionStatus } from 'uniswap/src/features/accounts/store/hooks'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { PortfolioBalance } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'

interface BalanceProps {
  currency?: Currency
  chainId?: UniverseChainId
  fetchedBalance?: PortfolioBalance
  alignLeft?: boolean
  onClick?: () => void
}
const Balance = ({
  currency,
  chainId = UniverseChainId.Mainnet,
  fetchedBalance,
  alignLeft = false,
  onClick,
}: BalanceProps) => {
  const { convertFiatAmountFormatted, formatNumberOrString } = useLocalizationContext()
  const currencies = useMemo(() => (currency ? [currency] : []), [currency])

  const formattedBalance = formatNumberOrString({
    value: fetchedBalance?.quantity,
    type: NumberType.TokenNonTx,
  })
  const formattedUsdValue = convertFiatAmountFormatted(fetchedBalance?.balanceUSD, NumberType.PortfolioBalance)

  return (
    <TouchableArea onPress={onClick} {...(onClick ? ClickableTamaguiStyle : {})}>
      <Flex mt="$spacing12" row alignItems="center">
        <PortfolioLogo
          currencies={currencies}
          chainId={chainId}
          images={fetchedBalance?.currencyInfo.logoUrl ? [fetchedBalance.currencyInfo.logoUrl] : undefined}
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
            <Text variant="body2" color="$neutral1">
              {formattedUsdValue}
            </Text>
          </Flex>
          <Flex>
            <Text variant="body2" color="$neutral2">
              {formattedBalance}
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </TouchableArea>
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
  if (!pageChainBalance) {
    return null
  }
  const currency = pageChainBalance.currencyInfo.currency
  return (
    <Flex height="fit-content" width="100%">
      <Text variant="subheading1" color="$neutral1">
        {t('tdp.balanceSummary.title')}
      </Text>
      <Balance currency={currency} chainId={currency.chainId} fetchedBalance={pageChainBalance} alignLeft={alignLeft} />
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
        <Text variant="body3" color="$neutral2">
          {t('tdp.balanceSummary.otherNetworks')}
        </Text>
      ) : (
        <Text variant="subheading1" color="$neutral1">
          {t('tdp.balanceSummary.otherNetworksBalance')}
        </Text>
      )}
      {otherChainBalances.map((balance) => {
        const currency = balance.currencyInfo.currency
        const chainId = currency.chainId || defaultChainId
        return (
          <Balance
            key={balance.id}
            currency={currency}
            chainId={chainId}
            fetchedBalance={balance}
            onClick={() =>
              navigate(
                getTokenDetailsURL({
                  address: currency.isToken ? currency.address : undefined,
                  chain: toGraphQLChain(chainId),
                }),
              )
            }
          />
        )
      })}
    </Flex>
  )
}

function BridgedAssetWithdrawButton(): JSX.Element | null {
  const { t } = useTranslation()
  const { currencyChainId, address } = useTDPContext()
  const currencyInfo = useCurrencyInfo(buildCurrencyId(currencyChainId, address))
  const { openModal } = useModalState(ModalName.Wormhole)
  const [, setWormholeModalCurrencyInfo] = useAtom(WormholeModalAtom)
  const handlePress = useEvent(() => {
    if (currencyInfo) {
      setWormholeModalCurrencyInfo({ currencyInfo })
      openModal()
    }
  })

  const bridgedAsset = getBridgedAsset(currencyInfo)
  if (!bridgedAsset) {
    return null
  }
  return (
    <TouchableArea onPress={handlePress} hoverStyle={{ opacity: 0.8 }}>
      <Flex row gap="$spacing8">
        <Text variant="buttonLabel3" color="$neutral2">
          {t('bridgedAsset.wormhole.withdrawToNativeChain', { nativeChainName: bridgedAsset.nativeChain })}
        </Text>
        <ExternalLink color="$neutral3" size="$icon.16" />
      </Flex>
    </TouchableArea>
  )
}

export default function BalanceSummary() {
  const { isDisconnected } = useConnectionStatus()
  const { currencyChain, multiChainMap } = useTDPContext()

  const pageChainBalance = multiChainMap[currencyChain]?.balance
  const otherChainBalances: PortfolioBalance[] = []
  for (const [key, value] of Object.entries(multiChainMap)) {
    if (key !== currencyChain && value.balance !== undefined) {
      otherChainBalances.push(value.balance)
    }
  }
  otherChainBalances.sort((a, b) => {
    const aQty = Number(a.quantity)
    const bQty = Number(b.quantity)
    return bQty - aQty
  })
  const hasBalances = pageChainBalance || Boolean(otherChainBalances.length)

  if (isDisconnected || !hasBalances) {
    return null
  }
  return (
    <Flex flexDirection="column" gap="$gap24" height="fit-content" width="100%">
      <PageChainBalanceSummary pageChainBalance={pageChainBalance} />
      <OtherChainsBalanceSummary otherChainBalances={otherChainBalances} hasPageChainBalance={!!pageChainBalance} />
      <BridgedAssetWithdrawButton />
    </Flex>
  )
}
