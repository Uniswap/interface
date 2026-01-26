import { DEFAULT_CUSTOM_DEADLINE } from 'uniswap/src/constants/transactions'

export const getTradeSettingsDeadline = (
  customDeadline?: number,
  blockTimestamp?: bigint | number,
): number | undefined => {
  // Use default deadline (30 minutes) if customDeadline is not set
  const deadlineMinutes = customDeadline ?? DEFAULT_CUSTOM_DEADLINE
  const deadlineSeconds = deadlineMinutes * 60
  
  // Prefer using block timestamp if available (more accurate for on-chain execution)
  // Otherwise fall back to client time
  const baseTimestamp = blockTimestamp 
    ? (typeof blockTimestamp === 'bigint' ? Number(blockTimestamp) : blockTimestamp)
    : Math.floor(Date.now() / 1000)
  
  const deadline = baseTimestamp + deadlineSeconds

  if (process.env.NODE_ENV === 'development') {
    console.log('[swap debug] getTradeSettingsDeadline:', {
      customDeadline,
      usingDefault: customDeadline === undefined,
      defaultDeadline: DEFAULT_CUSTOM_DEADLINE,
      deadlineMinutes,
      deadlineSeconds,
      blockTimestamp: blockTimestamp?.toString(),
      baseTimestamp,
      deadline,
      deadlineDate: new Date(deadline * 1000).toLocaleString('zh-CN'),
      currentTime: new Date().toLocaleString('zh-CN'),
      usingBlockTimestamp: !!blockTimestamp,
    })
  }

  return deadline
}
