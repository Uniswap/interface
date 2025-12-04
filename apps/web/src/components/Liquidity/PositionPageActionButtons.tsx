import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { PositionInfo } from 'components/Liquidity/types'
import { MobileBottomBar } from 'components/NavBar/MobileBottomBar'
import { MouseoverTooltip } from 'components/Tooltip'
import { ScrollDirection, useScroll } from 'hooks/useScroll'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setOpenModal } from 'state/application/reducer'
import { useAppDispatch } from 'state/hooks'
import { Button, DropdownMenuSheetItem, Flex, IconButton, Popover, useIsTouchDevice, useMedia } from 'ui/src'
import { GridView } from 'ui/src/components/icons/GridView'
import { X } from 'ui/src/components/icons/X'
import { zIndexes } from 'ui/src/theme'
import { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenuV2'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { isV4UnsupportedChain } from 'utils/networkSupportsV4'

export function PositionPageActionButtons({
  buttonFill = false,
  positionInfo,
  isOwner,
  onMigrate,
}: {
  buttonFill?: boolean
  positionInfo?: PositionInfo
  isOwner: boolean
  onMigrate: () => void
}) {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()
  const media = useMedia()
  const { direction: scrollDirection } = useScroll()
  const isTouchDevice = useIsTouchDevice()

  const { status, fee0Amount, fee1Amount } = positionInfo ?? {}

  const showV4UnsupportedTooltip =
    positionInfo?.version === ProtocolVersion.V3 && isV4UnsupportedChain(positionInfo.chainId)
  const hasFees = fee0Amount?.greaterThan(0) || fee1Amount?.greaterThan(0)

  const { migrateOption, removeLiquidityOption, addLiquidityOption, collectFeesOption } = useMemo(() => {
    const migrateOption: MenuOptionItem | undefined =
      positionInfo?.version !== ProtocolVersion.V4 && status !== PositionStatus.CLOSED
        ? {
            label: t('pool.migrateLiquidity'),
            onPress: onMigrate,
          }
        : undefined

    // Add remove liquidity option if position is not closed
    const removeLiquidityOption: MenuOptionItem | undefined =
      status !== PositionStatus.CLOSED
        ? {
            label: t('pool.removeLiquidity'),
            onPress: () => {
              dispatch(
                setOpenModal({
                  name: ModalName.RemoveLiquidity,
                  initialState: positionInfo,
                }),
              )
            },
          }
        : undefined

    const addLiquidityOption: MenuOptionItem = {
      label: t('common.addLiquidity'),
      onPress: () => {
        dispatch(
          setOpenModal({
            name: ModalName.AddLiquidity,
            initialState: positionInfo,
          }),
        )
      },
    }

    // Add collect fees option if there are fees
    const collectFeesOption: MenuOptionItem | undefined =
      positionInfo?.version !== ProtocolVersion.V2 && hasFees
        ? {
            label: t('pool.collectFees'),
            onPress: () => {
              dispatch(
                setOpenModal({
                  name: ModalName.ClaimFee,
                  initialState: positionInfo,
                }),
              )
            },
          }
        : undefined

    return {
      migrateOption,
      removeLiquidityOption,
      addLiquidityOption,
      collectFeesOption,
    }
  }, [dispatch, hasFees, positionInfo, status, t, onMigrate])

  if (!isOwner) {
    return null
  }

  if (media.sm) {
    return (
      <MobileBottomBar backgroundColor="$surface1" hide={isTouchDevice && scrollDirection === ScrollDirection.DOWN}>
        <MWebActionButtons
          actionItems={[
            collectFeesOption,
            addLiquidityOption,
            removeLiquidityOption,
            showV4UnsupportedTooltip ? undefined : migrateOption,
          ].filter((o): o is MenuOptionItem => o !== undefined)}
        />
      </MobileBottomBar>
    )
  }

  return (
    <Flex row gap="$gap12" alignItems="center" flexWrap="wrap">
      {migrateOption && (
        <MouseoverTooltip text={t('pool.migrateLiquidityDisabledTooltip')} disabled={!showV4UnsupportedTooltip}>
          <Button
            size="small"
            emphasis="secondary"
            fill={buttonFill}
            isDisabled={showV4UnsupportedTooltip}
            opacity={showV4UnsupportedTooltip ? 0.5 : 1}
            onPress={migrateOption.onPress}
          >
            {migrateOption.label}
          </Button>
        </MouseoverTooltip>
      )}
      <Button size="small" emphasis="secondary" fill={buttonFill} onPress={addLiquidityOption.onPress}>
        {addLiquidityOption.label}
      </Button>
      {removeLiquidityOption && (
        <Button size="small" emphasis="secondary" fill={buttonFill} onPress={removeLiquidityOption.onPress}>
          {removeLiquidityOption.label}
        </Button>
      )}
      {collectFeesOption && (
        <Button size="small" maxWidth="fit-content" fill={buttonFill} onPress={collectFeesOption.onPress}>
          {collectFeesOption.label}
        </Button>
      )}
    </Flex>
  )
}

function MWebActionButtons({ actionItems }: { actionItems: MenuOptionItem[] }): JSX.Element | null {
  const [isOpen, setIsOpen] = useState(false)
  const onOpenChange = (open: boolean) => {
    setIsOpen(open)
  }

  if (actionItems.length === 0) {
    return null
  }

  const ctaButton = actionItems[0]
  const menuItems = actionItems.slice(1)

  return (
    <Flex row backgroundColor="$surface1" gap="$gap12">
      <Button onPress={ctaButton.onPress}>{ctaButton.label}</Button>
      {menuItems.length > 0 && (
        <Popover placement="top-end" offset={10} onOpenChange={onOpenChange}>
          <Popover.Trigger>
            <IconButton emphasis="secondary" icon={isOpen ? <X color="$neutral1" /> : <GridView color="$neutral1" />} />
          </Popover.Trigger>
          <Popover.Content
            zIndex={zIndexes.popover}
            backgroundColor="transparent"
            animation="125ms"
            enterStyle={{
              opacity: 0,
              scale: 0.98,
              transform: [{ translateY: -4 }],
            }}
          >
            <Flex
              flexDirection="column"
              gap="$spacing4"
              p="$spacing8"
              backgroundColor="$surface1"
              borderRadius="$rounded20"
              borderWidth="$spacing1"
              borderColor="$surface3"
            >
              {menuItems.map(({ label, onPress }) => (
                <Popover.Close asChild key={label}>
                  <DropdownMenuSheetItem variant="small" label={label} onPress={onPress} />
                </Popover.Close>
              ))}
            </Flex>
          </Popover.Content>
        </Popover>
      )}
    </Flex>
  )
}
