export const iconSizes = {
  icon8: 8,
  icon12: 12,
  icon16: 16,
  icon20: 20,
  icon24: 24,
  icon28: 28,
  icon36: 36,
  icon40: 40,
  icon64: 64,
}

export const namedIconSizes = createNamedIconsSizes({
  transactionHistory: '$icon.40',
})

type Keys = keyof typeof iconSizes

// until we have TS 5.2 satisfies
function createNamedIconsSizes<
  R extends Record<string, `$icon.${Keys extends `icon${infer Size}` ? Size : never}`>
>(record: R): R {
  return record
}
