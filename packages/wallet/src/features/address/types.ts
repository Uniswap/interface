import { AccountType } from 'wallet/src/features/wallet/accounts/types'

export interface SearchableRecipient {
  address: Address
  name?: string | null
  isUnitag?: boolean
  type?: AccountType
}
