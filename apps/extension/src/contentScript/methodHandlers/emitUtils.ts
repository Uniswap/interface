export function emitChainChanged(newChainId: string): void {
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  window?.postMessage({
    emitKey: 'chainChanged',
    emitValue: newChainId,
  })
}
export function emitAccountsChanged(newConnectedAddresses: Address[]): void {
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  window?.postMessage({
    emitKey: 'accountsChanged',
    emitValue: newConnectedAddresses,
  })
}
