import { BigNumber } from '@ethersproject/bignumber'
import {
  BlobInfo,
  MAX_HEX_STRING_LENGTH,
  TOKEN_AMOUNT_SIGNED_HEX_BITS,
  TOLERANCE_INDEX,
} from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/getOutputAmountFromSwapLogAndFormData.ts/constants'

/**
 *
 * Gets the index location of the input amount blob from the string
 *
 * @param logData - the data from the log
 * @returns inputAmount - the exact input token amount
 */
export function getInputAmountIndices({ logData, inputAmount }: { logData: string; inputAmount: BigNumber }):
  | {
      inputStartIndex: number
      inputEndIndex: number
      isInputPositive: boolean
    }
  | undefined {
  // convert to hex
  const inputAmountAsHex = inputAmount.toHexString().slice(2)
  const positiveAmountIndices = getIndicesFromLogData({ target: inputAmountAsHex, logData })

  // if positive amount match found return, otherwise check for negative
  if (positiveAmountIndices) {
    return {
      inputStartIndex: positiveAmountIndices.startIndex,
      inputEndIndex: positiveAmountIndices.endIndex,
      isInputPositive: true,
    }
  }

  // the EVM typically uses 2's complement negatives for signed integer; we assume signed int256 here
  const negativeInputAmountAsHex = BigNumber.from(`-${inputAmount.toString()}`)
    .toTwos(TOKEN_AMOUNT_SIGNED_HEX_BITS)
    .toHexString()

  // remove the 0x and padding and search
  const searchStr = negativeInputAmountAsHex.slice(2).replace(/^f+/, '')

  const negativeAmountIndices = getIndicesFromLogData({ target: searchStr, logData })

  if (!negativeAmountIndices) {
    return undefined
  }

  return {
    inputStartIndex: negativeAmountIndices.startIndex,
    inputEndIndex: negativeAmountIndices.endIndex,
    isInputPositive: false,
  }
}

function getIndicesFromLogData({
  target,
  logData,
}: {
  target: string
  logData: string
}): { startIndex: number; endIndex: number } | undefined {
  const startIndex = logData.indexOf(target)

  if (startIndex !== -1) {
    return { startIndex, endIndex: startIndex + target.length - 1 }
  }

  return undefined
}

const CALLDATA_PADDING_AND_BLOB_REGEX = /(0{4,}|f{4,})([0-9a-f]+?)(?=0{4,}|f{4,}|$)/gi

/**
 * Extracts data blobs from log data.
 * Trailing 0s or leading f's of the blob will be trimmed off
 *
 * @param logData prefixed log data
 * @returns array of data blobs
 */
export function getDataWithoutPadding(logData: string): BlobInfo[] {
  const taggedBlobs: BlobInfo[] = []
  for (const [_, pad, blobData] of logData.slice(2).matchAll(CALLDATA_PADDING_AND_BLOB_REGEX)) {
    if (!pad?.[0] || !blobData) {
      continue
    }

    const isBlobPositive = pad[0] === '0'
    const lastBlob = taggedBlobs[taggedBlobs.length - 1]
    if (lastBlob) {
      lastBlob.isNextBlobPositive = isBlobPositive
    }

    taggedBlobs.push({
      isFirst: !lastBlob,
      blobData,
      isBlobPositive: pad[0] === '0',
    })
  }

  const lastBlock = taggedBlobs[taggedBlobs.length - 1]
  if (lastBlock) {
    lastBlock.isLast = true
  }

  return taggedBlobs
}

/**
 * Given the expected range of the output and the trimmed data hex value, find out if a combination of contentful padding
 * (ie an actual 0 or f that was trimmed off by the padding trimmer) makes it so that the value falls in the given range
 *
 * This would make a good DSA problem for interviews 🥀
 *
 * @param blob - the blob containing the value we will pad and slide across
 * @param outputLowBound - the minimum output value
 * @param outputHighBound - the maximum output value
 * @param possibleLengths - possible lengths of the string
 */
export function slidingWindowRangeMatch({
  blob,
  outputLowBound,
  outputHighBound,
  possibleLengths,
}: {
  blob: BlobInfo
  outputLowBound: BigNumber
  outputHighBound: BigNumber
  possibleLengths: number[]
}): BigNumber | undefined {
  const { blobData, isBlobPositive, isNextBlobPositive, isFirst, isLast } = blob

  const canContainTrailingDigits = !isLast
  const canContainLeadingDigits = !isFirst
  const leadingDigits = isBlobPositive ? '0' : 'f'
  const trailingDigits = isNextBlobPositive ? '0' : 'f'

  const paddedString = `${canContainLeadingDigits ? leadingDigits.repeat(TOLERANCE_INDEX) : ''}${blobData}${canContainTrailingDigits ? trailingDigits.repeat(TOLERANCE_INDEX) : ''}`

  const eligibleBigNumbers: BigNumber[] = []

  const addBigNumberIfInRange = (hexStringWithoutPrefix: string): void => {
    // get absolute value
    let testingBN
    try {
      testingBN = isBlobPositive
        ? BigNumber.from(`0x${hexStringWithoutPrefix}`)
        : BigNumber.from(`0x${hexStringWithoutPrefix.padStart(MAX_HEX_STRING_LENGTH, 'f')}`)
            .fromTwos(TOKEN_AMOUNT_SIGNED_HEX_BITS)
            .abs()
    } catch (_e) {
      // skip logs that can't be parsed
      return
    }

    if (testingBN.lt(outputLowBound)) {
      return
    }

    if (testingBN.gt(outputHighBound)) {
      return
    }

    eligibleBigNumbers.push(testingBN)
  }

  for (const windowLength of possibleLengths) {
    // Slide through the string in windowLength chunks
    for (let i = 0; i <= paddedString.length - windowLength; i++) {
      const segment = paddedString.slice(i, i + windowLength)
      addBigNumberIfInRange(segment)
    }
  }

  if (eligibleBigNumbers.length > 1) {
    throw new Error('multiple possible instant balance entries detected')
  }

  return eligibleBigNumbers[0]
}
