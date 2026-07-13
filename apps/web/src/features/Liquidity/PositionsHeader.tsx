import { SharedEventName } from '@uniswap/analytics-events'
import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { Button, Flex, LabeledCheckbox, Text, useMedia } from 'ui/src'
import { Plus } from 'ui/src/components/icons/Plus'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { StatusIndicatorCircle } from 'ui/src/components/icons/StatusIndicatorCircle'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { lpStatusConfig } from 'uniswap/src/features/positions/lpStatusConfig'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { Dropdown } from '~/components/Dropdowns/Dropdown'
import { LP_POSITION_PROTOCOL_VERSIONS, LP_POSITION_STATUS_FILTER_OPTIONS } from '~/features/Liquidity/constants'
import {
  POSITION_FILTER_BUTTON_STYLE,
  PositionsNetworkFilter,
  ProtocolFilterDropdown,
} from '~/features/Liquidity/positionsFilters'
import { getProtocolStatusLabel } from '~/features/Liquidity/utils/protocolVersion'
import { ClickableTamaguiStyle } from '~/theme/components/styles'
import { buildCreatePositionHref, type CreatePositionProtocolVersion } from '~/utils/createPositionRoute'

type PositionsHeaderProps = {
  showFilters?: boolean
  showTitle?: boolean
  showNetworkFilter?: boolean
  showCreateButton?: boolean
  stackControlsAt?: 'sm' | 'md'
  selectedChain: UniverseChainId | null
  selectedVersions?: ProtocolVersion[]
  selectedStatus?: PositionStatus[]
  onChainChange: (selectedChain: UniverseChainId | null) => void
  onVersionChange: (toggledVersion: ProtocolVersion) => void
  onStatusChange: (toggledStatus: PositionStatus) => void
  createPositionEntryPoint?: string
}

function getCreatePositionProtocolVersion(version: ProtocolVersion): CreatePositionProtocolVersion | undefined {
  switch (version) {
    case ProtocolVersion.V2:
      return 'v2'
    case ProtocolVersion.V3:
      return 'v3'
    case ProtocolVersion.V4:
      return 'v4'
    default:
      return undefined
  }
}

export function PositionsHeader({
  showFilters = true,
  showTitle = true,
  showNetworkFilter = true,
  showCreateButton = true,
  stackControlsAt = 'sm',
  selectedChain,
  selectedVersions,
  selectedStatus,
  onChainChange,
  onVersionChange,
  onStatusChange,
  createPositionEntryPoint,
}: PositionsHeaderProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const trace = useTrace()
  const media = useMedia()
  const isAddLiquidityRevamp = useFeatureFlag(FeatureFlags.AddLiquidityRevamp)
  const shouldStackControlsAtMd = stackControlsAt === 'md'
  const shouldStackControls = shouldStackControlsAtMd ? media.md : media.sm
  const shouldLeftAlignCreateButton = shouldStackControls

  const getCreatePositionHref = useCallback(
    (protocolVersion: CreatePositionProtocolVersion = 'v4') =>
      buildCreatePositionHref({
        entryPoint: createPositionEntryPoint,
        isAddLiquidityRevampEnabled: isAddLiquidityRevamp,
        protocolVersion,
      }),
    [createPositionEntryPoint, isAddLiquidityRevamp],
  )

  const navigateToCreatePosition = useCallback(
    (protocolVersion?: CreatePositionProtocolVersion) => {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        element: ElementName.CreatePositionButton,
        protocol_version: protocolVersion ?? 'v4',
        ...trace,
      })
      const result = navigate(getCreatePositionHref(protocolVersion))
      if (result) {
        result.catch(() => undefined)
      }
    },
    [getCreatePositionHref, navigate, trace],
  )

  const statusFilterOptions = useMemo(() => {
    return LP_POSITION_STATUS_FILTER_OPTIONS.map((status) => {
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

  const createOptions = useMemo(
    () =>
      LP_POSITION_PROTOCOL_VERSIONS.flatMap((version) => {
        const protocolVersionLabel = getCreatePositionProtocolVersion(version)
        if (!protocolVersionLabel) {
          return []
        }

        return [
          <Flex
            key={`PositionsHeader-create-${protocolVersionLabel}`}
            p="$spacing8"
            {...ClickableTamaguiStyle}
            onPress={() => {
              navigateToCreatePosition(protocolVersionLabel)
            }}
          >
            <Text variant="body2">{t('position.new.protocol', { protocol: protocolVersionLabel })}</Text>
          </Flex>,
        ]
      }),
    [navigateToCreatePosition, t],
  )

  const [createDropdownOpen, setCreateDropdownOpen] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)

  const createPositionControl = useMemo(() => {
    if (!showCreateButton) {
      return null
    }

    if (isAddLiquidityRevamp) {
      return (
        <Button
          variant="default"
          size="small"
          icon={<Plus />}
          fill={false}
          width={shouldStackControls ? '100%' : undefined}
          height={shouldStackControls ? '$spacing36' : undefined}
          justifyContent={shouldLeftAlignCreateButton ? 'flex-start' : undefined}
          onPress={() => {
            navigateToCreatePosition()
          }}
        >
          {t('position.new')}
        </Button>
      )
    }

    return (
      <Flex row alignItems="center" width={shouldStackControls ? '100%' : undefined} $sm={{ width: '100%' }}>
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
          flexShrink={1}
          minWidth={0}
          justifyContent={shouldLeftAlignCreateButton ? 'flex-start' : undefined}
          $sm={shouldLeftAlignCreateButton ? undefined : { justifyContent: 'center' }}
          {...ClickableTamaguiStyle}
          onPress={() => {
            navigateToCreatePosition()
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
    )
  }, [
    showCreateButton,
    isAddLiquidityRevamp,
    shouldStackControls,
    shouldLeftAlignCreateButton,
    navigateToCreatePosition,
    t,
    createDropdownOpen,
    createOptions,
    media.sm,
  ])

  const launchAuctionControl = useMemo(() => {
    if (!showCreateButton) {
      return null
    }

    return (
      <Button
        variant="default"
        emphasis="secondary"
        size="small"
        icon={<Plus />}
        fill={false}
        width={shouldStackControls ? '100%' : undefined}
        height={shouldStackControls ? '$spacing36' : undefined}
        justifyContent={shouldLeftAlignCreateButton ? 'flex-start' : undefined}
        onPress={() => navigate('/liquidity/launch-auction')}
      >
        {t('toucan.createAuction.launchAuction')}
      </Button>
    )
  }, [showCreateButton, shouldStackControls, shouldLeftAlignCreateButton, navigate, t])

  if (!showTitle && !showFilters && !showCreateButton) {
    return null
  }

  return (
    <Flex gap="$gap16">
      {showTitle && <Text variant="heading3">{t('pool.positions.title')}</Text>}
      <Flex
        gap="$gap8"
        row
        alignItems="center"
        justifyContent={showTitle ? 'space-between' : 'flex-start'}
        $sm={{ flexDirection: 'column', alignItems: 'stretch' }}
        $md={
          shouldStackControlsAtMd ? { flexDirection: 'column', alignItems: 'stretch', gap: '$spacing16' } : undefined
        }
      >
        {createPositionControl}
        {launchAuctionControl}
        {showFilters && (
          <Flex
            row
            alignItems="center"
            shrink
            height="100%"
            gap="$gap8"
            width={shouldStackControls ? '100%' : undefined}
          >
            <Dropdown
              isOpen={statusDropdownOpen}
              toggleOpen={() => {
                setStatusDropdownOpen((prev) => !prev)
              }}
              menuLabel={<Text variant="buttonLabel3">{t('common.status')}</Text>}
              dropdownStyle={{ width: 240 }}
              containerStyle={shouldStackControls ? { flex: 1 } : undefined}
              buttonStyle={{ ...POSITION_FILTER_BUTTON_STYLE, width: shouldStackControls ? '100%' : undefined }}
              alignRight={false}
            >
              {statusFilterOptions}
            </Dropdown>
            <ProtocolFilterDropdown
              selectedVersions={selectedVersions ?? []}
              onToggleVersion={onVersionChange}
              fullWidth={shouldStackControls}
            />
            {showNetworkFilter && (
              <PositionsNetworkFilter selectedChain={selectedChain} onChainChange={onChainChange} />
            )}
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
