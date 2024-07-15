import { TFunction } from 'i18next'
import { ReactNode } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, UniswapXText } from 'ui/src'
import { InfoCircleFilled, UniswapX } from 'ui/src/components/icons'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ElementNameType } from 'uniswap/src/features/telemetry/constants'
import { TradeProtocolPreference } from 'uniswap/src/features/transactions/transactionState/types'
import { isMobileApp } from 'utilities/src/platform'
import { UniswapXInfo } from 'wallet/src/features/transactions/swap/modals/UniswapXInfo'

// TODO(WEB-4297): Update controls on this screen to allow combinations of any/all routing options once supported by TradingAPI.
export function ProtocolPreferenceScreen({
  tradeProtocolPreference,
  setTradeProtocolPreference,
}: {
  tradeProtocolPreference: TradeProtocolPreference
  setTradeProtocolPreference: (tradeProtocolPreference: TradeProtocolPreference) => void
}): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing16" my="$spacing16">
      <OptionRow
        active={tradeProtocolPreference === TradeProtocolPreference.Default}
        description={<DefaultOptionDescription />}
        elementName={ElementName.SwapRoutingPreferenceDefault}
        title={getTitleFromProtocolPreference(TradeProtocolPreference.Default, t)}
        onSelect={() => setTradeProtocolPreference(TradeProtocolPreference.Default)}
      />
      <OptionRow
        active={tradeProtocolPreference === TradeProtocolPreference.V3Only}
        elementName={ElementName.SwapRoutingPreferenceV3}
        title={getTitleFromProtocolPreference(TradeProtocolPreference.V3Only, t)}
        onSelect={() => setTradeProtocolPreference(TradeProtocolPreference.V3Only)}
      />
      <OptionRow
        active={tradeProtocolPreference === TradeProtocolPreference.V2Only}
        elementName={ElementName.SwapRoutingPreferenceV3}
        title={getTitleFromProtocolPreference(TradeProtocolPreference.V2Only, t)}
        onSelect={() => setTradeProtocolPreference(TradeProtocolPreference.V2Only)}
      />
    </Flex>
  )
}

export function getTitleFromProtocolPreference(preference: TradeProtocolPreference, t: TFunction): string {
  switch (preference) {
    case TradeProtocolPreference.Default:
      return t('swap.settings.routingPreference.option.default.title')
    case TradeProtocolPreference.V2Only:
      return t('swap.settings.routingPreference.option.v2.title')
    case TradeProtocolPreference.V3Only:
      return t('swap.settings.routingPreference.option.v3.title')
  }
}

function OptionRow({
  title,
  description,
  active,
  elementName,
  onSelect,
}: {
  title: string
  active: boolean
  elementName: ElementNameType
  onSelect: () => void
  description?: ReactNode
}): JSX.Element {
  return (
    <Flex row gap="$spacing16" justifyContent="space-between">
      <Flex shrink gap="$spacing4">
        <Text color="$neutral1" variant="subheading2">
          {title}
        </Text>
        {typeof description === 'string' ? (
          <Text color="$neutral2" variant="body3">
            {description}
          </Text>
        ) : (
          description
        )}
      </Flex>
      {/* Only log this event if toggle value is off, and then turned on */}
      <Trace element={elementName} logPress={!active}>
        <TouchableArea onPress={onSelect}>
          <Flex
            centered
            borderColor={active ? '$accent1' : '$neutral3'}
            borderRadius="$roundedFull"
            borderWidth="$spacing2"
            height="$spacing24"
            width="$spacing24"
          >
            {active && (
              <Flex backgroundColor="$accent1" borderRadius="$roundedFull" height="$spacing12" width="$spacing12" />
            )}
          </Flex>
        </TouchableArea>
      </Trace>
    </Flex>
  )
}

function DefaultOptionDescription(): JSX.Element {
  const uniswapXEnabled = useFeatureFlag(FeatureFlags.UniswapX)
  const { t } = useTranslation()

  return (
    <Flex gap="$spacing4">
      <Text color="$neutral2" variant="body3">
        {t('swap.settings.routingPreference.option.default.description')}
      </Text>
      {uniswapXEnabled && (
        <UniswapXInfo
          tooltipTrigger={
            <Text alignItems="center" color="$neutral2" variant="body3">
              <Trans
                components={{
                  icon: <UniswapX size="$icon.16" style={!isMobileApp && { transform: 'translateY(3px)' }} />,
                  gradient: <UniswapXText height={18} variant="body3" />,
                  info: (
                    <InfoCircleFilled
                      color="$neutral3"
                      size="$icon.16"
                      style={!isMobileApp && { transform: 'translateY(3px)' }}
                    />
                  ),
                }}
                i18nKey="uniswapx.included"
              />
            </Text>
          }
        />
      )}
    </Flex>
  )
}
