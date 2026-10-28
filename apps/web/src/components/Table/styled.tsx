import { clickableStyle, Flex, type FlexCompatProps, zIndexes } from '@universe/mycelium'
import {
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type ForwardRefExoticComponent,
  type RefAttributes,
} from 'react'
import { Cell } from '~/components/Table/Cell'

export type TableRowBaseProps = FlexCompatProps

// Explicit return types throughout this file: forwardRef's inferred type isn't nameable under
// declaration emit (TS2883) — its structural expansion reaches mycelium-internal prop-composition
// types that aren't exported.
export const TableRowBase: ForwardRefExoticComponent<TableRowBaseProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  TableRowBaseProps
>(function TableRowBase(props, ref) {
  return (
    <Flex
      ref={ref}
      row
      alignItems="center"
      width="fit-content"
      minWidth="100%"
      height="100%"
      transition="background-color 0.1s ease-in-out"
      borderRadius="$rounded12"
      {...props}
    />
  )
})

export type DataRowProps = TableRowBaseProps & {
  dimmed?: boolean
  embeddedInExpandableGroup?: boolean
  embeddedInIssuerPanel?: boolean
  selected?: boolean
}

export const DataRow: ForwardRefExoticComponent<DataRowProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  DataRowProps
>(function DataRow({ dimmed, embeddedInExpandableGroup, embeddedInIssuerPanel, selected, ...rest }, ref) {
  return (
    <TableRowBase
      ref={ref}
      // Hover-in and hover-out share the row's base 0.1s transition (no separate instant hover-in edge).
      hoverStyle={{ backgroundColor: '$surface1Hovered' }}
      {...(dimmed ? { opacity: 0.6 } : {})}
      {...(embeddedInExpandableGroup
        ? { backgroundColor: 'transparent', hoverStyle: { backgroundColor: 'transparent' } }
        : {})}
      {...(embeddedInIssuerPanel
        ? { backgroundColor: 'transparent', hoverStyle: { backgroundColor: 'transparent' } }
        : {})}
      // Defined last so the selected fill wins over embedded hover backgrounds when both apply.
      {...(selected ? { backgroundColor: '$surface3', hoverStyle: { backgroundColor: '$surface3' } } : {})}
      {...rest}
    />
  )
})

export const CellContainer: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function CellContainer(props, ref) {
  return <Flex ref={ref} grow className="first-child-flex-grow-0 last-child-justify-end" {...props} />
})

export const TableSeparatorRow: ForwardRefExoticComponent<FlexCompatProps & RefAttributes<HTMLDivElement>> = forwardRef<
  HTMLDivElement,
  FlexCompatProps
>(function TableSeparatorRow(props, ref) {
  return (
    <Flex
      ref={ref}
      centered
      row
      gap="$spacing12"
      py="$spacing8"
      px="$spacing16"
      borderStyle="solid"
      borderWidth={0}
      width="100%"
      // Opaque and above TablePinnedColumnOverlay so the full-height pinned divider breaks here
      // instead of striking through the toggle label.
      position="relative"
      zIndex={zIndexes.default + 2}
      backgroundColor="$surface1"
      {...props}
    />
  )
})

export type FilterHeaderRowProps = FlexCompatProps

// `clickableStyle` is unconditional here (matches the original styled() config, which spread it in
// the base object too, so the base already carried it regardless of any `clickable` variant) —
// there is no `clickable` prop on this component; HeaderCell below is the one that gates on it.
export const FilterHeaderRow: ForwardRefExoticComponent<FilterHeaderRowProps & RefAttributes<HTMLDivElement>> =
  forwardRef<HTMLDivElement, FilterHeaderRowProps>(function FilterHeaderRow(props, ref) {
    return <Flex ref={ref} row alignItems="center" userSelect="none" gap="$gap4" {...clickableStyle} {...props} />
  })

export type HeaderCellProps = ComponentPropsWithoutRef<typeof Cell> & { clickable?: boolean }

export const HeaderCell: ForwardRefExoticComponent<HeaderCellProps & RefAttributes<ComponentRef<typeof Cell>>> =
  forwardRef<ComponentRef<typeof Cell>, HeaderCellProps>(function HeaderCell({ clickable, ...rest }, ref) {
    return <Cell ref={ref} py="$spacing12" {...(clickable ? { cursor: 'pointer' } : {})} {...rest} />
  })
