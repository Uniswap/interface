// TODO: split up local name & ens name so that we can search both
export interface SearchableRecipient {
  address: Address
  name?: string | null | undefined
}
