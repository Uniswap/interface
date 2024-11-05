import { TFunction } from 'i18next'
import { ReactNode, useCallback, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Switch, Text, UniswapXText } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { ProtocolItems } from 'uniswap/src/data/tradingApi/__generated__'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ElementNameType } from 'uniswap/src/features/telemetry/constants'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { UniswapXInfo } from 'uniswap/src/features/transactions/swap/modals/UniswapXInfo'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import {
  DEFAULT_PROTOCOL_OPTIONS,
  FrontendSupportedProtocol,
} from 'uniswap/src/features/transactions/swap/utils/protocols'
import { isMobileApp } from 'utilities/src/platform'

function isDefaultOptions(selectedProtocols: FrontendSupportedProtocol[]): boolean {
  return new Set(selectedProtocols).size === new Set([...selectedProtocols, ...DEFAULT_PROTOCOL_OPTIONS]).size
}

export const ProtocolPreference: SwapSettingConfig = {
  renderTitle: (t) => t('swap.settings.routingPreference.title'),
  Control() {
    const { t } = useTranslation()
    const { selectedProtocols } = useSwapFormContext()
    const tradeProtocolPreferenceTitle = isDefaultOptions(selectedProtocols) ? t('common.default') : t('common.custom')

    return (
      <Text color="$neutral2" flexWrap="wrap" variant="subheading2">
        {tradeProtocolPreferenceTitle}
      </Text>
    )
  },
  Screen() {
    const { t } = useTranslation()
    const { selectedProtocols, updateSwapForm } = useSwapFormContext()
    const [isDefault, setIsDefault] = useState(isDefaultOptions(selectedProtocols))
    const uniswapXEnabled = useFeatureFlag(FeatureFlags.UniswapX)

    // We prevent the user from deselecting all options
    const onlyOneProtocolSelected = selectedProtocols.length === 1

    // We prevent the user from deselecting all on-chain protocols (AKA only selecting UniswapX)
    const onlyOneClassicProtocolSelected = selectedProtocols.filter((p) => p !== ProtocolItems.UNISWAPX_V2).length === 1

    const toggleProtocol = useCallback(
      (protocol: FrontendSupportedProtocol) => {
        if (selectedProtocols.includes(protocol)) {
          updateSwapForm({ selectedProtocols: selectedProtocols.filter((p) => p !== protocol) })
        } else {
          updateSwapForm({ selectedProtocols: [...selectedProtocols, protocol] })
        }
      },
      [updateSwapForm, selectedProtocols],
    )

    const v4Enabled = useFeatureFlag(FeatureFlags.V4Swap)

    const toggleDefault = useCallback(() => {
      setIsDefault(!isDefault)
      if (!isDefault) {
        updateSwapForm({ selectedProtocols: DEFAULT_PROTOCOL_OPTIONS })
      }
    }, [updateSwapForm, isDefault])

    return (
      <Flex gap="$spacing16" my="$spacing16">
        <OptionRow
          active={isDefault}
          description={<DefaultOptionDescription isDefault={isDefault} />}
          elementName={ElementName.SwapRoutingPreferenceDefault}
          title={t('common.default')}
          cantDisable={false}
          onSelect={toggleDefault}
        />
        {!isDefault && (
          <>
            {uniswapXEnabled && (
              <OptionRow
                active={selectedProtocols.includes(ProtocolItems.UNISWAPX_V2)}
                elementName={ElementName.SwapRoutingPreferenceUniswapX}
                title={getProtocolTitle(ProtocolItems.UNISWAPX_V2, t)}
                cantDisable={onlyOneProtocolSelected}
                onSelect={() => toggleProtocol(ProtocolItems.UNISWAPX_V2)}
              />
            )}
            {v4Enabled && (
              <OptionRow
                active={selectedProtocols.includes(ProtocolItems.V4)}
                elementName={ElementName.SwapRoutingPreferenceV4}
                title={getProtocolTitle(ProtocolItems.V4, t)}
                cantDisable={onlyOneProtocolSelected}
                onSelect={() => toggleProtocol(ProtocolItems.V4)}
              />
            )}
            <OptionRow
              active={selectedProtocols.includes(ProtocolItems.V3)}
              elementName={ElementName.SwapRoutingPreferenceV3}
              title={getProtocolTitle(ProtocolItems.V3, t)}
              cantDisable={onlyOneClassicProtocolSelected}
              onSelect={() => toggleProtocol(ProtocolItems.V3)}
            />
            <OptionRow
              active={selectedProtocols.includes(ProtocolItems.V2)}
              elementName={ElementName.SwapRoutingPreferenceV3}
              title={getProtocolTitle(ProtocolItems.V2, t)}
              cantDisable={onlyOneClassicProtocolSelected}
              onSelect={() => toggleProtocol(ProtocolItems.V2)}
            />
          </>
        )}
      </Flex>
    )
  },
}

export function getProtocolTitle(preference: FrontendSupportedProtocol, t: TFunction): JSX.Element | string {
  switch (preference) {
    case ProtocolItems.UNISWAPX_V2:
      return (
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
                i18nKey="uniswapx.item"
              />
            </Text>
          }
        />
      )
    case ProtocolItems.V2:
      return t('swap.settings.routingPreference.option.v2.title')
    case ProtocolItems.V3:
      return t('swap.settings.routingPreference.option.v3.title')
    case ProtocolItems.V4:
      return t('swap.settings.routingPreference.option.v4.title')
    default:
      return <></>
  }
}

function OptionRow({
  title,
  description,
  active,
  elementName,
  cantDisable,
  onSelect,
}: {
  title: JSX.Element | string
  active: boolean
  elementName: ElementNameType
  cantDisable: boolean
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
        <Switch disabled={active && cantDisable} checked={active} variant="branded" onCheckedChange={onSelect} />
      </Trace>
    </Flex>
  )
}

function DefaultOptionDescription({ isDefault }: { isDefault: boolean }): JSX.Element {
  const uniswapXEnabled = useFeatureFlag(FeatureFlags.UniswapX)
  const { t } = useTranslation()

  const showIncludesUniswapX = uniswapXEnabled && isDefault

  return (
    <Flex gap="$spacing4">
      <Text color="$neutral2" variant="body3">
        {t('swap.settings.routingPreference.option.default.description')}
      </Text>
      {showIncludesUniswapX && (
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
