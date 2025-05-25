import { TFunction } from 'i18next'
import { ReactNode, useCallback, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Flex, Switch, Text, TouchableArea, UniswapXText, isWeb, useSporeColors, type FlexProps } from 'ui/src'
import { InfoCircleFilled } from 'ui/src/components/icons/InfoCircleFilled'
import { Lightning } from 'ui/src/components/icons/Lightning'
import { UniswapX } from 'ui/src/components/icons/UniswapX'
import { spacing, zIndexes } from 'ui/src/theme'
import { WarningInfo } from 'uniswap/src/components/modals/WarningModal/WarningInfo'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { LearnMoreLink } from 'uniswap/src/components/text/LearnMoreLink'
import { InfoTooltip } from 'uniswap/src/components/tooltip/InfoTooltip'
import WarningIcon from 'uniswap/src/components/warnings/WarningIcon'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useUniswapContextSelector } from 'uniswap/src/contexts/UniswapContext'
import { ProtocolItems } from 'uniswap/src/data/tradingApi/__generated__'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ElementName, ElementNameType, ModalName } from 'uniswap/src/features/telemetry/constants'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/components/settings/contexts/TransactionSettingsContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapFormSettingsContext } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/SwapFormSettings'
import { UniswapXInfo } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/UniswapXInfo'
import { V4HooksInfo } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/V4HooksInfo'
import { isDefaultTradeRouteOptions } from 'uniswap/src/features/transactions/swap/form/header/SwapFormSettings/settingsConfigurations/TradeRoutingPreference/isDefaultTradeRouteOptions'
import { useV4SwapEnabled } from 'uniswap/src/features/transactions/swap/hooks/useV4SwapEnabled'
import {
  DEFAULT_PROTOCOL_OPTIONS,
  FrontendSupportedProtocol,
} from 'uniswap/src/features/transactions/swap/utils/protocols'
import { openUri } from 'uniswap/src/utils/linking'
import { isExtension, isInterface } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

export function TradeRoutingPreferenceScreen(): JSX.Element {
  const { t } = useTranslation()
  const getIsUniswapXSupported = useUniswapContextSelector((state) => state.getIsUniswapXSupported)
  const { selectedProtocols, isV4HookPoolsEnabled, updateTransactionSettings } = useTransactionSettingsContext()
  const isV4HooksToggleFFEnabled = useFeatureFlag(FeatureFlags.SwapSettingsV4HooksToggle)
  const [isDefault, setIsDefault] = useState(
    isDefaultTradeRouteOptions(selectedProtocols, isV4HookPoolsEnabled, isV4HooksToggleFFEnabled),
  )
  const uniswapXEnabledFlag = useFeatureFlag(FeatureFlags.UniswapX)

  const { chainId } = useSwapFormContext().derivedSwapInfo
  const isUniswapXSupported = getIsUniswapXSupported?.(chainId)
  const uniswapXEnabled = uniswapXEnabledFlag && chainId !== UniverseChainId.MonadTestnet
  const v4SwapEnabled = useV4SwapEnabled(chainId)
  const chainName = getChainInfo(chainId).name
  const restrictionDescription = t('swap.settings.protection.subtitle.unavailable', { chainName })

  // We prevent the user from deselecting all options
  const onlyOneProtocolSelected = selectedProtocols.length === 1 && !isV4HookPoolsEnabled

  const classicProtocolsCount = selectedProtocols.filter((p) => {
    if (!v4SwapEnabled && p === ProtocolItems.V4) {
      return false
    }

    return p !== ProtocolItems.UNISWAPX_V2
  }).length

  // Prevent the user from deselecting all on-chain protocols (AKA only selecting UniswapX)
  const onlyOneClassicProtocolSelected =
    (classicProtocolsCount === 1 && !isV4HookPoolsEnabled) || (classicProtocolsCount === 0 && isV4HookPoolsEnabled)

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

  const toggleV4Hooks = useCallback(() => {
    updateTransactionSettings({ isV4HookPoolsEnabled: !isV4HookPoolsEnabled })
  }, [updateTransactionSettings, isV4HookPoolsEnabled])

  const toggleDefault = useCallback(() => {
    setIsDefault(!isDefault)
    if (!isDefault) {
      updateTransactionSettings({ selectedProtocols: DEFAULT_PROTOCOL_OPTIONS, isV4HookPoolsEnabled: true })
    }
  }, [updateTransactionSettings, isDefault])

  const getProtocolTitle = createGetProtocolTitle({
    isUniswapXSupported,
    t,
  })

  return (
    <Flex gap="$spacing16" my="$spacing16">
      <OptionRow
        alignItems="flex-start"
        active={isDefault}
        description={<DefaultOptionDescription v4SwapEnabled={v4SwapEnabled} />}
        elementName={ElementName.SwapRoutingPreferenceDefault}
        title={<DefaultOptionTitle v4SwapEnabled={v4SwapEnabled} />}
        cantDisable={false}
        footerContent={
          <DefaultOptionFooterContent
            isUniswapXSupported={isUniswapXSupported}
            isUniswapXEnabled={uniswapXEnabled}
            isDefault={isDefault}
          />
        }
        onSelect={toggleDefault}
      />
      {!isDefault && (
        <>
          {uniswapXEnabledFlag && (
            <OptionRow
              active={
                isUniswapXSupported === false
                  ? false
                  : uniswapXEnabled && selectedProtocols.includes(ProtocolItems.UNISWAPX_V2)
              }
              elementName={ElementName.SwapRoutingPreferenceUniswapX}
              title={getProtocolTitle(ProtocolItems.UNISWAPX_V2)}
              cantDisable={onlyOneProtocolSelected}
              disabled={isUniswapXSupported === false || !uniswapXEnabled}
              description={!uniswapXEnabled ? restrictionDescription : undefined}
              onSelect={() => toggleProtocol(ProtocolItems.UNISWAPX_V2)}
            />
          )}
          <OptionRow
            active={v4SwapEnabled && selectedProtocols.includes(ProtocolItems.V4)}
            elementName={ElementName.SwapRoutingPreferenceV4}
            title={getProtocolTitle(ProtocolItems.V4)}
            cantDisable={onlyOneClassicProtocolSelected}
            disabled={!v4SwapEnabled}
            description={!v4SwapEnabled ? restrictionDescription : undefined}
            onSelect={() => toggleProtocol(ProtocolItems.V4)}
          />
          {isV4HooksToggleFFEnabled && (
            <OptionRow
              active={isV4HookPoolsEnabled}
              elementName={ElementName.SwapRoutingPreferenceV4Hooks}
              title={<V4HooksInfo />}
              cantDisable={onlyOneClassicProtocolSelected}
              disabled={!v4SwapEnabled}
              onSelect={toggleV4Hooks}
            />
          )}
          <OptionRow
            active={selectedProtocols.includes(ProtocolItems.V3)}
            elementName={ElementName.SwapRoutingPreferenceV3}
            title={getProtocolTitle(ProtocolItems.V3)}
            cantDisable={onlyOneClassicProtocolSelected}
            onSelect={() => toggleProtocol(ProtocolItems.V3)}
          />
          <OptionRow
            active={selectedProtocols.includes(ProtocolItems.V2)}
            elementName={ElementName.SwapRoutingPreferenceV3}
            title={getProtocolTitle(ProtocolItems.V2)}
            cantDisable={onlyOneClassicProtocolSelected}
            onSelect={() => toggleProtocol(ProtocolItems.V2)}
          />
        </>
      )}
    </Flex>
  )
}

function createGetProtocolTitle(ctx: {
  isUniswapXSupported?: boolean
  t: TFunction
}): (preference: FrontendSupportedProtocol) => JSX.Element | string {
  const { isUniswapXSupported, t } = ctx
  return (preference: FrontendSupportedProtocol) => {
    switch (preference) {
      case ProtocolItems.UNISWAPX_V2: {
        if (isUniswapXSupported === false) {
          return <UniswapXTitleInfoTooltip />
        }
        return <UniswapXInfo tooltipTrigger={<UniswapXInfoTooltipTrigger />} />
      }
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
}

function UniswapXTitleInfoTooltip(): JSX.Element {
  const [forceCloseTooltip, setForceCloseTooltip] = useState(undefined as undefined | true)
  const [showModal, setShowModal] = useState(false)
  if (isWeb) {
    return (
      <InfoTooltip
        text={<UniswapXInfoTooltipText onPress={() => setForceCloseTooltip(true)} />}
        trigger={<UniswapXInfoTooltipTrigger />}
        placement="top"
        open={forceCloseTooltip === undefined ? undefined : !forceCloseTooltip}
      />
    )
  }

  return (
    <>
      <TouchableArea onPress={() => setShowModal(true)}>
        <UniswapXInfoTooltipTrigger />
      </TouchableArea>
      <UniswapXInfoModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}

function UniswapXInfoTooltipTrigger(): JSX.Element {
  return (
    <Text
      alignItems="center"
      color="$neutral2"
      variant="subheading2"
      flexDirection="row"
      flexShrink={0}
      display="inline-flex"
      gap="$gap4"
      // This is to offset the left padding built-into the UniswapX icon
      left={-spacing.spacing2}
    >
      <Trans
        components={{
          icon: <UniswapX size="$icon.16" />,
          gradient: <UniswapXText height={18} variant="subheading2" />,
          info: <InfoCircleFilled color="$neutral3" size="$icon.16" />,
        }}
        i18nKey="uniswapx.item"
      />
    </Text>
  )
}
type OptionRowProps = {
  title: JSX.Element | string
  active: boolean
  elementName: ElementNameType
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

function DefaultOptionDescription({ v4SwapEnabled }: { v4SwapEnabled: boolean }): JSX.Element {
  const { t } = useTranslation()
  const cheapestRouteText = t('swap.settings.routingPreference.option.default.description.preV4')
  const cheapestRouteTextV4 = t('swap.settings.routingPreference.option.default.description')

  return (
    <Text color="$neutral2" variant="body3" textWrap="pretty">
      {v4SwapEnabled ? cheapestRouteTextV4 : cheapestRouteText}
    </Text>
  )
}

function DefaultOptionFooterContent(props: {
  isUniswapXSupported?: boolean
  isUniswapXEnabled: boolean
  isDefault: boolean
}): JSX.Element | null {
  const { isUniswapXSupported, isUniswapXEnabled, isDefault } = props
  const showIncludesUniswapX = isUniswapXEnabled && isUniswapXSupported && isDefault
  const showUniswapXNotSupported = isUniswapXSupported === false && isUniswapXEnabled && isDefault

  if (showIncludesUniswapX) {
    return (
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
    )
  }

  if (showUniswapXNotSupported) {
    return <UniswapXNotSupportedDescription />
  }

  return null
}

const UniswapXNotSupportedDescription = (): JSX.Element => {
  const { t } = useTranslation()
  const [forceCloseTooltip, setForceCloseTooltip] = useState(undefined as undefined | true)
  const [showModal, setShowModal] = useState(false)

  const trigger = (
    <Flex cursor="default" gap="$spacing4" alignItems="flex-start" flexDirection="row">
      <WarningIcon color="$neutral2" size="$icon.16" />
      <Text color="$neutral2" variant="body3">
        {t('swap.settings.routingPreference.option.default.description.uniswapXUnavailable')}
      </Text>
    </Flex>
  )

  if (isWeb) {
    return (
      <InfoTooltip
        open={forceCloseTooltip === undefined ? undefined : !forceCloseTooltip}
        text={
          <UniswapXInfoTooltipText
            onPress={() => {
              setForceCloseTooltip(true)
            }}
          />
        }
        placement="top"
        trigger={trigger}
      />
    )
  }

  return (
    <>
      <TouchableArea onPress={() => setShowModal(true)}>{trigger}</TouchableArea>
      <UniswapXInfoModal isOpen={showModal} onClose={() => setShowModal(false)} />
    </>
  )
}

function UniswapXInfoTooltipText(props?: { onPress?: () => void }): JSX.Element {
  const { t } = useTranslation()
  const handleOnPressUniswapXUnsupported = useUniswapContextSelector((state) => state.handleOnPressUniswapXUnsupported)
  const { handleHideTransactionSettingsModal } = useSwapFormSettingsContext()

  const onPress = useEvent(() => {
    if (isExtension) {
      openUri(uniswapUrls.helpArticleUrls.multichainDelegation).catch(() => {})
    } else {
      handleOnPressUniswapXUnsupported?.()
      handleHideTransactionSettingsModal()
    }
    props?.onPress?.()
  })

  const body = isExtension ? t('uniswapx.description.unsupported') : t('wallet.mismatch.popup.description')

  return (
    <TouchableArea onPress={onPress}>
      <Flex gap="$spacing4">
        <Text color="$neutral2" variant="body3">
          {body}
        </Text>
        <Text color="$accent1" variant="body3">
          {isInterface ? t('common.button.viewDetails') : t('common.button.learn')}
        </Text>
      </Flex>
    </TouchableArea>
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

function UniswapXInfoModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }): JSX.Element {
  const { t } = useTranslation()
  const colors = useSporeColors()
  return (
    <WarningModal
      isOpen={isOpen}
      onClose={onClose}
      {...{
        caption: t('uniswapx.description.unsupported'),
        rejectText: t('common.button.close'),
        icon: <Lightning size="$icon.24" fill={colors.neutral1.val} />,
        modalName: ModalName.UniswapXInfo,
        severity: WarningSeverity.None,
        title: t('uniswapx.unavailable.title'),
        zIndex: zIndexes.popover,
      }}
    >
      <LearnMoreLink
        textVariant={isWeb ? 'body4' : 'buttonLabel3'}
        url={uniswapUrls.helpArticleUrls.multichainDelegation}
      />
    </WarningModal>
  )
}
