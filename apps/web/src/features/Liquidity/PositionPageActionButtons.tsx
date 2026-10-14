import '~/features/Liquidity/PositionPageActionButtons.css'
import { PositionStatus, ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Button, Flex, Text } from '@universe/mycelium'
import { AdaptiveWebPopoverContentCompat, PopoverCompat as Popover } from '@universe/mycelium/popover-compat'
import { useIsTouchDevice, useMedia } from '@universe/mycelium/theme-hooks-compat'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Tooltip } from 'ui/src'
import { IconButton } from 'ui/src/components/buttons/IconButton/IconButton'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'
import { Dollar } from 'ui/src/components/icons/Dollar'
import { GridView } from 'ui/src/components/icons/GridView'
import { Minus } from 'ui/src/components/icons/Minus'
import { Plus } from 'ui/src/components/icons/Plus'
import { X } from 'ui/src/components/icons/X'
import { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import { MenuContent } from 'uniswap/src/components/menus/ContextMenuContent'
import { PositionInfo } from 'uniswap/src/features/positions/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { noop } from 'utilities/src/react/noop'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'
import { MobileBottomBar } from '~/components/NavBar/MobileBottomBar'
import { MobileHeaderActions } from '~/components/StickyCollapsibleHeader/HeaderActions/MobileHeaderActions'
import type { HeaderAction, HeaderActionSection } from '~/components/StickyCollapsibleHeader/HeaderActions/types'
import { logCollectFeesClick } from '~/features/Liquidity/analytics'
import { ScrollDirection, useScroll } from '~/hooks/useScroll'
import { setOpenModal } from '~/state/application/reducer'
import { useAppDispatch } from '~/state/hooks'
import { isV2MigrationUnsupportedChain } from '~/utils/networkSupportsV2Migration'
import { isV4UnsupportedChain } from '~/utils/networkSupportsV4'

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
  const trace = useTrace()
  const media = useMedia()
  const { direction: scrollDirection } = useScroll()
  const isTouchDevice = useIsTouchDevice()

  const { status, fee0Amount, fee1Amount } = positionInfo ?? {}

  const migrateDisabledReason =
    positionInfo?.version === ProtocolVersion.V3 && isV4UnsupportedChain(positionInfo.chainId)
      ? t('pool.migrateLiquidityDisabledTooltip')
      : positionInfo?.version === ProtocolVersion.V2 && isV2MigrationUnsupportedChain(positionInfo.chainId)
        ? t('pool.migrateLiquidityV2DisabledTooltip')
        : undefined
  const hasFees = fee0Amount?.greaterThan(0) || fee1Amount?.greaterThan(0)

  const { migrateOption, removeLiquidityOption, addLiquidityOption, collectFeesOption } = useMemo(() => {
    // oxlint-disable-next-line no-shadow
    const migrateOption: MenuOptionItem | undefined =
      positionInfo?.version !== ProtocolVersion.V4 && status !== PositionStatus.CLOSED
        ? {
            label: t('pool.migrateLiquidity'),
            onPress: onMigrate,
          }
        : undefined

    // Add remove liquidity option if position is not closed
    // oxlint-disable-next-line no-shadow
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

    // oxlint-disable-next-line no-shadow
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
    // oxlint-disable-next-line no-shadow
    const collectFeesOption: MenuOptionItem | undefined =
      positionInfo?.version !== ProtocolVersion.V2 && hasFees
        ? {
            label: t('pool.collectFees'),
            onPress: () => {
              if (!positionInfo) {
                return
              }
              logCollectFeesClick(positionInfo, trace)
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
  }, [dispatch, hasFees, positionInfo, status, t, onMigrate, trace])

  // Where migration is unsupported the inline Migrate button renders disabled under a tooltip.
  // A sheet row has no hover, so the reason rides as a subtitle instead — the row stays
  // visible but inert, rather than vanishing with no hint the action exists.

  // '…' + bottom-sheet mechanism the pool detail header uses, with each action keeping its
  // inline-button handler. Used only for the mid-width band (see the media.lg branch below).
  const actionSections: HeaderActionSection[] = useMemo(() => {
    const iconProps = { size: '$icon.18', color: '$neutral2' } as const
    const entries: { option: MenuOptionItem | undefined; icon: JSX.Element; disabledReason?: string }[] = [
      { option: migrateOption, icon: <ArrowRight {...iconProps} />, disabledReason: migrateDisabledReason },
      { option: addLiquidityOption, icon: <Plus {...iconProps} /> },
      { option: removeLiquidityOption, icon: <Minus {...iconProps} /> },
      { option: collectFeesOption, icon: <Dollar {...iconProps} /> },
    ]
    const actions: HeaderAction[] = entries
      .filter((entry): entry is (typeof entries)[number] & { option: MenuOptionItem } => entry.option !== undefined)
      .map(({ option, icon, disabledReason }) => ({
        title: option.label,
        icon,
        show: true,
        subtitle: disabledReason,
        textColor: disabledReason ? '$neutral2' : undefined,
        onPress: disabledReason ? noop : option.onPress,
      }))
    return [{ title: t('common.liquidity'), actions }]
  }, [migrateOption, addLiquidityOption, removeLiquidityOption, collectFeesOption, migrateDisabledReason, t])

  if (!isOwner) {
    return null
  }

  // Three tiers, ordered narrowest-first so the more specific breakpoint wins:
  // ≤450px (media.sm): the floating action button + context menu (MobileBottomBar).
  if (media.sm) {
    return (
      <MobileBottomBar backgroundColor="$surface1" hide={isTouchDevice && scrollDirection === ScrollDirection.DOWN}>
        {/* Order is load-bearing: MWebActionButtons promotes actionItems[0] to the floating CTA and
            puts the rest in the menu, so this deliberately leads with Collect fees rather than
            following actionSections' order above. Don't align the two lists. */}
        <MWebActionButtons
          actionItems={[
            collectFeesOption,
            addLiquidityOption,
            removeLiquidityOption,
            // Same treatment as the sheet: greyed with the reason, not hidden.
            migrateOption && migrateDisabledReason
              ? { ...migrateOption, disabled: true, subheader: migrateDisabledReason, onPress: noop }
              : migrateOption,
          ].filter((o): o is MenuOptionItem => o !== undefined)}
        />
      </MobileBottomBar>
    )
  }

  // 450–768px (media.lg && !media.sm): the '…' header menu, mirroring the pool detail page.
  if (media.lg) {
    return <MobileHeaderActions actionSections={actionSections} />
  }

  // >768px: full inline action buttons.
  return (
    <Flex row gap="$gap12" alignItems="center" flexWrap="wrap">
      {migrateOption &&
        (migrateDisabledReason ? (
          // asChild keeps the Button itself as the row's flex item (a wrapper div would size differently
          // from its siblings); onDisabledPress keeps pointer events so the hover still opens the tooltip.
          <Tooltip placement="top">
            <Tooltip.Trigger asChild>
              <Button size="small" emphasis="secondary" fill={buttonFill} disabled onDisabledPress={noop}>
                {migrateOption.label}
              </Button>
            </Tooltip.Trigger>
            <Tooltip.Content maxWidth={280}>
              <Tooltip.Arrow />
              <Text variant="body4">{migrateDisabledReason}</Text>
            </Tooltip.Content>
          </Tooltip>
        ) : (
          <Button size="small" emphasis="secondary" fill={buttonFill} onPress={migrateOption.onPress}>
            {migrateOption.label}
          </Button>
        ))}
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

  // Caller-controlled priority: the first item becomes the floating CTA, the rest go to the menu.
  const ctaButton = actionItems[0]
  const menuItems = actionItems.slice(1)

  return (
    <Flex row backgroundColor="$surface1" gap="$gap12">
      <Button onPress={ctaButton.onPress}>{ctaButton.label}</Button>
      {menuItems.length > 0 && (
        <Popover placement="top-end" offset={10} open={isOpen} onOpenChange={onOpenChange}>
          <Popover.Trigger>
            <IconButton emphasis="secondary" icon={isOpen ? <X color="$neutral1" /> : <GridView color="$neutral1" />} />
          </Popover.Trigger>
          <AdaptiveWebPopoverContentCompat
            isOpen={isOpen}
            // Legacy rendered a plain popover even at mWeb widths — never the small-screen sheet.
            adaptWhen={false}
            backgroundColor="transparent"
            className="position-actions-menu-enter"
          >
            {/* Shared context-menu content: sizes to the same min/max width as menus elsewhere so the
                full "Remove liquidity" / "Migrate liquidity" labels render without truncating. */}
            <MenuContent items={menuItems} handleCloseMenu={() => setIsOpen(false)} />
          </AdaptiveWebPopoverContentCompat>
        </Popover>
      )}
    </Flex>
  )
}
