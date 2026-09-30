import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Flex, Text } from '@universe/mycelium'
import { Check } from '@universe/mycelium/icons/Check'
import { useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InterfaceEventName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import type { ExploreTableSurface } from 'uniswap/src/features/telemetry/types'
import { Dropdown, InternalMenuItem } from '~/components/Dropdowns/Dropdown'
import {
  useExploreTablesFilterStore,
  useExploreTablesFilterStoreActions,
} from '~/features/Explore/state/exploreTablesFilterStore'
import { getProtocolVersionLabel } from '~/features/Liquidity/utils/protocolVersion'

const PROTOCOL_VERSIONS = [ProtocolVersion.UNSPECIFIED, ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2]

/**
 * Protocol version dropdown. The caller owns the selected value, so each surface can keep it wherever
 * the rest of its filters live (Explore's store, the add-liquidity browser's URL params).
 */
export function ProtocolFilter({
  selectedProtocol,
  onSelectProtocol,
  /** Attached to the filter analytics so the Explore and add-liquidity tables aren't conflated. */
  surface = 'explore',
}: {
  selectedProtocol: ProtocolVersion
  onSelectProtocol: (protocol: ProtocolVersion) => void
  surface?: ExploreTableSurface
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const media = useMedia()

  const onVersionChange = useCallback(
    (protocol: ProtocolVersion) => {
      onSelectProtocol(protocol)
      sendAnalyticsEvent(InterfaceEventName.ExploreTableFilterSelected, {
        filter_type: 'protocol',
        filter_value: getProtocolVersionLabel(protocol) ?? 'all',
        surface,
      })
      setOpen(false)
    },
    [onSelectProtocol, surface],
  )

  const versionFilterOptions = useMemo(() => {
    return PROTOCOL_VERSIONS.map((option) => (
      <InternalMenuItem key={`ExplorePools-version-${option}`} onPress={() => onVersionChange(option)}>
        {option === ProtocolVersion.UNSPECIFIED ? t('common.all') : getProtocolVersionLabel(option)}
        {selectedProtocol === option && <Check size="$icon.16" color="$accent1" />}
      </InternalMenuItem>
    ))
  }, [selectedProtocol, onVersionChange, t])

  return (
    <Flex>
      <Trace modal={ModalName.ExploreProtocolFilter}>
        <Dropdown
          isOpen={open}
          toggleOpen={() => setOpen((prev) => !prev)}
          menuLabel={
            <Text variant="buttonLabel3" width="max-content">
              {selectedProtocol === ProtocolVersion.UNSPECIFIED
                ? t('common.protocol')
                : getProtocolVersionLabel(selectedProtocol)}
            </Text>
          }
          dropdownStyle={{ width: 160 }}
          buttonStyle={{ height: 40, width: 'max-content' }}
          allowFlip
          alignRight={!media.lg}
          // The pool browser's flag-off toolbar renders this trigger inside its overflow-x scroller,
          // which would clip an inline-absolute menu (see MoreCategoriesDropdown for the same fix).
          positionFixed
        >
          {versionFilterOptions}
        </Dropdown>
      </Trace>
    </Flex>
  )
}

/** Explore's instance, backed by the shared tables filter store its pool query reads from. */
export function ExploreProtocolFilter(): JSX.Element {
  const selectedProtocol = useExploreTablesFilterStore((s) => s.selectedProtocol)
  const { setSelectedProtocol } = useExploreTablesFilterStoreActions()

  return <ProtocolFilter selectedProtocol={selectedProtocol} onSelectProtocol={setSelectedProtocol} />
}
