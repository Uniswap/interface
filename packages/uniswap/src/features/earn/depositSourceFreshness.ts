export function hasFreshEnoughPortfolioBalanceData({
  dataUpdatedAt,
  minimumBalanceDataUpdatedAtMs,
}: {
  dataUpdatedAt: number | undefined
  minimumBalanceDataUpdatedAtMs: number | undefined
}): boolean {
  return (
    minimumBalanceDataUpdatedAtMs === undefined ||
    (dataUpdatedAt !== undefined && dataUpdatedAt >= minimumBalanceDataUpdatedAtMs)
  )
}

export function getFreshPortfolioBalanceData<TData>({
  data,
  dataUpdatedAt,
  minimumBalanceDataUpdatedAtMs,
}: {
  data: TData | undefined
  dataUpdatedAt: number | undefined
  minimumBalanceDataUpdatedAtMs: number | undefined
}): TData | undefined {
  return hasFreshEnoughPortfolioBalanceData({ dataUpdatedAt, minimumBalanceDataUpdatedAtMs }) ? data : undefined
}
