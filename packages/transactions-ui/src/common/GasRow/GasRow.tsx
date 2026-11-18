import { Flex, Text, TouchableArea } from '@universe/mycelium'
import { ChevronsIn } from '@universe/mycelium/icons/ChevronsIn'
import { ChevronsOut } from '@universe/mycelium/icons/ChevronsOut'
import { Gas } from '@universe/mycelium/icons/Gas'
import type { KeyboardEvent, ReactNode } from 'react'

export interface GasRowProps {
  /** Slot: a secondary ExchangeRate, or the form warning line when a trade warning replaces the rate. */
  leading?: ReactNode
  /**
   * Slot: the gas summary, normally GasSummary inside the adapter's network cost tooltip.
   * Omit it and the toggle is not rendered.
   */
  gasSummary?: ReactNode
  /**
   * Slot: takes the right side in place of the gas summary and the toggle, e.g. a link to
   * a canonical bridge when no route exists.
   */
  trailing?: ReactNode
  /** Controlled: shared with the HeightAnimator that holds the detail rows. */
  expanded?: boolean
  /**
   * Makes the gas summary the details toggle. Omit it while there is nothing to expand
   * (no quote yet): the gas summary then renders on its own.
   */
  onExpandedChange?: (expanded: boolean) => void
  testID?: string
}

/**
 * The form footer row: rate (or the trade warning line) on the left, the gas summary and
 * the details toggle on the right. Pair it with a HeightAnimator holding the detail rows.
 * They are siblings, not parent and child, because other rows (insufficient gas balance)
 * can sit between them.
 *
 * Replaces TradeInfoRow's markup; the Accordion context it relied on becomes explicit
 * state. Interaction: an inline expander on web and extension. The native form opens gas
 * details in a modal and renders GasSummary in its own row.
 *
 * @alias TradeInfoRow, FormFooterRow, DetailsToggleRow
 */
export function GasRow({
  leading,
  gasSummary,
  trailing,
  expanded = false,
  onExpandedChange,
  testID,
}: GasRowProps): JSX.Element {
  const toggle = (): void => onExpandedChange?.(!expanded)

  // TODO: drop onToggleKeyDown once Uniswap/universe#43759 lands; it adds Enter/Space to mycelium's div buttons.
  // TouchableArea is a div with role="button" on web, which the browser never activates from the keyboard.
  const onToggleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      toggle()
    }
  }

  return (
    <Flex centered row testID={testID}>
      <Flex fill>{leading}</Flex>
      {trailing ??
        (gasSummary && onExpandedChange ? (
          // The 1px padding stands in for the old Accordion trigger's transparent button border,
          // which set the row height and the gas position.
          <TouchableArea aria-expanded={expanded} p="$spacing1" onKeyDown={onToggleKeyDown} onPress={toggle}>
            <Flex row alignItems="center" gap="$spacing4">
              {gasSummary}
              {expanded ? (
                <ChevronsIn color="$neutral2" size="$icon.20" />
              ) : (
                <ChevronsOut color="$neutral2" size="$icon.20" />
              )}
            </Flex>
          </TouchableArea>
        ) : (
          gasSummary
        ))}
    </Flex>
  )
}

export interface GasSummaryProps {
  /** Formatted network cost, e.g. "$1.24". */
  gasText: string
  /**
   * The cost is high relative to the trade: icon and text paint critical. Product rule:
   * the web app adapter never sets it.
   */
  isHighRelativeToValue?: boolean
  testID?: string
}

/**
 * Gas icon and formatted network cost. The default content of GasRow `gasSummary` and of
 * the native form's gas row. UniswapX and sponsored costs keep their adapter-side content
 * for now (gradient text has no mycelium leg yet). Its fade and loading dim stay in the
 * adapter while they run on Reanimated.
 *
 * @alias NetworkCost, GasCost, GasFee
 */
export function GasSummary({ gasText, isHighRelativeToValue, testID }: GasSummaryProps): JSX.Element {
  const color = isHighRelativeToValue ? '$statusCritical' : '$neutral2'

  return (
    <Flex centered row gap="$spacing4" testID={testID}>
      <Gas color={color} size="$icon.16" />
      <Text color={color} variant="body3">
        {gasText}
      </Text>
    </Flex>
  )
}
