/**
 * Rule: any change that adds or alters a transaction signing path ships with an embedded wallet e2e
 * test before rollout.
 *
 * The test enumerates the real signing surface (every `case` in `EmbeddedWalletProvider.request` and
 * every runtime export of the modules in {@link SIGNING_MODULE_COVERAGE}) and fails when a row is
 * missing or stale, or when a `coveredBy` spec is missing or never calls `setupEmbeddedWallet`. It also
 * lists every module under `connection/` and `features/passkey/` and fails until each one is a signing
 * module here or named in {@link NON_SIGNING_MODULES} with a reason. Each choice shows up in the diff.
 */

export type CoverageRow =
  | { readonly coveredBy: readonly string[]; readonly caveat?: string; readonly exempt?: undefined }
  | { readonly exempt: string; readonly coveredBy?: undefined; readonly caveat?: undefined }

const PROVIDER_PLUMBING = 'Provider or connector plumbing; its signing surface is the request switch, covered above.'
const READS_STATE = 'Reads chain or bundler state; nothing is signed.'
const AUTH_CEREMONY = 'Passkey or device-session authentication; no transaction, typed data, or message is signed.'
const PIN_RECOVERY = 'PIN recovery; the wallet key signs nothing here.'
const HELPERS = 'Constants, errors, or helpers; nothing is signed.'

/**
 * Every other module under `src/connection` and `src/features/passkey`, with the reason it is not a
 * signing module. The test lists those directories and fails on a module missing from both maps.
 */
export const NON_SIGNING_MODULES: Readonly<Record<string, string>> = {
  'connection/EmbeddedWalletConnector': PROVIDER_PLUMBING,
  'connection/EmbeddedWalletProvider': PROVIDER_PLUMBING,
  'connection/createEmbeddedWalletProvider': PROVIDER_PLUMBING,
  'connection/eip5792Types': PROVIDER_PLUMBING,
  'connection/providerUtils': PROVIDER_PLUMBING,
  'connection/types': PROVIDER_PLUMBING,
  'connection/bundlerClient': 'Submits an already-signed user operation; nothing is signed.',
  'connection/getCallsStatus': READS_STATE,
  'connection/getCapabilities': READS_STATE,
  'features/passkey/authenticatorManagement': AUTH_CEREMONY,
  'features/passkey/checkRecoveryAvailability': AUTH_CEREMONY,
  'features/passkey/deviceSession': AUTH_CEREMONY,
  'features/passkey/embeddedWallet': AUTH_CEREMONY,
  'features/passkey/passkey': AUTH_CEREMONY,
  'features/passkey/passkeySession': AUTH_CEREMONY,
  'features/passkey/checkPinReuse': PIN_RECOVERY,
  'features/passkey/deriveArgon2': PIN_RECOVERY,
  'features/passkey/pinCrypto': PIN_RECOVERY,
  'features/passkey/pinValidation': PIN_RECOVERY,
  'features/passkey/privyBlobStore': PIN_RECOVERY,
  'features/passkey/privyBlobStore.shared': PIN_RECOVERY,
  'features/passkey/recoveryExecute': PIN_RECOVERY,
  'features/passkey/recoveryPrivyAuth': PIN_RECOVERY,
  'features/passkey/recoveryRotate': PIN_RECOVERY,
  'features/passkey/recoverySetup': PIN_RECOVERY,
  'features/passkey/useRecoveryFlow': PIN_RECOVERY,
  'features/passkey/hpkeExport':
    'Decrypts the exported phrase client-side; the export challenge is covered by signing#exportEncryptedSeedPhrase.',
  'features/passkey/constants': HELPERS,
  'features/passkey/errors': HELPERS,
  'features/passkey/unsupportedPasskeyError': HELPERS,
  'features/passkey/utils': HELPERS,
}

/** Web Playwright specs, relative to the repo root. */
export const EwSpec = {
  Send: 'apps/web/src/pages/Swap/Send/Send.anvil.e2e.test.ts',
  Swap: 'apps/web/src/pages/Swap/Swap/Swap.embeddedWallet.anvil.e2e.test.ts',
  Wrap: 'apps/web/src/pages/Swap/Swap/Wrap.embeddedWallet.anvil.e2e.test.ts',
  ClaimFees: 'apps/web/src/pages/Positions/ClaimFees.embeddedWallet.anvil.e2e.test.ts',
  LimitOrder: 'apps/web/src/pages/Swap/Limit/Limit.embeddedWallet.anvil.e2e.test.ts',
  SponsoredSwap: 'apps/web/src/pages/Swap/Swap/SponsoredSwap.embeddedWallet.anvil.e2e.test.ts',
  SeedPhraseExport: 'apps/web/src/components/AccountDrawer/RecoveryPhraseMenu/RecoveryPhraseMenu.e2e.test.ts',
} as const

const READ_ONLY: CoverageRow = { exempt: 'Read-only RPC; nothing is signed.' }
const NO_MESSAGE_SIGNING_FLOW: CoverageRow = {
  exempt: 'No web flow signs a plain message through the embedded wallet today; the first consumer adds the spec.',
}

const SIGN_TRANSACTION_SPECS = [EwSpec.Send, EwSpec.Swap, EwSpec.Wrap, EwSpec.ClaimFees] as const
const SIGN_TYPED_DATA_SPECS = [EwSpec.Swap, EwSpec.LimitOrder] as const
const DELEGATED_7702_SPECS = [EwSpec.Send] as const
const SPONSORED_USER_OP_SPECS = [EwSpec.SponsoredSwap] as const

/** Every `case` in `EmbeddedWalletProvider.request`. */
export const PROVIDER_METHOD_COVERAGE: Readonly<Record<string, CoverageRow>> = {
  eth_sendTransaction: { coveredBy: SIGN_TRANSACTION_SPECS },
  eth_signTypedData_v4: { coveredBy: [...SIGN_TYPED_DATA_SPECS, ...SPONSORED_USER_OP_SPECS] },
  personal_sign: NO_MESSAGE_SIGNING_FLOW,
  eth_sign: NO_MESSAGE_SIGNING_FLOW,
  wallet_sendCalls: { coveredBy: SPONSORED_USER_OP_SPECS },
  wallet_getCapabilities: { exempt: 'Delegation status read; nothing is signed.' },
  wallet_getCallsStatus: READ_ONLY,
  wallet_switchEthereumChain: { exempt: 'Local chain switch; nothing is signed.' },
  eth_accounts: READ_ONLY,
  eth_blockNumber: READ_ONLY,
  eth_call: READ_ONLY,
  eth_chainId: READ_ONLY,
  eth_estimateGas: READ_ONLY,
  eth_getBlockByNumber: READ_ONLY,
  eth_getCode: READ_ONLY,
  eth_getTransactionByHash: READ_ONLY,
  eth_getTransactionReceipt: READ_ONLY,
}

/** Exports of each signing module, keyed by path under `src/`; the test imports the same modules. */
export const SIGNING_MODULE_COVERAGE: Readonly<Record<string, Readonly<Record<string, CoverageRow>>>> = {
  'features/passkey/signing': {
    signTransactionWithPasskey: { coveredBy: SIGN_TRANSACTION_SPECS },
    signTypedDataWithPasskey: { coveredBy: [...SIGN_TYPED_DATA_SPECS, ...SPONSORED_USER_OP_SPECS] },
    signMessageWithPasskey: NO_MESSAGE_SIGNING_FLOW,
    sign7702AuthorizationWithPasskey: { coveredBy: DELEGATED_7702_SPECS },
    sign7702TransactionWithPasskey: { coveredBy: DELEGATED_7702_SPECS },
    exportEncryptedSeedPhrase: { coveredBy: [EwSpec.SeedPhraseExport] },
  },
  'features/passkey/embeddedWalletDelegation': {
    sendDelegatedTransaction: {
      coveredBy: DELEGATED_7702_SPECS,
      caveat:
        'The spec stubs the gas estimate; the client fallback estimate for the delegated self-call is not exercised.',
    },
    checkEmbeddedWalletDelegation: { exempt: 'Trading API read; nothing is signed. Every EW spec stubs it.' },
    deriveEmbeddedWalletDelegationResult: { exempt: 'Pure derivation; unit-tested.' },
  },
  'connection/userOpSigning': {
    signUserOpWithEmbeddedWallet: { coveredBy: SPONSORED_USER_OP_SPECS },
    prepareDelegationAuthorization: {
      coveredBy: SPONSORED_USER_OP_SPECS,
      caveat:
        'The wallet is reported delegated, so only the no-authorization branch runs; building a 7702 authorization for a user operation has no spec.',
    },
  },
  'connection/sendCalls': {
    sendEmbeddedWalletCalls: { coveredBy: SPONSORED_USER_OP_SPECS },
  },
}
