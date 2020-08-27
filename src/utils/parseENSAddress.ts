const ENS_NAME_REGEX = /^(([a-zA-Z0-9]+\.)+)eth(\/.*)?$/

export function parseENSAddress(ensAddress: string): { ensName: string; ensPath: string | undefined } | undefined {
  const match = ensAddress.match(ENS_NAME_REGEX)
  if (!match) return undefined
  return { ensName: `${match[1].toLowerCase()}eth`, ensPath: match[3] }
}
