import { SharedEventName } from '@uniswap/analytics-events'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { UniverseChainId, Platform } from '@universe/chains'
import { Flex, Text } from '@universe/mycelium'
import { LabeledCheckboxCompat as LabeledCheckbox } from '@universe/mycelium/checkbox-compat'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Separator, Switch } from 'ui/src'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter/NetworkFilter'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { Dropdown } from '~/components/Dropdowns/Dropdown'
import {
  LP_POSITION_PROTOCOL_VERSIONS,
  V2_POSITION_STATUS_OPTIONS,
  type V2PositionStatusFilter,
} from '~/features/Liquidity/constants'
import { getProtocolVersionLabel } from '~/features/Liquidity/utils/protocolVersion'

function filterContainerStyle({
  fullWidth,
  fitContent,
}: {
  fullWidth?: boolean
  fitContent?: boolean
}): React.CSSProperties | undefined {
  if (fullWidth) {
    return { flex: 1 }
  }
  return fitContent ? { width: 'fit-content' } : undefined
}

export const POSITION_FILTER_BUTTON_STYLE = {
  borderRadius: '$rounded12',
  py: '$padding8',
  px: '$padding12',
  borderWidth: '$spacing1',
  borderColor: '$surface3',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  hoverStyle: {
    backgroundColor: '$surface2',
  },
} as const

export function ProtocolFilterDropdown({
  selectedVersions,
  onToggleVersion,
  fullWidth,
  fitContent,
  alignRight,
}: {
  selectedVersions: ProtocolVersion[]
  onToggleVersion: (version: ProtocolVersion) => void
  fullWidth?: boolean
  fitContent?: boolean
  alignRight?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dropdown
      isOpen={isOpen}
      toggleOpen={setIsOpen}
      menuLabel={<Text variant="buttonLabel3">{t('common.protocol')}</Text>}
      dropdownStyle={{ width: 160 }}
      containerStyle={filterContainerStyle({ fullWidth, fitContent })}
      alignRight={alignRight}
      adaptToSheet
      buttonStyle={{ ...POSITION_FILTER_BUTTON_STYLE, width: fullWidth ? '100%' : undefined }}
    >
      {LP_POSITION_PROTOCOL_VERSIONS.map((version) => (
        <LabeledCheckbox
          key={`ProtocolFilter-${version}`}
          py="$spacing4"
          hoverStyle={{ opacity: 0.8, backgroundColor: 'unset' }}
          checkboxPosition="end"
          checked={selectedVersions.includes(version)}
          text={getProtocolVersionLabel(version)}
          onCheckPressed={() => onToggleVersion(version)}
        />
      ))}
    </Dropdown>
  )
}

export function StatusFilterDropdown({
  selectedStatuses,
  onToggleStatus,
  showHiddenPositions,
  setShowHiddenPositions,
  fullWidth,
  fitContent,
  alignRight,
}: {
  selectedStatuses: V2PositionStatusFilter[]
  onToggleStatus: (status: V2PositionStatusFilter) => void
  showHiddenPositions: boolean
  setShowHiddenPositions: (show: boolean) => void
  fullWidth?: boolean
  fitContent?: boolean
  alignRight?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const trace = useTrace()
  const [isOpen, setIsOpen] = useState(false)

  const onHiddenToggle = (checked: boolean): void => {
    sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
      element: ElementName.PositionsHiddenToggle,
      enabled: checked,
      ...trace,
    })
    setShowHiddenPositions(checked)
  }

  return (
    <Dropdown
      isOpen={isOpen}
      toggleOpen={setIsOpen}
      menuLabel={<Text variant="buttonLabel3">{t('common.status')}</Text>}
      dropdownStyle={{ width: 160 }}
      containerStyle={filterContainerStyle({ fullWidth, fitContent })}
      alignRight={alignRight}
      adaptToSheet
      buttonStyle={{ ...POSITION_FILTER_BUTTON_STYLE, width: fullWidth ? '100%' : undefined }}
    >
      <>
        {V2_POSITION_STATUS_OPTIONS.map((status) => (
          <LabeledCheckbox
            key={`StatusFilter-${status}`}
            py="$spacing4"
            hoverStyle={{ opacity: 0.8, backgroundColor: 'unset' }}
            checkboxPosition="end"
            checked={selectedStatuses.includes(status)}
            // Literal t() calls (not a dynamic key lookup) so i18n:extract registers these strings.
            text={status === 'open' ? t('common.open') : t('common.closed')}
            onCheckPressed={() => onToggleStatus(status)}
          />
        ))}
        {/* Hidden is a visibility view, not a lifecycle status, so it lives below a separator as a
            toggle rather than a checkbox — on swaps the table to the hidden-only set. */}
        <Separator my="$spacing8" />
        <Flex row alignItems="center" justifyContent="space-between" px="$spacing4" py="$spacing4">
          <Text $short={{ variant: 'buttonLabel4' }} variant="subheading2">
            {t('common.hidden')}
          </Text>
          <Switch variant="branded" checked={showHiddenPositions} onCheckedChange={onHiddenToggle} />
        </Flex>
      </>
    </Dropdown>
  )
}

export function PositionsNetworkFilter({
  selectedChain,
  onChainChange,
  alignRight,
}: {
  selectedChain: UniverseChainId | null
  onChainChange: (chain: UniverseChainId | null) => void
  alignRight?: boolean
}): JSX.Element {
  const { chains } = useEnabledChains({ platform: Platform.EVM })

  return (
    <NetworkFilter
      trigger={{ variant: 'icon', outlined: true }}
      includeAllNetworks
      // Positions are EVM-only, so the chains are a subset; the row should still read "All networks".
      forceAllNetworksLabel
      placement={alignRight ? 'bottom-end' : 'bottom-start'}
      selectedChain={selectedChain}
      chainIds={chains}
      onPressChain={onChainChange}
    />
  )
}
