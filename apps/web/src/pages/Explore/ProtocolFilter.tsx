import { ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { DropdownSelector, InternalMenuItem } from 'components/DropdownSelector'
import { getProtocolVersionLabel } from 'components/Liquidity/utils'
import { atom, useAtom } from 'jotai'
import { useCallback, useMemo, useState } from 'react'
import { Check } from 'react-feather'
import { useTranslation } from 'react-i18next'
import { Flex, Text, useMedia, useSporeColors } from 'ui/src'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName } from 'uniswap/src/features/telemetry/constants'

export const exploreProtocolVersionFilterAtom = atom(ProtocolVersion.UNSPECIFIED)

function ProtocolFilter() {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const isV4DataEnabled = useFeatureFlag(FeatureFlags.V4Data)
  const [open, setOpen] = useState(false)
  const [selectedProtocol, setSelectedProtocol] = useAtom(exploreProtocolVersionFilterAtom)
  const protocolVersions = useMemo(() => {
    const options = [ProtocolVersion.UNSPECIFIED, ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2]
    return isV4DataEnabled ? options : options.filter((o) => o !== ProtocolVersion.V4)
  }, [isV4DataEnabled])
  const media = useMedia()

  const onVersionChange = useCallback(
    (protocol: ProtocolVersion) => {
      setSelectedProtocol(protocol)
      setOpen(false)
    },
    [setSelectedProtocol],
  )

  const versionFilterOptions = useMemo(() => {
    return protocolVersions.map((option) => (
      <InternalMenuItem key={`ExplorePools-version-${option}`} onPress={() => onVersionChange(option)}>
        {option === ProtocolVersion.UNSPECIFIED ? t('common.all') : getProtocolVersionLabel(option)}
        {selectedProtocol === option && <Check size={16} color={colors.accent1.val} />}
      </InternalMenuItem>
    ))
  }, [protocolVersions, selectedProtocol, onVersionChange, colors, t])

  return (
    <Flex>
      <Trace modal={ModalName.ExploreProtocolFilter}>
        <DropdownSelector
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
        </DropdownSelector>
      </Trace>
    </Flex>
  )
}

export default ProtocolFilter
