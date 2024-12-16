// eslint-disable-next-line no-restricted-imports
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { DropdownSelector } from 'components/DropdownSelector'
import { getProtocolStatusLabel, getProtocolVersionLabel } from 'components/Liquidity/utils'
import { useAccount } from 'hooks/useAccount'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, LabeledCheckbox, Text } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { SortHorizontalLines } from 'ui/src/components/icons/SortHorizontalLines'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { Trans, useTranslation } from 'uniswap/src/i18n'

type PositionsHeaderProps = {
  showFilters?: boolean
  selectedChain: UniverseChainId | null
  selectedVersions?: ProtocolVersion[]
  selectedStatus?: PositionStatus[]
  onChainChange: (selectedChain: UniverseChainId | null) => void
  onVersionChange: (toggledVersion: ProtocolVersion) => void
  onStatusChange: (toggledStatus: PositionStatus) => void
}

export function PositionsHeader({
  showFilters = true,
  selectedChain,
  selectedVersions,
  selectedStatus,
  onChainChange,
  onVersionChange,
  onStatusChange,
}: PositionsHeaderProps) {
  const { t } = useTranslation()
  const { isConnected } = useAccount()
  const { chains } = useEnabledChains()
  const navigate = useNavigate()
  const isV4DataEnabled = useFeatureFlag(FeatureFlags.V4Data)

  const protocolVersions = useMemo(
    () =>
      isV4DataEnabled
        ? [ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2]
        : [ProtocolVersion.V3, ProtocolVersion.V2],
    [isV4DataEnabled],
  )

  const filterOptions = useMemo(() => {
    const statusOptions = [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE, PositionStatus.CLOSED].map(
      (status) => (
        <LabeledCheckbox
          key={`PositionsHeader-status-${status}`}
          py="$spacing4"
          hoverStyle={{ opacity: 0.8, backgroundColor: 'unset' }}
          checkboxPosition="end"
          checked={selectedStatus?.includes(status) ?? false}
          text={getProtocolStatusLabel(status, t)}
          onCheckPressed={() => {
            onStatusChange(status)
          }}
        />
      ),
    )
    const versionOptions = protocolVersions.map((version) => (
      <LabeledCheckbox
        key={`PositionsHeader-version-${version}`}
        py="$spacing4"
        hoverStyle={{ opacity: 0.8, backgroundColor: 'unset' }}
        checkboxPosition="end"
        checked={selectedVersions?.includes(version) ?? false}
        text={getProtocolVersionLabel(version)}
        onCheckPressed={() => {
          onVersionChange(version)
        }}
      />
    ))
    return [
      <Text key="PositionsHeader-status-section-title" variant="subheading2" color="$neutral2" px="$padding2">
        {t('common.status')}
      </Text>,
      ...statusOptions,
      <Text key="PositionsHeader-version-section-title" variant="subheading2" color="$neutral2" px="$padding2">
        {t('common.version')}
      </Text>,
      ...versionOptions,
    ]
  }, [onStatusChange, onVersionChange, selectedStatus, selectedVersions, t, protocolVersions])

  const createOptions = useMemo(
    () =>
      protocolVersions.map((version) => {
        const protocolVersionLabel = getProtocolVersionLabel(version)
        return (
          <Flex
            key={`PositionsHeader-create-${protocolVersionLabel}`}
            p="$spacing8"
            {...ClickableTamaguiStyle}
            onPress={() => {
              navigate(`/positions/create/${protocolVersionLabel}`)
            }}
          >
            <Text variant="body2">
              <Trans i18nKey="position.new.protocol" values={{ protocol: protocolVersionLabel }} />
            </Text>
          </Flex>
        )
      }),
    [navigate, protocolVersions],
  )

  const [createDropdownOpen, setCreateDropdownOpen] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)

  return (
    <Flex gap={16}>
      <Text variant="heading3">{t('pool.positions.title')}</Text>

      {isConnected && (
        <Flex row gap="$gap12">
          <Flex gap="$spacing1" row>
            <Flex
              row
              gap="$gap8"
              px="$padding16"
              backgroundColor="$surface3"
              borderTopLeftRadius="$rounded16"
              borderBottomLeftRadius="$rounded16"
              alignItems="center"
              {...ClickableTamaguiStyle}
              onPress={() => {
                navigate(`/positions/create/${isV4DataEnabled ? 'v4' : 'v3'}`)
              }}
            >
              <Plus size={20} color="$neutral1" />
              <Text variant="buttonLabel3">{t('common.new')}</Text>
            </Flex>
            <DropdownSelector
              menuLabel={
                <Flex
                  borderTopRightRadius="$rounded16"
                  borderBottomRightRadius="$rounded16"
                  backgroundColor="$surface3"
                  justifyContent="center"
                  alignItems="center"
                  px="$padding12"
                  py="$spacing8"
                  {...ClickableTamaguiStyle}
                >
                  <RotatableChevron direction="down" height={20} width={20} color="$neutral2" />
                </Flex>
              }
              buttonStyle={{
                borderWidth: 0,
                p: 0,
              }}
              dropdownStyle={{
                width: 160,
              }}
              internalMenuItems={<>{createOptions}</>}
              hideChevron={true}
              isOpen={createDropdownOpen}
              toggleOpen={() => {
                setCreateDropdownOpen((prev) => !prev)
              }}
            />
          </Flex>
          {showFilters && (
            <Flex row alignItems="center" shrink height="100%" gap="$gap8">
              <DropdownSelector
                isOpen={filterDropdownOpen}
                toggleOpen={() => {
                  setFilterDropdownOpen((prev) => !prev)
                }}
                menuLabel={
                  <Flex
                    borderRadius="$rounded16"
                    backgroundColor="$surface3"
                    justifyContent="center"
                    alignItems="center"
                    px="$padding12"
                    py="$spacing8"
                    testID="lp-version-selector"
                    {...ClickableTamaguiStyle}
                  >
                    <SortHorizontalLines size={20} color="$neutral1" />
                  </Flex>
                }
                internalMenuItems={<>{filterOptions}</>}
                hideChevron={true}
                dropdownStyle={{
                  width: 160,
                }}
                buttonStyle={{
                  borderWidth: 0,
                  p: 0,
                }}
              />
              <Flex
                alignItems="center"
                justifyContent="center"
                backgroundColor="$surface3"
                borderRadius="$rounded16"
                px="$padding12"
                height="100%"
                {...ClickableTamaguiStyle}
              >
                <NetworkFilter
                  includeAllNetworks
                  selectedChain={selectedChain}
                  onPressChain={onChainChange}
                  chainIds={chains}
                  styles={{
                    buttonPaddingY: '$spacing8',
                  }}
                />
              </Flex>
            </Flex>
          )}
        </Flex>
      )}
    </Flex>
  )
}
