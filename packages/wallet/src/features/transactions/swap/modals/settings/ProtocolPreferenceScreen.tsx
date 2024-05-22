import { TFunction } from 'i18next'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Trace } from 'utilities/src/telemetry/trace/Trace'
import { TradeProtocolPreference } from 'wallet/src/features/transactions/transactionState/types'
import { ElementName, ElementNameType } from 'wallet/src/telemetry/constants'

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
        description={t('swap.settings.routingPreference.option.default.description')}
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

export function getTitleFromProtocolPreference(
  preference: TradeProtocolPreference,
  t: TFunction
): string {
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
  description?: string
}): JSX.Element {
  return (
    <Flex row gap="$spacing16" justifyContent="space-between">
      <Flex shrink gap="$spacing4">
        <Text color="$neutral1" variant="subheading2">
          {title}
        </Text>
        {description && (
          <Text color="$neutral2" variant="body3">
            {description}
          </Text>
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
            width="$spacing24">
            {active && (
              <Flex
                backgroundColor="$accent1"
                borderRadius="$roundedFull"
                height="$spacing12"
                width="$spacing12"
              />
            )}
          </Flex>
        </TouchableArea>
      </Trace>
    </Flex>
  )
}
