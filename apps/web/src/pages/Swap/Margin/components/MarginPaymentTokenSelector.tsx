import { UniverseChainId } from '@universe/chains'
import { Flex, ScrollView, Text, TouchableArea } from '@universe/mycelium'
import { useTranslation } from 'react-i18next'
import { ModalCloseIcon, Separator } from 'ui/src'
import { SpinningLoader } from 'ui/src/loading/SpinningLoader'
import { iconSizes } from 'ui/src/theme'
import { TokenLogo } from 'uniswap/src/components/CurrencyLogo/TokenLogo'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { getChainLabel } from 'uniswap/src/features/chains/utils'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  useMarginFormStore,
  useMarginFormStoreActions,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/useMarginFormStore'
import type { MarginPaymentToken } from 'uniswap/src/features/transactions/margin/types'
import { NumberType } from 'utilities/src/format/types'
import { useEvent } from 'utilities/src/react/hooks'
import type { MarginMarket } from '~/constants/margin'
import { useAccount } from '~/hooks/useAccount'
import { useMarginMarkets } from '~/pages/Swap/Margin/hooks/useMarginMarkets'
import { type MarginPaymentTokenRow, useMarginPaymentTokens } from '~/pages/Swap/Margin/hooks/useMarginPaymentTokens'
import {
  isMarketDefaultPaymentToken,
  isPaymentTokenDifferentFromCollateral,
} from '~/pages/Swap/Margin/marginCurrencies'

function PaymentTokenRow({
  row,
  onSelect,
}: {
  row: MarginPaymentTokenRow
  onSelect: (token: MarginPaymentToken) => void
}): JSX.Element {
  const { t } = useTranslation()
  const { formatNumberOrString } = useLocalizationContext()
  const onPress = useEvent(() => onSelect(row.token))
  return (
    <TouchableArea
      borderRadius="$rounded12"
      hoverStyle={{ backgroundColor: '$surface2' }}
      aria-label={t('margin.payment.selector.rowLabel', { symbol: row.token.symbol })}
      onPress={onPress}
    >
      <Flex row alignItems="center" px="$spacing12" py="$spacing12" gap="$spacing12">
        <TokenLogo size={36} url={row.currencyInfo.logoUrl} symbol={row.token.symbol} chainId={row.token.chainId} />
        <Flex fill gap="$spacing2">
          <Text variant="body2" color="$neutral1">
            {row.token.symbol}
          </Text>
          <Text variant="body4" color="$neutral2">
            {getChainLabel(row.token.chainId as UniverseChainId)}
          </Text>
        </Flex>
        <Flex alignItems="flex-end">
          <Text variant="body3" color="$neutral1">
            {formatNumberOrString({ value: row.balance, type: NumberType.TokenNonTx })}
          </Text>
          {row.balanceUSD !== undefined ? (
            <Text variant="body4" color="$neutral2">
              {formatNumberOrString({ value: row.balanceUSD, type: NumberType.PortfolioBalance })}
            </Text>
          ) : null}
        </Flex>
      </Flex>
    </TouchableArea>
  )
}

// Logs the pick and maps the market default to undefined, so the default keeps re-resolving on
// market switch.
export function resolveMarginPaymentTokenPick({
  token,
  market,
}: {
  token: MarginPaymentToken
  market: MarginMarket
}): MarginPaymentToken | undefined {
  if (isPaymentTokenDifferentFromCollateral({ token, market })) {
    sendAnalyticsEvent(InterfaceEventName.MarginPaymentTokenSelected, { symbol: token.symbol, marketKey: market.key })
  }
  return isMarketDefaultPaymentToken({ token, market }) ? undefined : token
}

export function MarginPaymentTokenSelector({
  isOpen: controlledIsOpen,
  market: marketOverride,
  onClose: controlledOnClose,
  onSelect: controlledOnSelect,
}: {
  // Controlled mode (add-collateral editor): drive open state locally and route selection to a caller
  // callback for its OWN market, so the pick never touches the shared open-form store. Omit every prop
  // for the store-backed open form.
  isOpen?: boolean
  market?: MarginMarket
  onClose?: () => void
  onSelect?: (token: MarginPaymentToken | undefined) => void
} = {}): JSX.Element {
  const { t } = useTranslation()
  const account = useAccount()
  const { storeIsOpen, pairKey } = useMarginFormStore((s) => ({
    storeIsOpen: s.selectingPaymentToken,
    pairKey: s.pairKey,
  }))
  const { setMarginFormState } = useMarginFormStoreActions()
  const { rows, isLoading } = useMarginPaymentTokens({ evmAddress: account.address })
  // getPairMarket resolves the live registry only — a key it hasn't loaded (yet, or at all) leaves
  // market undefined, which onSelect below guards against rather than guessing default-ness.
  const { getPairMarket } = useMarginMarkets()

  const isControlled = controlledOnSelect !== undefined
  const isOpen = isControlled ? Boolean(controlledIsOpen) : storeIsOpen
  // Resolve default-ness / analytics against the caller's market (the position's, in the drawer), not
  // the open form's selected market.
  const market = marketOverride ?? getPairMarket(pairKey)

  const onClose = useEvent(() => {
    if (isControlled) {
      controlledOnClose?.()
    } else {
      setMarginFormState({ selectingPaymentToken: false })
    }
  })
  const onSelect = useEvent((token: MarginPaymentToken) => {
    // Without a resolved market, default-ness can't be determined — picking would either force an
    // explicit token that should have stayed the (re-resolving) default, or the reverse. No-op until
    // the market resolves rather than guessing.
    if (!market) {
      return
    }
    const resolved = resolveMarginPaymentTokenPick({ token, market })
    if (isControlled) {
      controlledOnSelect(resolved)
    } else {
      setMarginFormState({ paymentToken: resolved, selectingPaymentToken: false })
    }
  })

  return (
    <Modal
      name={ModalName.MarginPaymentTokenSelector}
      isModalOpen={isOpen}
      maxWidth={420}
      padding={0}
      onClose={onClose}
    >
      <Flex p="$spacing16" gap="$spacing12">
        <Flex row alignItems="center" justifyContent="space-between">
          <Text variant="subheading1" color="$neutral1">
            {t('margin.payment.selector.title')}
          </Text>
          <ModalCloseIcon onClose={onClose} />
        </Flex>
        <ScrollView maxHeight={420} showsVerticalScrollIndicator={false}>
          <Flex>
            {isLoading && rows.length === 0 ? (
              <Flex p="$spacing24" alignItems="center">
                <SpinningLoader size={iconSizes.icon24} color="$neutral2" />
              </Flex>
            ) : (
              <>
                {rows.map((row, index) => (
                  <Flex key={`${row.token.chainId}-${row.token.address}-${row.token.isNative}`}>
                    {index > 0 ? <Separator /> : null}
                    <PaymentTokenRow row={row} onSelect={onSelect} />
                  </Flex>
                ))}
                {!isLoading && rows.length === 0 ? (
                  <Flex p="$spacing16" alignItems="center">
                    <Text variant="body3" color="$neutral2">
                      {t('margin.payment.selector.empty')}
                    </Text>
                  </Flex>
                ) : null}
              </>
            )}
          </Flex>
        </ScrollView>
      </Flex>
    </Modal>
  )
}
