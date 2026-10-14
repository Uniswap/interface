import { type GasFeeResult, TradingApi } from '@universe/api'
import type { UniverseChainId } from '@universe/chains'
import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { Gas } from '@universe/mycelium/icons/Gas'
import { UniswapLogo } from '@universe/mycelium/icons/UniswapLogo'
import { X } from '@universe/mycelium/icons/X'
import { TestID } from '@universe/test'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { RoutingLabel } from 'uniswap/src/components/RoutingDiagram/RoutingLabel'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { UniswapStaticUrls } from 'uniswap/src/constants/urls'
import { useUSDValueOfGasFee } from 'uniswap/src/features/gas/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { Trace } from 'uniswap/src/features/telemetry/Trace'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { RouteDiagramInfoProps } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/RouteDiagram/RouteDiagramInfo'
import { RouteSankey } from 'uniswap/src/features/transactions/swap/components/RoutingInfo/RouteDiagram/RouteSankey'
import type { Trade } from 'uniswap/src/features/transactions/swap/types/trade'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { useRoutingProvider } from 'uniswap/src/utils/routingDiagram/routingRegistry'
import { NumberType } from 'utilities/src/format/types'

const MODAL_MAX_WIDTH = 880
const MODAL_SANKEY_HEIGHT = 440
const MODAL_NODE_ICON_SIZE = 18

export function RouteDiagramInfo({ trade, gasFee, diagram, logoUrlByTokenKey }: RouteDiagramInfoProps): JSX.Element {
  const { t } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const openModal = useCallback((): void => setIsModalOpen(true), [])
  const closeModal = useCallback((): void => setIsModalOpen(false), [])
  const chainId = trade.inputAmount.currency.chainId as UniverseChainId
  // A native <-> wrapped conversion is drawn as a hop but is not a pool, so it doesn't count toward hops.
  const poolCount = diagram.links.filter((link) => link.protocol !== TradingApi.RouteGraphPool.protocol.WRAP).length

  return (
    <>
      <Flex row alignItems="center" justifyContent="space-between">
        <Flex row shrink alignItems="center" gap="$spacing8">
          <Text color="$neutral2" variant="body3">
            {t('common.bestRoute')}
          </Text>
          {/* Same 20px tag as the Max slippage row's "Auto", so the Route row stays the height of its neighbours. */}
          <Trace logPress element={ElementName.SwapRouteDiagramView} properties={{ pool_count: poolCount }}>
            <TouchableArea
              centered
              height={20}
              px="$spacing8"
              borderRadius="$rounded6"
              backgroundColor="$surface3"
              hoverStyle={{ backgroundColor: '$surface3Hovered' }}
              testID={TestID.SwapRouteDiagramView}
              onPress={openModal}
            >
              <Text color="$neutral1" variant="buttonLabel4" lineHeight={16}>
                {t('common.button.view')}
              </Text>
            </TouchableArea>
          </Trace>
        </Flex>
        <Flex row shrink justifyContent="flex-end">
          <RoutingLabel trade={trade} />
        </Flex>
      </Flex>
      <Modal
        name={ModalName.RouteDiagram}
        isModalOpen={isModalOpen}
        maxWidth={MODAL_MAX_WIDTH}
        padding="$spacing20"
        gap="$spacing8"
        borderRadius="$rounded24"
        onClose={closeModal}
      >
        <Flex gap="$spacing8" width="100%">
          <RouteDiagramHeader
            trade={trade}
            chainId={chainId}
            gasFee={gasFee}
            poolCount={poolCount}
            onClose={closeModal}
          />
          <RouteSankey
            diagram={diagram}
            chainId={chainId}
            height={MODAL_SANKEY_HEIGHT}
            iconSize={MODAL_NODE_ICON_SIZE}
            logoUrlByTokenKey={logoUrlByTokenKey}
            onNavigate={closeModal}
          />
          <Text variant="body3" lineHeight={20} color="$neutral2">
            {t('swap.routing.guidestar.description')}{' '}
            <LearnMoreLink
              onlyUseText
              url={UniswapStaticUrls.tradingApiRoutingDocsUrl}
              textVariant="body3"
              textColor="$neutral2"
            />
          </Text>
        </Flex>
      </Modal>
    </>
  )
}

function RouteDiagramHeader({
  trade,
  chainId,
  gasFee,
  poolCount,
  onClose,
}: {
  trade: Trade
  chainId: UniverseChainId
  gasFee: GasFeeResult
  poolCount: number
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const routingProvider = useRoutingProvider({ routing: trade.routing })
  const providerName = routingProvider?.name ?? t('swap.routing.guidestar.defaultProvider')
  const { value: gasFeeUSD } = useUSDValueOfGasFee(chainId, gasFee.displayValue ?? undefined)
  const gasCost = gasFeeUSD !== undefined ? convertFiatAmountFormatted(gasFeeUSD, NumberType.FiatGasPrice) : undefined

  return (
    <Flex row alignItems="flex-start" gap="$spacing4">
      <Flex shrink gap="$spacing2">
        <Flex row flexWrap="wrap" alignItems="center" columnGap="$spacing8" rowGap="$spacing4">
          <TradeLeg amount={trade.inputAmount} />
          <Text variant="subheading1" lineHeight={24} color="$neutral2">
            →
          </Text>
          <TradeLeg amount={trade.outputAmount} />
        </Flex>
        <Flex row flexWrap="wrap" alignItems="center" columnGap="$spacing6" rowGap="$spacing2">
          <UniswapLogo size={16} color="$accent1" />
          <Text variant="body3" lineHeight={20} color="$neutral2">
            {t('swap.routing.guidestar.via', { provider: providerName })}
          </Text>
          <Bullet />
          <Text variant="body3" lineHeight={20} color="$neutral2">
            {t('swap.routing.guidestar.hops', { count: poolCount })}
          </Text>
          {gasCost && (
            <>
              <Bullet />
              <Flex row alignItems="center" gap="$spacing4">
                <Gas color="$neutral2" size="$icon.16" />
                <Text variant="body3" lineHeight={20} color="$neutral2">
                  {gasCost}
                </Text>
              </Flex>
            </>
          )}
        </Flex>
      </Flex>
      <TouchableArea
        ml="auto"
        p="$spacing4"
        borderRadius="$roundedFull"
        backgroundColor="$surface3"
        hoverStyle={{ backgroundColor: '$surface3Hovered' }}
        accessibilityLabel={t('common.button.close')}
        onPress={onClose}
      >
        <X size="$icon.16" color="$neutral1" />
      </TouchableArea>
    </Flex>
  )
}

function TradeLeg({ amount }: { amount: Trade['inputAmount'] }): JSX.Element {
  const { formatCurrencyAmount } = useLocalizationContext()
  const currencyInfo = useCurrencyInfo(currencyId(amount.currency))
  return (
    <Flex row alignItems="center" gap="$spacing6">
      <CurrencyLogo hideNetworkLogo currencyInfo={currencyInfo} size={20} />
      <Text variant="subheading1" lineHeight={24} color="$neutral1">
        {formatCurrencyAmount({ value: amount, type: NumberType.TokenTx })} {amount.currency.symbol}
      </Text>
    </Flex>
  )
}

function Bullet(): JSX.Element {
  return <Flex width={4} height={4} shrink={false} borderRadius="$roundedFull" backgroundColor="$surface3" />
}
