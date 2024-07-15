// Copied from https://github.com/Uniswap/interface/blob/main/src/utils/parseENSAddress.ts

const ENS_DOMAIN_REGEX = /^[a-zA-Z0-9-.]+\.eth$/

export function parseENSAddress(
  ensAddress: string
): { ensName: string; ensPath: string | undefined } | undefined {
  // Note: this was refactored from a regex into a function as the regex in question
  // contained a sequence of rules that result in O(n^2) complexity, thus potentially opening up
  // the mobile client to a DoS attack.
  // https://stackoverflow.com/questions/51710707/es-lint-security-flagging-an-unsafe-regular-expression

  let domain: string, path: string | undefined
  if ((ensAddress.match(/\//g) || []).length > 1) {
    return undefined
  }
  if (ensAddress.includes('/')) {
    const addrSplit = ensAddress.split('/')
    if (!addrSplit[0]) {
      return undefined
    }
    domain = addrSplit[0]
    path = '/' + addrSplit[1]
  } else {
    domain = ensAddress
  }
  if (
    !ENS_DOMAIN_REGEX.test(domain) ||
    domain.startsWith('-') ||
    domain.startsWith('.') ||
    domain.includes('..') ||
    domain.includes('--')
  ) {
    return undefined
  }
  const domainNoEth = domain.replace(/\.eth$/g, '')
  if (domainNoEth.endsWith('-') || domainNoEth.endsWith('.')) {
    return undefined
  }
  return { ensName: domain, ensPath: path }
}
