// eslint-disable-next-line no-restricted-imports
import { PositionStatus, ProtocolVersion } from '@uniswap/client-pools/dist/pools/v1/types_pb'
import { getProtocolStatusLabel, getProtocolVersionLabel } from 'components/Liquidity/utils'
import { useSupportedChainIds } from 'hooks/useSupportedChainIds'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClickableTamaguiStyle } from 'theme/components'
import { Flex, LabeledCheckbox, Text } from 'ui/src'
import { ExternalLink } from 'ui/src/components/icons/ExternalLink'
import { Plus } from 'ui/src/components/icons/Plus'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { SortHorizontalLines } from 'ui/src/components/icons/SortHorizontalLines'
import { ActionSheetDropdown } from 'uniswap/src/components/dropdowns/ActionSheetDropdown'
import { NetworkFilter } from 'uniswap/src/components/network/NetworkFilter'
import { useTranslation } from 'uniswap/src/i18n'
import { UniverseChainId } from 'uniswap/src/types/chains'

type PositionsHeaderProps = {
  selectedChain: UniverseChainId | null
  selectedVersions?: ProtocolVersion[]
  selectedStatus?: PositionStatus[]
  onChainChange: (selectedChain: UniverseChainId | null) => void
  onVersionChange: (toggledVersion: ProtocolVersion) => void
  onStatusChange: (toggledStatus: PositionStatus) => void
}

export function PositionsHeader({
  selectedChain,
  selectedVersions,
  selectedStatus,
  onChainChange,
  onVersionChange,
  onStatusChange,
}: PositionsHeaderProps) {
  const { t } = useTranslation()
  const { supported: supportedChains } = useSupportedChainIds()
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

  const createOptions = useMemo(() => {
    return [
      {
        key: 'PositionsHeader-create-v4',
        onPress: () => {
          navigate('/positions/create/v4')
        },
        render: () => (
          <Flex row gap="$gap4" alignItems="center">
            <Text p="$spacing4" variant="body2">
              {t('nav.tabs.createV2Position')}
            </Text>
            <ExternalLink size={16} color="$neutral1" />
          </Flex>
        ),
      },
      {
        key: 'PositionsHeader-create-v3',
        onPress: () => {
          navigate('/positions/create/v3')
        },
        render: () => (
          <Flex row gap="$gap4" alignItems="center">
            <Text p="$spacing4" variant="body2">
              {t('nav.tabs.createV3Position')}
            </Text>
            <ExternalLink size={16} color="$neutral1" />
          </Flex>
        ),
      },
      {
        key: 'PositionsHeader-create-v2',
        onPress: () => {
          navigate('/positions/create/v2')
        },
        render: () => (
          <Flex row gap="$gap4" alignItems="center">
            <Text p="$spacing4" variant="body2">
              {t('nav.tabs.createV2Position')}
            </Text>
            <ExternalLink size={16} color="$neutral1" />
          </Flex>
        ),
      },
    ]
  }, [t, navigate])

  return (
    <Flex gap={20}>
      <Text variant="heading2">{t('pool.positions.title')}</Text>
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
            my="$spacing8"
            {...ClickableTamaguiStyle}
            onPress={() => {
              navigate('/positions/create/v4')
            }}
          >
            <Plus size={24} color="$neutral1" />
            <Text variant="buttonLabel2">{t('common.new')}</Text>
          </Flex>
          <ActionSheetDropdown options={createOptions} showArrow={false} closeOnSelect={false}>
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
        <ActionSheetDropdown
          options={filterOptions}
          showArrow={false}
          closeOnSelect={false}
          testID="lp-version-selector"
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
          my="$spacing8"
          {...ClickableTamaguiStyle}
        >
          <NetworkFilter
            includeAllNetworks
            selectedChain={selectedChain}
            onPressChain={onChainChange}
            chainIds={supportedChains}
          />
        </Flex>
      </Flex>
    </Flex>
  )
}
