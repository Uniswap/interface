// eslint-disable-next-line no-restricted-imports
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { getProtocolStatusLabel, getProtocolVersionLabel } from 'components/Liquidity/utils'
import { useAccount } from 'hooks/useAccount'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, LabeledCheckbox, Text } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { SortHorizontalLines } from 'ui/src/components/icons/SortHorizontalLines'
import { ActionSheetDropdown } from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { useEnabledChains } from 'uniswap/src/features/settings/hooks'
import { Trans, useTranslation } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'

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

  const filterOptions = useMemo(() => {
    const statusOptions = [PositionStatus.IN_RANGE, PositionStatus.OUT_OF_RANGE, PositionStatus.CLOSED].map(
      (status) => ({
        key: `PositionsHeader-status-${status}`,
        onPress: () => null,
        render: () => (
          <Flex py="$spacing4">
            <LabeledCheckbox
              checkboxPosition="end"
              checked={selectedStatus?.includes(status) ?? false}
              text={getProtocolStatusLabel(status, t)}
              onCheckPressed={() => {
                onStatusChange(status)
              }}
            />
          </Flex>
        ),
      }),
    )
    const versionOptions = [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4].map((version) => ({
      key: `PositionsHeader-version-${version}`,
      onPress: () => null,
      render: () => (
        <Flex py="$spacing4">
          <LabeledCheckbox
            checkboxPosition="end"
            checked={selectedVersions?.includes(version) ?? false}
            text={getProtocolVersionLabel(version)}
            onCheckPressed={() => {
              onVersionChange(version)
            }}
          />
        </Flex>
      ),
    }))
    return [
      {
        key: 'PositionsHeader-status-section-title',
        onPress: () => null,
        render: () => (
          <Text variant="subheading2" color="$neutral2" px="$padding2">
            {t('common.status')}
          </Text>
        ),
      },
      ...statusOptions,
      {
        key: 'PositionsHeader-version-section-title',
        onPress: () => null,
        render: () => (
          <Text variant="subheading2" color="$neutral2" px="$padding2">
            {t('common.version')}
          </Text>
        ),
      },
      ...versionOptions,
    ]
  }, [onStatusChange, onVersionChange, selectedStatus, selectedVersions, t])

  const createOptions = useMemo(
    () =>
      [ProtocolVersion.V2, ProtocolVersion.V3, ProtocolVersion.V4].map((version) => {
        const protocolVersionLabel = getProtocolVersionLabel(version)?.toLowerCase()
        return {
          key: `PositionsHeader-create-${protocolVersionLabel}`,
          onPress: () => {
            navigate(`/positions/create/${protocolVersionLabel}`)
          },
          render: () => (
            <Flex p="$spacing8">
              <Text variant="body2">
                <Trans i18nKey="position.new.protocol" values={{ protocol: protocolVersionLabel }} />
              </Text>
            </Flex>
          ),
        }
      }),
    [navigate],
  )

  return (
    <Flex gap={20}>
      <Text variant="heading2">{t('pool.positions.title')}</Text>

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
                navigate('/positions/create/v4')
              }}
            >
              <Plus size={24} color="$neutral1" />
              <Text variant="buttonLabel2">{t('common.new')}</Text>
            </Flex>
            <ActionSheetDropdown
              options={createOptions}
              showArrow={false}
              closeOnSelect={false}
              styles={{
                dropdownMinWidth: 200,
                buttonPaddingY: '$none',
              }}
            >
              <Flex
                borderTopRightRadius="$rounded16"
                borderBottomRightRadius="$rounded16"
                backgroundColor="$surface3"
                justifyContent="center"
                alignItems="center"
                px="$padding16"
                py="$spacing8"
                {...ClickableTamaguiStyle}
              >
                <RotatableChevron direction="down" height={24} width={24} color="$neutral1" />
              </Flex>
            </ActionSheetDropdown>
          </Flex>
          {showFilters && (
            <>
              <ActionSheetDropdown
                options={filterOptions}
                showArrow={false}
                closeOnSelect={false}
                testID="lp-version-selector"
                styles={{
                  buttonPaddingY: '$none',
                }}
              >
                <Flex
                  borderRadius="$rounded16"
                  backgroundColor="$surface3"
                  justifyContent="center"
                  alignItems="center"
                  px="$padding16"
                  py="$spacing8"
                  {...ClickableTamaguiStyle}
                >
                  <SortHorizontalLines size={24} color="$neutral1" />
                </Flex>
              </ActionSheetDropdown>
              <Flex
                alignItems="center"
                justifyContent="center"
                backgroundColor="$surface3"
                borderRadius="$rounded16"
                px="$padding12"
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
            </>
          )}
        </Flex>
      )}
    </Flex>
  )
}
