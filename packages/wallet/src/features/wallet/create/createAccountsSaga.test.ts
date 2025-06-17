import dayjs from 'dayjs'
import { expectSaga } from 'redux-saga-test-plan'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { Account, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { CreateAccountsParams, createAccounts } from 'wallet/src/features/wallet/create/createAccountsSaga'
import { walletRootReducer } from 'wallet/src/state/walletReducer'
import { ACCOUNT, ACCOUNT2, ACCOUNT3 } from 'wallet/src/test/fixtures'

async function createNativeAccounts({
  payload,
  initialAccounts = {},
  timeout = 250,
}: {
  payload: CreateAccountsParams
  initialAccounts?: { [key: string]: Account }
  timeout?: number
}): Promise<{
  wallet: {
    accounts: Account
    activeAccountAddress: string
  }
}> {
  const { storeState } = await expectSaga(createAccounts, payload)
    .withReducer(walletRootReducer)
    .withState({
      wallet: {
        accounts: initialAccounts as { [key: string]: Account },
      },
    })
    .run(timeout)

  return storeState as { wallet: { accounts: Account; activeAccountAddress: string } }
}

describe(createAccounts, () => {
  jest.setTimeout(10000)

  it('Imports one account', async () => {
    const state = await createNativeAccounts({ payload: { accounts: [ACCOUNT] } })
    const wallets = state.wallet.accounts
    const accounts = Object.values(wallets)
    const { activeAccountAddress } = state.wallet
    const firstNewlyCreatedWallet = accounts[0] as SignerMnemonicAccount

    expect(accounts).toHaveLength(1)
    expect(firstNewlyCreatedWallet.timeImportedMs).toBeDefined()
    expect(firstNewlyCreatedWallet.derivationIndex).toEqual(0)
    expect(firstNewlyCreatedWallet.address).toEqual(firstNewlyCreatedWallet.mnemonicId)
    expect(activeAccountAddress).toEqual(firstNewlyCreatedWallet.address)
  })

  it('Imports couple wallets and activates the first one', async () => {
    const state = await createNativeAccounts({
      payload: { accounts: [ACCOUNT, ACCOUNT2, ACCOUNT3] },
    })

    const wallets = state.wallet.accounts
    const accounts = Object.values(wallets)
    const { activeAccountAddress } = state.wallet
    const firstNewlyCreatedWallet = accounts[0] as SignerMnemonicAccount

    expect(accounts).toHaveLength(3)
    expect(firstNewlyCreatedWallet.timeImportedMs).toBeDefined()
    expect(firstNewlyCreatedWallet.derivationIndex).toEqual(0)
    expect(firstNewlyCreatedWallet.address).toEqual(firstNewlyCreatedWallet.mnemonicId)
    expect(activeAccountAddress).toEqual(ACCOUNT.address)
  })

  it('Imports two new wallet on top of existing watch only wallet', async () => {
    const state = await createNativeAccounts({
      payload: { accounts: [ACCOUNT, ACCOUNT2] },
      initialAccounts: {
        '0xaddress1': {
          type: AccountType.Readonly,
          address: '0xaddress1',
          name: 'READONLY ACCOUNT',
          timeImportedMs: dayjs().valueOf(),
          pushNotificationsEnabled: false,
        },
      },
    })

    const wallets = state.wallet.accounts
    const accounts = Object.values(wallets)
    const { activeAccountAddress } = state.wallet

    expect(accounts).toHaveLength(3)
    expect(accounts.filter((a) => a.type === AccountType.Readonly)).toHaveLength(1)
    expect(wallets).toHaveProperty('0xaddress1')
    expect(wallets).toHaveProperty(ACCOUNT.address)
    expect(wallets).toHaveProperty(ACCOUNT2.address)
    expect(activeAccountAddress).toEqual(ACCOUNT.address)
  })

  it('Imports two new wallet on top of existing watch only wallet and activate first', async () => {
    const state = await createNativeAccounts({
      payload: { accounts: [ACCOUNT2, ACCOUNT] },
      initialAccounts: {
        '0xaddress1': {
          type: AccountType.Readonly,
          address: '0xaddress1',
          name: 'READONLY ACCOUNT',
          timeImportedMs: dayjs().valueOf(),
          pushNotificationsEnabled: false,
        },
      },
    })

    const wallets = state.wallet.accounts
    const accounts = Object.values(wallets)
    const { activeAccountAddress } = state.wallet

    expect(accounts).toHaveLength(3)
    expect(accounts.filter((a) => a.type === AccountType.Readonly)).toHaveLength(1)
    expect(wallets).toHaveProperty('0xaddress1')
    expect(wallets).toHaveProperty(ACCOUNT2.address)
    expect(wallets).toHaveProperty(ACCOUNT.address)
    expect(activeAccountAddress).toEqual(ACCOUNT2.address)
  })

  it('Imports two new wallet on top of existing signer mnemonic account', async () => {
    const state = await createNativeAccounts({
      payload: { accounts: [ACCOUNT2, ACCOUNT] },
      initialAccounts: {
        [ACCOUNT3.address]: ACCOUNT3,
      },
    })

    const wallets = state.wallet.accounts
    const accounts = Object.values(wallets)
    const { activeAccountAddress } = state.wallet

    expect(accounts).toHaveLength(3)
    expect(wallets).toHaveProperty(ACCOUNT3.address)
    expect(wallets).toHaveProperty(ACCOUNT2.address)
    expect(wallets).toHaveProperty(ACCOUNT.address)
    expect(activeAccountAddress).toEqual(ACCOUNT2.address)
  })

  it('Imports two new wallet on top of existing signer mnemonic account and activate the first one', async () => {
    const state = await createNativeAccounts({
      payload: { accounts: [ACCOUNT2, ACCOUNT] },
      initialAccounts: {
        [ACCOUNT3.address]: ACCOUNT3,
      },
    })

    const wallets = state.wallet.accounts
    const accounts = Object.values(wallets)
    const { activeAccountAddress } = state.wallet

    expect(accounts).toHaveLength(3)
    expect(wallets).toHaveProperty(ACCOUNT3.address)
    expect(wallets).toHaveProperty(ACCOUNT2.address)
    expect(wallets).toHaveProperty(ACCOUNT.address)
    expect(activeAccountAddress).toEqual(ACCOUNT2.address)
  })
})
