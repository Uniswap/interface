import { createContracts, createTransactions, createUtilities } from '@universe/chains'
import { FeatureFlags, getFeatureFlag } from '@universe/gating'

const ctx = { getViemEnabled: () => getFeatureFlag(FeatureFlags.ViemEnabled) }

export const {
  decodeFunctionResult,
  encodeFunctionData,
  formatUnits,
  getAddress,
  isAddress,
  namehash,
  parseEther,
  parseUnits,
  toBigInt,
  zeroAddress,
} = createUtilities(ctx)
export const { signTypedData } = createTransactions(ctx)
export const { createContract } = createContracts(ctx)

export { assume0xAddress } from '@universe/chains'
export type {
  Abi,
  Account,
  Address,
  BaseContract,
  Block,
  ChainContract,
  ContractTransaction,
  ExternalProvider,
  FallbackProvider,
  Hash,
  Hex,
  JsonRpcProvider,
  JsonRpcSigner,
  MarginAccountAbi,
  MarginRouterAbi,
  Networkish,
  Permit2Abi,
  ProviderConnectInfo,
  PublicClient,
  RpcUserOperation,
  SignableMessage,
  SignedAuthorization,
  Transaction,
  TransactionRequest,
  TransactionResponse,
  TypedDataDomain,
  V4QuoterAbi,
  Web3Provider,
  WethAbi,
} from '@universe/chains'
export {
  ensPublicResolverAbi,
  ensRegistrarAbi,
  entryPoint08Address,
  erc20Abi,
  erc20Abi_bytes32,
  erc721Abi,
  feeOnTransferDetectorAbi,
  formatUserOperationRequest,
  getTypesForEIP712Domain,
  hashTypedData,
  marginAccountAbi,
  marginRouterAbi,
  pad,
  permit2Abi,
  ResourceUnavailableRpcError,
  RpcError,
  SwitchChainError,
  UserRejectedRequestError,
  v4QuoterAbi,
  wethAbi,
} from '@universe/chains'
