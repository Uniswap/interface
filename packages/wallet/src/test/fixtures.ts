import { faker } from '@faker-js/faker'
import { ChainId } from 'wallet/src/constants/chains'
import { NativeCurrency } from 'wallet/src/features/tokens/NativeCurrency'

// Ensures stable fixtures
export const FAKER_SEED = 123
faker.seed(FAKER_SEED)

export const mockSigner = new (class {
  signTransaction = (): string => faker.finance.ethereumAddress()
  connect = (): this => this
})()

export const signerManager = {
  getSignerForAccount: async (): Promise<typeof mockSigner> => mockSigner,
}

export const SAMPLE_PASSWORD = 'my-super-strong-password'
export const SAMPLE_SEED = [
  'dove',
  'lumber',
  'quote',
  'board',
  'young',
  'robust',
  'kit',
  'invite',
  'plastic',
  'regular',
  'skull',
  'history',
].join(' ')
export const SAMPLE_SEED_ADDRESS_1 = '0x82D56A352367453f74FC0dC7B071b311da373Fa6'
export const SAMPLE_SEED_ADDRESS_2 = '0x55f4B664C68F398f9e81EFf63ef4444A1A184F98'

export const MainnetEth = NativeCurrency.onChain(ChainId.Mainnet)
export const PolygonMatic = NativeCurrency.onChain(ChainId.Polygon)
export const ArbitrumEth = NativeCurrency.onChain(ChainId.ArbitrumOne)
export const OptimismEth = NativeCurrency.onChain(ChainId.Optimism)
export const BaseEth = NativeCurrency.onChain(ChainId.Base)

export { faker }
