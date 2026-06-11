import type { BigNumberish } from '@ethersproject/bignumber'

const GWEI_TO_WEI = BigInt('1000000000')

/**
 * maxFeePerGas (wei) x gasLimit -> wei (decimal string): a populated tx's max
 * cost. Like {@link computeMaxCost} but reads the resolved wei fields off the
 * swap `TransactionRequest`, so the Network cost row matches the editor's "Max
 * cost" once overrides are applied. Returns undefined when either field is
 * missing or unparseable.
 */
export function computeMaxCostFromTx(args: {
  maxFeePerGas?: BigNumberish | null
  gasLimit?: BigNumberish | null
}): string | undefined {
  const { maxFeePerGas, gasLimit } = args
  if (maxFeePerGas === undefined || maxFeePerGas === null || gasLimit === undefined || gasLimit === null) {
    return undefined
  }
  try {
    // `.toString()` then `BigInt` handles every `BigNumberish` shape.
    return (BigInt(maxFeePerGas.toString()) * BigInt(gasLimit.toString())).toString()
  } catch {
    return undefined
  }
}

/**
 * (maxBaseFee + priorityFee) GWEI x gasLimit -> wei (decimal string).
 * Returns undefined when any input is missing or unparseable.
 */
export function computeMaxCost(args: {
  maxBaseFeeGwei?: string
  priorityFeeGwei?: string
  gasLimit?: string
}): string | undefined {
  const { maxBaseFeeGwei, priorityFeeGwei, gasLimit } = args
  if (!maxBaseFeeGwei || !priorityFeeGwei || !gasLimit) {
    return undefined
  }

  const maxBaseWei = parseGweiToWeiBigint(maxBaseFeeGwei)
  const prioWei = parseGweiToWeiBigint(priorityFeeGwei)
  if (maxBaseWei === undefined || prioWei === undefined) {
    return undefined
  }

  const limit = parseIntString(gasLimit)
  if (limit === undefined) {
    return undefined
  }

  return ((maxBaseWei + prioWei) * limit).toString()
}

function parseGweiToWeiBigint(gweiStr: string): bigint | undefined {
  const cleaned = gweiStr.replace(/,/g, '')
  // oxlint-disable-next-line security/detect-unsafe-regex -- anchored, no quantifier overlap, ReDoS-safe
  if (!/^[0-9]+(\.[0-9]+)?$/.test(cleaned)) {
    return undefined
  }
  const [intPart, fracPartRaw] = cleaned.split('.')
  if (intPart === undefined) {
    return undefined
  }
  // GWEI -> wei = x1e9: pad/truncate fractional to 9 digits.
  const fracPart = ((fracPartRaw ?? '') + '000000000').slice(0, 9)
  return BigInt(intPart) * GWEI_TO_WEI + BigInt(fracPart)
}

function parseIntString(s: string): bigint | undefined {
  const cleaned = s.replace(/,/g, '')
  if (!/^[0-9]+$/.test(cleaned)) {
    return undefined
  }
  return BigInt(cleaned)
}
