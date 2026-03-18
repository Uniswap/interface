export function emitChainChanged(newChainId: string): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  window?.postMessage({
    emitKey: 'chainChanged',
    emitValue: newChainId,
  })
}
export function emitAccountsChanged(newConnectedAddresses: Address[]): void {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  window?.postMessage({
    emitKey: 'accountsChanged',
    emitValue: newConnectedAddresses,
  })
}
