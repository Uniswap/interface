import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Dropdown, InternalMenuItem } from 'components/Dropdowns/Dropdown'
import { getProtocolVersionLabel } from 'components/Liquidity/utils/protocolVersion'
import { atom, useAtom } from 'jotai'
import { useCallback, useMemo, useState } from 'react'
import { Check } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia, useSporeColors } from 'ui/src'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'

export const exploreProtocolVersionFilterAtom = atom(ProtocolVersion.UNSPECIFIED)
const PROTOCOL_VERSIONS = [ProtocolVersion.UNSPECIFIED, ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2]

function ProtocolFilter() {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const [open, setOpen] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useAtom(exploreProtocolVersionFilterAtom)
  const media = useMedia()

  const onVersionChange = useCallback(
    (protocol: ProtocolVersion) => {
      setSelectedProtocol(protocol)
      setOpen(false)
    },
    [setSelectedProtocol],
  )

  const versionFilterOptions = useMemo(() => {
    return PROTOCOL_VERSIONS.map((option) => (
      <InternalMenuItem key={`ExplorePools-version-${option}`} onPress={() => onVersionChange(option)}>
        {option === ProtocolVersion.UNSPECIFIED ? t('common.all') : getProtocolVersionLabel(option)}
        {selectedProtocol === option && <Check size={16} color={colors.accent1.val} />}
      </InternalMenuItem>
    ))
  }, [selectedProtocol, onVersionChange, colors, t])

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
        >
          {versionFilterOptions}
        </Dropdown>
      </Trace>
    </Flex>
  )
}

export default ProtocolFilter
