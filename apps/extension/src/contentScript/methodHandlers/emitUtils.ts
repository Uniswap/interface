export function emitChainChanged(newChainId: string): void {
  window?.postMessage({
    emitKey: 'chainChanged',
    emitValue: newChainId,
  })
}
export function emitAccountsChanged(newConnectedAddresses: Address[]): void {
  window?.postMessage({
    emitKey: 'accountsChanged',
    emitValue: newConnectedAddresses,
  })
}
