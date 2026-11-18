import { type PlainMessage } from '@bufbuild/protobuf'
import { Platform, type PlatformAddress, type WalletAccount } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'

export function parseRestProtocolVersion(version: string | undefined): ProtocolVersion | undefined {
  switch (version?.toLowerCase()) {
    case 'v2':
      return ProtocolVersion.V2
    case 'v3':
      return ProtocolVersion.V3
    case 'v4':
      return ProtocolVersion.V4
    default:
      return undefined
  }
}

/**
 * Helps simplify REST endpoint interfaces that expect a walletAccount object instead
 * of simple address fields
 */
function createWalletAccount({ evmAddress, svmAddress }: { evmAddress?: string; svmAddress?: string }): {
  walletAccount: PlainMessage<WalletAccount>
} {
  const platformAddresses: PlainMessage<PlatformAddress>[] = []

  if (evmAddress) {
    platformAddresses.push({ platform: Platform.EVM, address: evmAddress })
  }

  if (svmAddress) {
    platformAddresses.push({ platform: Platform.SVM, address: svmAddress })
  }

  return {
    walletAccount: {
      platformAddresses,
    },
  }
}

export type WithoutWalletAccount<T> = Omit<T, 'walletAccount'>

/**
 * Helper function to transform input that includes evmAddress/svmAddress to use walletAccount instead
 */
export function transformInput<T extends Record<string, unknown> & { walletAccount?: never }>(
  input: (T & { evmAddress?: string; svmAddress?: string }) | undefined,
):
  | (Omit<T, 'evmAddress' | 'svmAddress' | 'walletAccount'> & { walletAccount: PlainMessage<WalletAccount> })
  | undefined {
  if (!input) {
    return undefined
  }

  const { evmAddress, svmAddress, walletAccount: _walletAccount, ...restInput } = input

  return {
    ...restInput,
    ...createWalletAccount({ evmAddress, svmAddress }),
  }
}

export type WithoutWalletAccounts<T> = Omit<T, 'walletAccounts'>

/**
 * Multi-wallet variant of {@link transformInput}: transforms input that includes a `wallets`
 * address list to use `walletAccounts` instead
 */
export function transformWalletsInput<T extends Record<string, unknown> & { walletAccounts?: never }>(
  input: (T & { wallets?: { evmAddress?: string; svmAddress?: string }[] }) | undefined,
): (Omit<T, 'wallets' | 'walletAccounts'> & { walletAccounts: PlainMessage<WalletAccount>[] }) | undefined {
  if (!input) {
    return undefined
  }

  const { wallets, walletAccounts: _walletAccounts, ...restInput } = input

  return {
    ...restInput,
    walletAccounts: (wallets ?? []).map((wallet) => createWalletAccount(wallet).walletAccount),
  }
}
