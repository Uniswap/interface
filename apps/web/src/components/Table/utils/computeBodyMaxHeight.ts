interface ComputeBodyMaxHeightParams {
  bodyHeight: number
  itemHeight: number | undefined
  hasPinnedColumns: boolean
}

export function computeBodyMaxHeight({ bodyHeight, itemHeight, hasPinnedColumns }: ComputeBodyMaxHeightParams): number {
  if (itemHeight == null || itemHeight <= 0) {
    return bodyHeight
  }
  // TableBody adds $spacing2 when columns aren't pinned
  const rowGap = hasPinnedColumns ? 0 : 2
  const rowCount = Math.floor((bodyHeight + rowGap) / (itemHeight + rowGap))

  if (rowCount <= 0) {
    return 0
  }
  return rowCount * itemHeight + (rowCount - 1) * rowGap
}
