import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRightFromBracket } from 'ui/src/components/icons/ArrowRightFromBracket'
import { Edit } from 'ui/src/components/icons/Edit'
import { Minus } from 'ui/src/components/icons/Minus'
import { Plus } from 'ui/src/components/icons/Plus'
import { Sliders } from 'ui/src/components/icons/Sliders'
import type { MenuOptionItem } from 'uniswap/src/components/menus/ContextMenu'
import type { MarginPosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { InterfaceEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import type { MarginManageAction } from 'uniswap/src/features/transactions/margin/types'
import { useIsPlanInFlight } from '~/pages/Swap/Margin/hooks/useIsPlanInFlight'
import { marginPositionSubId } from '~/pages/Swap/Margin/marginPositionRow'

export type MarginActionItem = Omit<MenuOptionItem, 'Icon'> & {
  action: MarginManageAction
  // Optional upstream; both surfaces always render one. Omit before re-adding so the property
  // type is a clean union — intersecting `MenuOptionItem & { Icon }` degrades it to an unrenderable
  // `GeneratedIcon & Fn` cross-term (TS2604) now that GeneratedIcon is a mycelium forwardRef.
  Icon: NonNullable<MenuOptionItem['Icon']>
  // SHORT fragment (<=32 chars) for the menu column, which wraps rather than truncates inside
  // 200-250px. Swapped for the blocker reason while disabled.
  subheader: string
  // The full sentence, drawer tooltip only. Two registers: rendering the long form as a menu
  // subheader produces a ~450px-tall menu.
  tooltipBody: string
}

// The five position-management actions, in display order, for both the row overflow menu and the
// drawer icon row. One list so order, icons, copy, and disable rules cannot drift between surfaces.
export function useMarginPositionActions({
  position,
  onSelect,
  surface,
}: {
  position: MarginPosition
  onSelect: (request: { action: MarginManageAction; positionId: string }) => void
  // Distinguishes the row menu from the drawer and the touch-sheet fallback in analytics, so the
  // fallback does not collide with the row menu's elementName.
  surface: 'menu' | 'drawer'
}): MarginActionItem[] {
  const { t } = useTranslation()
  const isPlanInFlight = useIsPlanInFlight()
  // The on-chain leg subId is required by the server for every management intent.
  const subId = marginPositionSubId(position)
  const canManage = subId !== undefined && subId !== ''
  // The stable per-position key. Named for what it IS: the retired top-level `account` field once sat
  // here, and a request field called `account` invites being "fixed" to the sub-account address, which
  // several positions can share — the modal would then target the wrong one.
  const positionId = position.positionId

  return useMemo(() => {
    const select = (action: MarginManageAction) => (): void => {
      // No margin modal tracks its own invocation, so a completed ADJUST plan cannot otherwise be
      // attributed to add / withdraw / leverage.
      sendAnalyticsEvent(InterfaceEventName.MarginPositionActionSelected, { action, surface })
      onSelect({ action, positionId })
    }
    // Only in-flight gets an explanation; a missing subId keeps the action's own description.
    const blockedNote = canManage && isPlanInFlight ? t('margin.error.planInFlight') : undefined

    const items: MarginActionItem[] = [
      {
        action: 'add',
        Icon: Plus,
        label: t('margin.manage.add'),
        subheader: t('margin.manage.addDescription'),
        tooltipBody: t('margin.manage.addTooltip'),
        onPress: select('add'),
      },
      {
        action: 'withdraw',
        Icon: Minus,
        label: t('margin.manage.withdraw'),
        subheader: t('margin.manage.withdrawDescription'),
        tooltipBody: t('margin.manage.withdrawTooltip'),
        onPress: select('withdraw'),
      },
      {
        action: 'leverage',
        Icon: Sliders,
        label: t('margin.manage.changeLeverage'),
        subheader: t('margin.manage.changeLeverageDescription'),
        tooltipBody: t('margin.manage.changeLeverageTooltip'),
        onPress: select('leverage'),
      },
      {
        action: 'adjust',
        Icon: Edit,
        label: t('margin.manage.adjustAdvanced'),
        subheader: t('margin.manage.adjustAdvancedDescription'),
        tooltipBody: t('margin.manage.adjustAdvancedTooltip'),
        onPress: select('adjust'),
      },
      {
        action: 'close',
        Icon: ArrowRightFromBracket,
        label: t('margin.manage.closeConfirm'),
        subheader: t('margin.manage.closeDescription'),
        tooltipBody: t('margin.manage.closeTooltip'),
        onPress: select('close'),
        destructive: true,
        showDivider: true,
      },
    ]

    // Uniform gate: every ceiling (maxWithdrawable, leverage cap) needs a quote the menu hasn't
    // fetched, so no action can be pre-disabled for its own reason.
    const disabled = !canManage || isPlanInFlight
    return items.map((item) => ({
      ...item,
      disabled,
      // Both registers get the blocker: the menu renders subheader, the drawer tooltip renders
      // tooltipBody. Swapping only one leaves that surface silently explaining the normal action.
      subheader: blockedNote ?? item.subheader,
      tooltipBody: blockedNote ?? item.tooltipBody,
      // getMenuItemColor tests `destructive` BEFORE `disabled`, so a disabled Close would otherwise
      // stay full $statusCritical and read as live while the other four grey out.
      ...(item.destructive && disabled ? { iconColor: '$neutral2' as const, textColor: '$neutral2' as const } : {}),
    }))
  }, [t, positionId, canManage, isPlanInFlight, onSelect, surface])
}
