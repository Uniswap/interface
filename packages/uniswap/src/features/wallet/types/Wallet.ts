import { EVMAccountDetails, SVMAccountDetails } from 'uniswap/src/features/wallet/types/AccountDetails'

export type Wallet = {
  evmAccount?: EVMAccountDetails
  svmAccount?: SVMAccountDetails
}
