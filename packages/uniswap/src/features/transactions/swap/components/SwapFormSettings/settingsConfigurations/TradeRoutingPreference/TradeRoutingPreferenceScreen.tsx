import type { TFunction } from 'i18next'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Switch, Text, type FlexProps } from 'ui/src'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { ProtocolItems } from 'uniswap/src/data/tradingApi/__generated__'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import {
  useTransactionSettingsActions,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { useSwapFormStoreDerivedSwapInfo } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import type { FrontendSupportedProtocol } from 'uniswap/src/features/transactions/swap/utils/protocols'

export function TradeRoutingPreferenceScreen(): JSX.Element {
  const { t } = useTranslation()
  const getIsUniswapXSupported = useUniswapContextSelector((state) => state.getIsUniswapXSupported)
  const { selectedProtocols, isV4HookPoolsEnabled } = useTransactionSettingsStore((s) => ({
    selectedProtocols: s.selectedProtocols,
    isV4HookPoolsEnabled: s.isV4HookPoolsEnabled,
  }))
  const { toggleProtocol } = useTransactionSettingsActions()

  const chainId = useSwapFormStoreDerivedSwapInfo((s) => s.chainId)
  const isUniswapXSupported = getIsUniswapXSupported?.(chainId)

  const classicProtocolsCount = selectedProtocols.length

  // Prevent the user from deselecting all on-chain protocols (AKA only selecting UniswapX)
  const onlyOneClassicProtocolSelected =
    (classicProtocolsCount === 1 && !isV4HookPoolsEnabled) || (classicProtocolsCount === 0 && isV4HookPoolsEnabled)

  const getProtocolTitle = createGetProtocolTitle({
    isUniswapXSupported,
    t,
  })

  return (
    <Flex gap="$spacing16" my="$spacing16">
      <OptionRow
        active={selectedProtocols.includes(ProtocolItems.V3)}
        elementName={ElementName.SwapRoutingPreferenceV3}
        title={getProtocolTitle(ProtocolItems.V3)}
        cantDisable={onlyOneClassicProtocolSelected}
        onSelect={() => toggleProtocol(ProtocolItems.V3)}
      />
    </Flex>
  )
}

function createGetProtocolTitle(ctx: {
  isUniswapXSupported?: boolean
  t: TFunction
}): (preference: FrontendSupportedProtocol) => JSX.Element | string {
  const { t } = ctx
  return (preference: FrontendSupportedProtocol) => {
    switch (preference) {
      case ProtocolItems.V3:
        return t('swap.settings.routingPreference.option.v3.title')
      default:
        return <></>
    }
  }
}

type OptionRowProps = {
  title: JSX.Element | string
  active: boolean
  elementName: ElementName
  cantDisable: boolean
  onSelect: () => void
  description?: string | ReactNode
  disabled?: boolean
  alignItems?: Extract<FlexProps['alignItems'], 'flex-start' | 'center'>
  footerContent?: JSX.Element
}

function OptionRow({
  title,
  description,
  active,
  elementName,
  cantDisable,
  onSelect,
  disabled,
  alignItems = 'center',
  footerContent,
}: OptionRowProps): JSX.Element {
  return (
    <Flex flexDirection="column" gap="$spacing12">
      <Flex row py="$spacing2" alignItems={alignItems} gap="$spacing16" justifyContent="space-between">
        <Flex shrink gap="$spacing4">
          {typeof title === 'string' ? (
            <Text color="$neutral1" variant="subheading2">
              {title}
            </Text>
          ) : (
            title
          )}

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
          <Switch
            disabled={(active && cantDisable) || disabled}
            checked={active}
            variant="branded"
            onCheckedChange={onSelect}
          />
        </Trace>
      </Flex>
      {footerContent}
    </Flex>
  )
}
