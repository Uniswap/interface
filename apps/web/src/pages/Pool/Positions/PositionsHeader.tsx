// eslint-disable-next-line no-restricted-imports
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { DropdownSelector } from 'components/DropdownSelector'
import { lpStatusConfig } from 'components/Liquidity/constants'
import { getProtocolStatusLabel, getProtocolVersionLabel } from 'components/Liquidity/utils'
import { useAccount } from 'hooks/useAccount'
import { useMemo, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, LabeledCheckbox, Text } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { StatusIndicatorCircle } from 'ui/src/components/icons/StatusIndicatorCircle'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

const StyledDropdownButton = {
  borderRadius: '$rounded16',
  py: '$padding8',
  px: '$padding12',
  backgroundColor: '$surface3',
  borderWidth: 0,
  hoverStyle: {
    ...ClickableTamaguiStyle.hoverStyle,
    backgroundColor: 'none',
  },
}

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

  const statusFilterOptions = useMemo(() => {
    return [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE, PositionStatus.CLOSED].map((status) => {
      const config = lpStatusConfig[status]

      if (!config) {
        return null
      }

      return (
        <Flex
          key={`PositionsHeader-status-${status}`}
          row
          gap="$spacing8"
          width="100%"
          justifyContent="space-between"
          alignItems="center"
        >
          <StatusIndicatorCircle color={config.color} />
          <LabeledCheckbox
            py="$spacing4"
            size="$icon.18"
            hoverStyle={{ opacity: 0.8, backgroundColor: 'unset' }}
            containerStyle={{ flex: 1 }}
            checkboxPosition="end"
            checked={selectedStatus?.includes(status) ?? false}
            text={getProtocolStatusLabel(status, t)}
            onCheckPressed={() => onStatusChange(status)}
          />
        </Flex>
      )
    })
  }, [selectedStatus, onStatusChange, t])

  const versionFilterOptions = useMemo(() => {
    return protocolVersions.map((version) => (
      <LabeledCheckbox
        key={`PositionsHeader-version-${version}`}
        py="$spacing4"
        hoverStyle={{ opacity: 0.8, backgroundColor: 'unset' }}
        checkboxPosition="end"
        checked={selectedVersions?.includes(version) ?? false}
        text={getProtocolVersionLabel(version)}
        onCheckPressed={() => onVersionChange(version)}
      />
    ))
  }, [protocolVersions, selectedVersions, onVersionChange])

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
  const [protocolDropdownOpen, setProtocolDropdownOpen] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)

  return (
    <Flex gap={16}>
      <Text variant="heading3">{t('pool.positions.title')}</Text>
      {isConnected && (
        <Flex gap="$gap8" row $sm={{ flexDirection: 'column' }}>
          <Flex gap="$spacing1" row>
            <Flex
              row
              gap="$gap8"
              px="$padding16"
              backgroundColor="$neutral1"
              borderTopLeftRadius="$rounded16"
              borderBottomLeftRadius="$rounded16"
              alignItems="center"
              $sm={{ justifyContent: 'center' }}
              justifyContent="flex-start"
              flex={1}
              {...ClickableTamaguiStyle}
              onPress={() => {
                navigate(`/positions/create/${isV4DataEnabled ? 'v4' : 'v3'}`)
              }}
            >
              <Plus size={20} color="$surface1" />
              <Text color="$surface1" variant="buttonLabel3">
                {t('common.new')}
              </Text>
            </Flex>
            <DropdownSelector
              containerStyle={{ width: 'auto' }}
              menuLabel={
                <Flex
                  borderTopRightRadius="$rounded16"
                  borderBottomRightRadius="$rounded16"
                  backgroundColor="$neutral1"
                  justifyContent="center"
                  alignItems="center"
                  p="$padding8"
                  {...ClickableTamaguiStyle}
                >
                  <RotatableChevron direction="down" height={20} width={20} color="$surface1" />
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
            <Flex row alignItems="center" shrink height="100%" gap="$gap4">
              <DropdownSelector
                isOpen={protocolDropdownOpen}
                toggleOpen={() => {
                  setProtocolDropdownOpen((prev) => !prev)
                }}
                menuLabel={<Text variant="buttonLabel3">{t('common.status')}</Text>}
                internalMenuItems={<>{statusFilterOptions}</>}
                dropdownStyle={{
                  width: 240,
                }}
                buttonStyle={StyledDropdownButton}
              />
              <DropdownSelector
                isOpen={statusDropdownOpen}
                toggleOpen={() => setStatusDropdownOpen((prev) => !prev)}
                menuLabel={<Text variant="buttonLabel3">{t('common.protocol')}</Text>}
                internalMenuItems={<>{versionFilterOptions}</>}
                dropdownStyle={{
                  width: 160,
                }}
                buttonStyle={StyledDropdownButton}
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
