export function constructSameAddressMap<T extends string>(address: T): { [chainId: number]: T } {
  return {
    [1]: address,
    [3]: address,
    [42]: address,
    [4]: address,
    [5]: address,
  }
}
