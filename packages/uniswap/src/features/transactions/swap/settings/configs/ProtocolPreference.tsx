import { TFunction } from 'i18next'
import { ReactNode, useCallback, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Switch, Text, UniswapXText } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { ProtocolItems } from 'uniswap/src/data/tradingApi/__generated__'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ElementNameType, ModalName } from 'uniswap/src/features/telemetry/constants'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { UniswapXInfo } from 'uniswap/src/features/transactions/swap/modals/UniswapXInfo'
import { SwapSettingConfig } from 'uniswap/src/features/transactions/swap/settings/configs/types'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/useV4SwapEnabled'
import {
  DEFAULT_PROTOCOL_OPTIONS,
  FrontendSupportedProtocol,
} from 'uniswap/src/features/transactions/swap/utils/protocols'
import { isInterface } from 'utilities/src/platform'

function isDefaultOptions(selectedProtocols: FrontendSupportedProtocol[]): boolean {
  return new Set(selectedProtocols).size === new Set([...selectedProtocols, ...DEFAULT_PROTOCOL_OPTIONS]).size
}

export const ProtocolPreference: SwapSettingConfig = {
  renderTitle: (t) => t('swap.settings.routingPreference.title'),
  ...(!isInterface && {
    renderCloseButtonText: (t) => t('common.button.save'),
  }),
  Control() {
    const { t } = useTranslation()
    const { selectedProtocols } = useTransactionSettingsContext()

    const getTradeProtocolPreferenceTitle = (): string => {
      if (isDefaultOptions(selectedProtocols)) {
        return t('common.default')
      }

      return t('common.custom')
    }

    return (
      <Text color="$neutral2" flexWrap="wrap" variant="subheading2">
        {getTradeProtocolPreferenceTitle()}
      </Text>
    )
  },
  Screen() {
    const { t } = useTranslation()
    const { selectedProtocols, updateTransactionSettings } = useTransactionSettingsContext()
    const [isDefault, setIsDefault] = useState(isDefaultOptions(selectedProtocols))
    const uniswapXEnabledFlag = useFeatureFlag(FeatureFlags.UniswapX)
    const v4EnabledFlag = useFeatureFlag(FeatureFlags.V4Swap)

    const { chainId } = useSwapFormContext().derivedSwapInfo
    const uniswapXEnabled = uniswapXEnabledFlag && chainId !== UniverseChainId.MonadTestnet
    const v4SwapEnabled = useV4SwapEnabled(chainId)
    const chainName = getChainInfo(chainId).name
    const restrictionDescription = t('swap.settings.protection.subtitle.unavailable', { chainName })

    // We prevent the user from deselecting all options
    const onlyOneProtocolSelected = selectedProtocols.length === 1

    // We prevent the user from deselecting all on-chain protocols (AKA only selecting UniswapX)
    const onlyOneClassicProtocolSelected =
      selectedProtocols.filter((p) => {
        if (!v4SwapEnabled && p === ProtocolItems.V4) {
          return false
        }
        return p !== ProtocolItems.UNISWAPX_V2
      }).length === 1

    const toggleProtocol = useCallback(
      (protocol: FrontendSupportedProtocol) => {
        if (selectedProtocols.includes(protocol)) {
          updateTransactionSettings({ selectedProtocols: selectedProtocols.filter((p) => p !== protocol) })
        } else {
          updateTransactionSettings({ selectedProtocols: [...selectedProtocols, protocol] })
        }
      },
      [updateTransactionSettings, selectedProtocols],
    )

    const toggleDefault = useCallback(() => {
      setIsDefault(!isDefault)
      if (!isDefault) {
        updateTransactionSettings({ selectedProtocols: DEFAULT_PROTOCOL_OPTIONS })
      }
    }, [updateTransactionSettings, isDefault])

    return (
      <Flex gap="$spacing16" my="$spacing16">
        <OptionRow
          active={isDefault}
          description={<DefaultOptionDescription isDefault={isDefault} v4SwapEnabled={v4SwapEnabled} />}
          elementName={ElementName.SwapRoutingPreferenceDefault}
          title={<DefaultOptionTitle v4SwapEnabled={v4SwapEnabled} />}
          cantDisable={false}
          onSelect={toggleDefault}
        />
        {!isDefault && (
          <>
            {uniswapXEnabledFlag && (
              <OptionRow
                active={uniswapXEnabled && selectedProtocols.includes(ProtocolItems.UNISWAPX_V2)}
                elementName={ElementName.SwapRoutingPreferenceUniswapX}
                title={getProtocolTitle(ProtocolItems.UNISWAPX_V2, t)}
                cantDisable={onlyOneProtocolSelected}
                disabled={!uniswapXEnabled}
                description={!uniswapXEnabled ? restrictionDescription : undefined}
                onSelect={() => toggleProtocol(ProtocolItems.UNISWAPX_V2)}
              />
            )}
            {v4EnabledFlag && (
              <OptionRow
                active={v4SwapEnabled && selectedProtocols.includes(ProtocolItems.V4)}
                elementName={ElementName.SwapRoutingPreferenceV4}
                title={getProtocolTitle(ProtocolItems.V4, t)}
                cantDisable={onlyOneClassicProtocolSelected}
                disabled={!v4SwapEnabled}
                description={!v4SwapEnabled ? restrictionDescription : undefined}
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
            <Text
              alignItems="center"
              color="$neutral2"
              variant="body3"
              flexDirection="row"
              flexShrink={0}
              display="inline-flex"
              gap="$gap4"
            >
              <Trans
                components={{
                  icon: <UniswapX size="$icon.16" />,
                  gradient: <UniswapXText height={18} variant="body3" />,
                  info: <InfoCircleFilled color="$neutral3" size="$icon.16" />,
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
  disabled,
}: {
  title: JSX.Element | string
  active: boolean
  elementName: ElementNameType
  cantDisable: boolean
  onSelect: () => void
  description?: ReactNode
  disabled?: boolean
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
        <Switch
          disabled={(active && cantDisable) || disabled}
          checked={active}
          variant="branded"
          onCheckedChange={onSelect}
        />
      </Trace>
    </Flex>
  )
}

function DefaultOptionDescription({
  isDefault,
  v4SwapEnabled,
}: {
  isDefault: boolean
  v4SwapEnabled: boolean
}): JSX.Element {
  const uniswapXEnabled = useFeatureFlag(FeatureFlags.UniswapX)
  const { t } = useTranslation()

  const showIncludesUniswapX = uniswapXEnabled && isDefault

  const cheapestRouteText = t('swap.settings.routingPreference.option.default.description.preV4')
  const cheapestRouteTextV4 = t('swap.settings.routingPreference.option.default.description')

  return (
    <Flex gap="$spacing4">
      <Text color="$neutral2" variant="body3" textWrap="pretty">
        {v4SwapEnabled ? cheapestRouteTextV4 : cheapestRouteText}
      </Text>
      {showIncludesUniswapX && (
        <UniswapXInfo
          tooltipTrigger={
            <Text
              alignItems="center"
              color="$neutral2"
              variant="body3"
              flexDirection="row"
              gap="$gap4"
              display="inline-flex"
            >
              <Trans
                components={{
                  icon: <UniswapX size="$icon.16" />,
                  gradient: <UniswapXText height={18} variant="body3" />,
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

function DefaultOptionTitle({ v4SwapEnabled }: { v4SwapEnabled: boolean }): JSX.Element {
  const { t } = useTranslation()

  if (!v4SwapEnabled) {
    return (
      <Text color="$neutral1" variant="subheading2">
        {t('common.default')}
      </Text>
    )
  }

  return (
    <Flex row gap="$spacing4" alignItems="center">
      <Text color="$neutral1" variant="subheading2">
        {t('common.default')}
      </Text>
      <WarningInfo
        modalProps={{
          caption: t('swap.settings.routingPreference.option.default.tooltip'),
          rejectText: t('common.button.close'),
          modalName: ModalName.SwapSettingsDefaultRoutingInfo,
        }}
        tooltipProps={{
          text: t('swap.settings.routingPreference.option.default.tooltip'),
          placement: 'bottom',
        }}
      />
    </Flex>
  )
}
