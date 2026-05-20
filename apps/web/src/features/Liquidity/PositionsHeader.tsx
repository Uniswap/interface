import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button, Flex, LabeledCheckbox, Text, useMedia } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { StatusIndicatorCircle } from 'ui/src/components/icons/StatusIndicatorCircle'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { Dropdown } from '~/components/Dropdowns/Dropdown'
import { lpStatusConfig } from '~/features/Liquidity/constants'
import { getProtocolStatusLabel, getProtocolVersionLabel } from '~/features/Liquidity/utils/protocolVersion'
import { ClickableTamaguiStyle } from '~/theme/components/styles'

const StyledDropdownButton = {
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

const PROTOCOL_VERSIONS = [ProtocolVersion.V4, ProtocolVersion.V3, ProtocolVersion.V2]

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
  const { chains } = useEnabledChains({ platform: Platform.EVM })
  const navigate = useNavigate()
  const media = useMedia()
  const isAddLiquidityRevamp = useFeatureFlag(FeatureFlags.AddLiquidityRevamp)

  const statusFilterOptions = useMemo(() => {
    return [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE, PositionStatus.CLOSED].map((status) => {
      const config = lpStatusConfig[status]

      if (!config) {
        return <></>
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
    return PROTOCOL_VERSIONS.map((version) => (
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
  }, [selectedVersions, onVersionChange])

  const createOptions = useMemo(
    () =>
      PROTOCOL_VERSIONS.map((version) => {
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
            <Text variant="body2">{t('position.new.protocol', { protocol: protocolVersionLabel })}</Text>
          </Flex>
        )
      }),
    [navigate, t],
  )

  const [createDropdownOpen, setCreateDropdownOpen] = useState(false)
  const [protocolDropdownOpen, setProtocolDropdownOpen] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)

  return (
    <Flex gap="$gap16">
      <Text variant="heading3">{t('pool.positions.title')}</Text>
      <Flex
        gap="$gap8"
        row
        alignItems="center"
        justifyContent="space-between"
        $sm={{ flexDirection: 'column', alignItems: 'stretch' }}
      >
        {showFilters && (
          <>
            {isAddLiquidityRevamp ? (
              <Button
                variant="default"
                size="small"
                icon={<Plus />}
                onPress={() => {
                  navigate('/positions/add')
                }}
              >
                {t('position.new')}
              </Button>
            ) : (
              <Flex row alignItems="center" $sm={{ width: '100%' }}>
                <Flex
                  row
                  alignItems="center"
                  gap="$gap8"
                  pl="$padding12"
                  pr="$padding16"
                  py="$padding8"
                  backgroundColor="$neutral1"
                  borderTopLeftRadius="$rounded12"
                  borderBottomLeftRadius="$rounded12"
                  flexGrow={1}
                  $sm={{ justifyContent: 'center' }}
                  {...ClickableTamaguiStyle}
                  onPress={() => {
                    navigate('/positions/create/v4')
                  }}
                >
                  <Plus size={20} color="$surface1" />
                  <Text color="$surface1" variant="buttonLabel3">
                    {t('common.new')}
                  </Text>
                </Flex>
                <Flex alignSelf="stretch" width="$spacing1" backgroundColor="$surface1" />
                <Dropdown
                  containerStyle={{ width: 'auto' }}
                  isTriggerStyled={false}
                  menuLabel={
                    <Flex
                      centered
                      pl="$padding8"
                      pr="$padding12"
                      py="$padding8"
                      backgroundColor="$neutral1"
                      borderTopRightRadius="$rounded12"
                      borderBottomRightRadius="$rounded12"
                      {...ClickableTamaguiStyle}
                    >
                      <RotatableChevron direction="down" size="$icon.20" color="$surface1" />
                    </Flex>
                  }
                  buttonStyle={{
                    p: 0,
                  }}
                  dropdownStyle={{ width: 160 }}
                  hideChevron={true}
                  isOpen={createDropdownOpen}
                  toggleOpen={() => {
                    setCreateDropdownOpen((prev) => !prev)
                  }}
                  alignRight={media.sm}
                >
                  {createOptions}
                </Dropdown>
              </Flex>
            )}
            <Flex row alignItems="center" shrink height="100%" gap="$gap4">
              <Dropdown
                isOpen={protocolDropdownOpen}
                toggleOpen={() => {
                  setProtocolDropdownOpen((prev) => !prev)
                }}
                menuLabel={<Text variant="buttonLabel3">{t('common.status')}</Text>}
                dropdownStyle={{ width: 240 }}
                buttonStyle={StyledDropdownButton}
                alignRight={false}
              >
                {statusFilterOptions}
              </Dropdown>
              <Dropdown
                isOpen={statusDropdownOpen}
                toggleOpen={() => setStatusDropdownOpen((prev) => !prev)}
                menuLabel={<Text variant="buttonLabel3">{t('common.protocol')}</Text>}
                dropdownStyle={{ width: 160 }}
                buttonStyle={StyledDropdownButton}
              >
                {versionFilterOptions}
              </Dropdown>
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
                  onPressChain={onChainChange}
                  chainIds={chains}
                  styles={{
                    buttonPaddingY: '$spacing8',
                  }}
                />
              </Flex>
            </Flex>
          </>
        )}
      </Flex>
    </Flex>
  )
}
