import { permit2Address } from '@uniswap/permit2-sdk'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isPermit2, isUniswapXSwapRequest } from 'wallet/src/components/dappRequests/types/Permit2Types'

const MAINNET_V2_DUTCH_REACTOR = '0x00000011F84B9aa48e5f8aA8B9897600006289Be'
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const SWAPPER = '0x2222222222222222222222222222222222222222'
const ATTACKER_CONTRACT = '0x1111111111111111111111111111111111111111'

const TYPE_DEF = [{ name: 'placeholder', type: 'address' }]

function dutchOrder({
  chainId = UniverseChainId.Mainnet,
  verifyingContract = permit2Address(UniverseChainId.Mainnet),
  primaryType = 'PermitWitnessTransferFrom',
  spender = MAINNET_V2_DUTCH_REACTOR,
}: {
  chainId?: number
  verifyingContract?: string
  primaryType?: string
  spender?: string
} = {}): unknown {
  return {
    types: {
      DutchOutput: TYPE_DEF,
      EIP712Domain: TYPE_DEF,
      OrderInfo: TYPE_DEF,
      PermitWitnessTransferFrom: TYPE_DEF,
      TokenPermissions: TYPE_DEF,
      V2DutchOrder: TYPE_DEF,
      ...(primaryType === 'PermitWitnessTransferFrom' ? {} : { [primaryType]: TYPE_DEF }),
    },
    domain: { name: 'Permit2', chainId, verifyingContract },
    primaryType,
    message: {
      deadline: '1900000000',
      nonce: '1',
      permitted: { token: USDC, amount: '1000000000' },
      spender,
      witness: {
        baseInputEndAmount: '1000000000',
        baseInputStartAmount: '1000000000',
        baseInputToken: USDC,
        baseOutputs: [{ token: WETH, startAmount: '1', endAmount: '1', recipient: SWAPPER }],
        cosigner: SWAPPER,
        info: {},
      },
    },
  }
}

// Finding 761: the preview replaces the raw domain view entirely, so it may only be shown for
// signatures genuinely bound to Permit2 and the UniswapX order type.
describe(isUniswapXSwapRequest, () => {
  it('accepts a genuine UniswapX Dutch order', () => {
    expect(isUniswapXSwapRequest(dutchOrder(), UniverseChainId.Mainnet)).toBe(true)
  })

  it('rejects a non-Permit2 verifying contract', () => {
    expect(isUniswapXSwapRequest(dutchOrder({ verifyingContract: ATTACKER_CONTRACT }), UniverseChainId.Mainnet)).toBe(
      false,
    )
  })

  it('rejects a substituted primary type', () => {
    expect(isUniswapXSwapRequest(dutchOrder({ primaryType: 'SpoofedOrder' }), UniverseChainId.Mainnet)).toBe(false)
  })

  it('rejects both spoofed together, which is the reported PoC', () => {
    expect(
      isUniswapXSwapRequest(
        dutchOrder({ verifyingContract: ATTACKER_CONTRACT, primaryType: 'SpoofedOrder' }),
        UniverseChainId.Mainnet,
      ),
    ).toBe(false)
  })

  it('rejects a spender that is not the V2 Dutch reactor', () => {
    expect(isUniswapXSwapRequest(dutchOrder({ spender: ATTACKER_CONTRACT }), UniverseChainId.Mainnet)).toBe(false)
  })

  // The mapping holds the zero address where no V2 Dutch reactor is deployed, so a truthiness
  // check let `spender: 0x0` pass without knowing any real one.
  it('rejects a zero-address spender on a chain with no V2 Dutch reactor', () => {
    expect(
      isUniswapXSwapRequest(
        dutchOrder({
          chainId: UniverseChainId.Base,
          verifyingContract: permit2Address(UniverseChainId.Base),
          spender: ZERO_ADDRESS,
        }),
        UniverseChainId.Base,
      ),
    ).toBe(false)
  })

  it('rejects a domain chain that disagrees with the authorized chain', () => {
    expect(isUniswapXSwapRequest(dutchOrder(), UniverseChainId.Base)).toBe(false)
  })

  it('rejects a domain named something other than Permit2', () => {
    const order = dutchOrder() as { domain: { name: string } }
    order.domain.name = 'NotPermit2'
    expect(isUniswapXSwapRequest(order, UniverseChainId.Mainnet)).toBe(false)
  })
})

describe(isPermit2, () => {
  function permitSingle(verifyingContract = permit2Address(UniverseChainId.Mainnet)): unknown {
    return {
      types: { EIP712Domain: TYPE_DEF, PermitDetails: TYPE_DEF, PermitSingle: TYPE_DEF },
      domain: { name: 'Permit2', chainId: UniverseChainId.Mainnet, verifyingContract },
      primaryType: 'PermitSingle',
      message: {
        details: { token: USDC, amount: '1000', expiration: '1900000000', nonce: '0' },
        spender: ATTACKER_CONTRACT,
        sigDeadline: '1900000000',
      },
    }
  }

  it('accepts a canonical Permit2 approval', () => {
    expect(isPermit2(permitSingle())).toBe(true)
  })

  it('rejects a lookalike domain pointing at another contract', () => {
    expect(isPermit2(permitSingle(ATTACKER_CONTRACT))).toBe(false)
  })

  it('accepts the zkSync Permit2 deployment, which lives at a different address', () => {
    const zkSync = permitSingle(permit2Address(UniverseChainId.Zksync)) as {
      domain: { chainId: number }
    }
    zkSync.domain.chainId = UniverseChainId.Zksync
    expect(isPermit2(zkSync)).toBe(true)
  })
})
