import { BigNumber } from 'ethers'
import { createMigrate } from 'redux-persist'
import { migrations } from 'src/app/migrations'
import { initialSchema, v1Schema } from 'src/app/schema'
import { persistConfig } from 'src/app/store'
import { WalletConnectModalState } from 'src/components/WalletConnect/ScanSheet/WalletConnectModal'
import { SWAP_ROUTER_ADDRESSES } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import {
  TransactionDetails,
  TransactionStatus,
  TransactionType,
} from 'src/features/transactions/types'

describe('Redux state migrations', () => {
  it('is able to perform all migrations starting from the initial schema', async () => {
    const intialSchemaStub = {
      ...initialSchema,
      _persist: { version: -1, rehydrated: false },
    }

    const migrate = createMigrate(migrations)
    const migratedSchema = await migrate(intialSchemaStub, persistConfig.version)
    expect(typeof migratedSchema).toBe('object')
  })

  it('migrates from initialSchema to v0Schema', () => {
    const txDetails0: TransactionDetails = {
      chainId: ChainId.Mainnet,
      id: '0',
      from: '0xShadowySuperCoder',
      options: {
        request: {
          from: '0x123',
          to: '0x456',
          value: '0x0',
          data: '0x789',
          nonce: 10,
          gasPrice: BigNumber.from('10000'),
        },
      },
      typeInfo: {
        type: TransactionType.Approve,
        tokenAddress: '0xtokenAddress',
        spender: SWAP_ROUTER_ADDRESSES[ChainId.Mainnet],
      },
      status: TransactionStatus.Pending,
      addedTime: 1487076708000,
      hash: '0x123',
    }

    const txDetails1: TransactionDetails = {
      chainId: ChainId.Rinkeby,
      id: '1',
      from: '0xKingHodler',
      options: {
        request: {
          from: '0x123',
          to: '0x456',
          value: '0x0',
          data: '0x789',
          nonce: 10,
          gasPrice: BigNumber.from('10000'),
        },
      },
      typeInfo: {
        type: TransactionType.Approve,
        tokenAddress: '0xtokenAddress',
        spender: SWAP_ROUTER_ADDRESSES[ChainId.Rinkeby],
      },
      status: TransactionStatus.Success,
      addedTime: 1487076708000,
      hash: '0x123',
    }

    const intialSchemaStub = {
      ...initialSchema,
      transactions: {
        byChainId: {
          [ChainId.Mainnet]: {
            '0': txDetails0,
          },
          [ChainId.Rinkeby]: {
            '1': txDetails1,
          },
        },
        lastTxHistoryUpdate: {
          '0xShadowySuperCoder': 12345678912345,
          '0xKingHodler': 9876543210987,
        },
      },
    }

    const newSchema = migrations[0](intialSchemaStub)
    expect(newSchema.transactions[ChainId.Mainnet]).toBeUndefined()
    expect(newSchema.transactions.lastTxHistoryUpdate).toBeUndefined()

    expect(newSchema.transactions['0xShadowySuperCoder'][ChainId.Mainnet]['0'].status).toEqual(
      TransactionStatus.Pending
    )
    expect(newSchema.transactions['0xKingHodler'][ChainId.Mainnet]).toBeUndefined()
    expect(newSchema.transactions['0xKingHodler'][ChainId.Rinkeby]['0']).toBeUndefined()
    expect(newSchema.transactions['0xKingHodler'][ChainId.Rinkeby]['1'].from).toEqual(
      '0xKingHodler'
    )

    expect(newSchema.notifications.lastTxNotificationUpdate).toBeDefined()
    expect(
      newSchema.notifications.lastTxNotificationUpdate['0xShadowySuperCoder'][ChainId.Mainnet]
    ).toEqual(12345678912345)
  })

  it('migrates from v0 to v1', () => {
    const initialSchemaStub = {
      ...initialSchema,
      walletConnect: {
        ...initialSchema.wallet,
        modalState: WalletConnectModalState.ScanQr,
      },
    }

    const v0 = migrations[0](initialSchemaStub)
    const v1 = migrations[1](v0)
    expect(v1.walletConnect.modalState).toEqual(undefined)
  })

  it('migrates from v1 to v2', () => {
    const TEST_ADDRESSES = ['0xTest']

    const v1SchemaStub = {
      ...v1Schema,
      favorites: {
        ...v1Schema.favorites,
        followedAddresses: TEST_ADDRESSES,
      },
    }

    const v2 = migrations[2](v1SchemaStub)

    expect(v2.favorites.watchedAddresses).toEqual(TEST_ADDRESSES)
    expect(v2.favorites.followedAddresses).toBeUndefined()
  })
})
