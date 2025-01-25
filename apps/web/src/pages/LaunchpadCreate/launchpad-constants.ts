export const isTestMode = false

export function getFactoryAddress() {
  if (isTestMode) {
    return '0x5A07aF212669f43970A390D5f1606e75aB9C242E'
  } else {
    return '0x5DC48e2186979B92E46a980227E7feb16fa42810'
  }
}

export function getDaySeconds() {
  if (isTestMode) {
    return 60 * 60
  } else {
    return 24 * 60 * 60
  }
}
