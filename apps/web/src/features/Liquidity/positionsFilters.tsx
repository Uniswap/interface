import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, LabeledCheckbox, Text } from 'ui/src'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { Dropdown } from '~/components/Dropdowns/Dropdown'
import { LP_POSITION_PROTOCOL_VERSIONS } from '~/features/Liquidity/constants'
import { getProtocolVersionLabel } from '~/features/Liquidity/utils/protocolVersion'

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
}: {
  selectedVersions: ProtocolVersion[]
  onToggleVersion: (version: ProtocolVersion) => void
  fullWidth?: boolean
}): JSX.Element {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dropdown
      isOpen={isOpen}
      toggleOpen={() => setIsOpen((prev) => !prev)}
      menuLabel={<Text variant="buttonLabel3">{t('common.protocol')}</Text>}
      dropdownStyle={{ width: 160 }}
      containerStyle={fullWidth ? { flex: 1 } : undefined}
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

export function PositionsNetworkFilter({
  selectedChain,
  onChainChange,
}: {
  selectedChain: UniverseChainId | null
  onChainChange: (chain: UniverseChainId | null) => void
}): JSX.Element {
  const { chains } = useEnabledChains({ platform: Platform.EVM })

  return (
    <Flex
      centered
      px="$padding12"
      borderWidth="$spacing1"
      borderColor="$surface3"
      borderRadius="$rounded12"
      hoverStyle={{ backgroundColor: '$surface2' }}
    >
      <NetworkFilter
        includeAllNetworks
        selectedChain={selectedChain}
        onPressChain={(c) => onChainChange(c ?? null)}
        chainIds={chains}
        styles={{ buttonPaddingY: '$spacing8' }}
      />
    </Flex>
  )
}
