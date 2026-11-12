import { TABLE_ROW_GAP_PX } from '~/components/Table/constants'

interface ComputeBodyMaxHeightParams {
  bodyHeight: number
  itemHeight: number | undefined
  rowGap?: number
}

export function computeBodyMaxHeight({
  bodyHeight,
  itemHeight,
  rowGap = TABLE_ROW_GAP_PX,
}: ComputeBodyMaxHeightParams): number {
  if (itemHeight == null || itemHeight <= 0) {
    return bodyHeight
  }
  const rowCount = Math.floor((bodyHeight + rowGap) / (itemHeight + rowGap))

  if (rowCount <= 0) {
    return 0
  }
  return rowCount * itemHeight + (rowCount - 1) * rowGap
}
