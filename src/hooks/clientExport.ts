import { Token, WETH, ChainId } from '@uniswap/sdk'
import { Signer, ContractFactory, BigNumber, utils, Signature } from 'ethers'
import { providers } from 'ethers'
import crossFetch from 'cross-fetch'
import { MultiSender, CallType } from '@anydotcrypto/metatransactions'
import { Fetcher, Route, Trade, TokenAmount, Percent, Price } from '@uniswap/sdk'
import { splitSignature, joinSignature, verifyMessage } from 'ethers/lib/utils'
import daiJson from './contractAbi/DAI.json'
import router03Json from './contractAbi/router03.json'
import { walletconnect } from '../connectors'
const { keccak256, defaultAbiCoder, arrayify } = utils

const DAIMainnet = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18)
const DAIRopsten = new Token(ChainId.ROPSTEN, '0x1038b262c3a786713def6797ad9cbc5fc20439e2', 18)

interface DaiSwapRelayTransaction {
  chainId: number
  gasLimit: number
  from: string
  to: string
  data: string
  type: 'daiswap'
}

export const UNISWAP_ROUTER_V3_ADDRESS_ROPSTEN = '0xc31178f913f99663bdf0ff03aa456794b183592c'
export const UNISWAP_ROUTER_V3_ADDRESS_MAINNET = '0xb4407a8a0bc8e41fe269963a282c8829c9b975fa'

class UniswapExchange {
  constructor(private readonly uniswapAddress: string) {}

  public async getRate(fromToken: Token, toToken: Token): Promise<Price> {
    const pair = await Fetcher.fetchPairData(fromToken, toToken)
    const route = new Route([pair], toToken)

    return route.midPrice
  }

  public async tradeExactIn(
    fromToken: Token,
    toToken: Token,
    amountIn: BigNumber,
    wallet: Signer,
    gasPayer: string,
    gasOverhead: number,
    deadline?: BigNumber
  ) {
    if (fromToken.chainId != toToken.chainId) throw new Error('Tokens must have the same chainid')

    const pair = await Fetcher.fetchPairData(fromToken, toToken)
    const trade = Trade.bestTradeExactIn([pair], new TokenAmount(fromToken, amountIn.toString()), toToken)
    if (!trade[0]) {
      throw new Error(
        `Not trade found for route between ${fromToken.address}:${toToken.address} of amount ${amountIn.toString()}.`
      )
    }

    const slippageTolerance = new Percent('10', '1000') // 100 bips, or 1%
    const amountOutMin = trade[0].minimumAmountOut(slippageTolerance).raw // needs to be converted to e.g. hex
    const path = [fromToken.address, toToken.address]
    const to = await wallet.getAddress() // should be a checksummed recipient address
    const deadlineDefaulted = deadline || Math.floor(Date.now() / 1000) + 60 * 20 // 20 minutes from the current Unix time

    let data: string
    const value = BigNumber.from('0').toHexString()
    if (fromToken.address === WETH[fromToken.chainId].address) {
      throw new Error('Unsupported swap.')
    } else if (toToken.address === WETH[toToken.chainId].address) {
      const uniswapV2Router = new ContractFactory(router03Json.abi, router03Json.bytecode, wallet).attach(
        this.uniswapAddress
      )

      const nonce = Date.now()

      const gasRefund = {
        gasPayer: gasPayer,
        gasOverhead: gasOverhead, // Looks like the transaction is doing some weird discounting, so 21k provides ±500 extra gas.
      }

      const encodeSwap = defaultAbiCoder.encode(
        [
          'uint',
          'uint',
          'address[]',
          'address',
          'uint',
          'tuple(address gasPayer, uint256 gasOverhead)',
          'address',
          'uint',
          'uint',
          'address',
        ],
        [
          amountIn,
          amountOutMin.toString(),
          path,
          to,
          deadline,
          gasRefund,
          to,
          nonce,
          fromToken.chainId,
          this.uniswapAddress,
        ]
      )

      const hSwap = keccak256(encodeSwap)
      let signature: Signature

      // Only works if wallet connect is "connected"
      if (walletconnect.walletConnectProvider) {
        const provider = wallet.provider! as providers.Web3Provider
        const res = await provider.send('personal_sign', [await wallet.getAddress(), hSwap])
        signature = splitSignature(res)
      } else {
        signature = splitSignature(await wallet.signMessage(arrayify(hSwap)))
      }

      const replayProtection = { signer: to, nonce, signature: joinSignature(signature) }

      data = uniswapV2Router.interface.encodeFunctionData('metaSwapExactTokensForETH', [
        amountIn.toString(),
        amountOutMin.toString(),
        path,
        to,
        deadlineDefaulted,
        gasRefund,
        replayProtection,
      ])
    } else {
      throw new Error('Only supports ETH to Token or Token to ETH, assuming a pair exists.')
    }

    return { to: this.uniswapAddress, data, value }
  }
}

export class DaiSwapClient {
  public constructor(
    private readonly apiUrl: string,
    private readonly signer: Signer,
    private readonly chainId: number,
    private readonly brokerAddress: string,
    private readonly uniswapAddress: string
  ) {
    if (chainId !== 1 && chainId !== 3) {
      throw new Error(`Daiswap is only supported on ropsten and mainnet. Current chain id: ${chainId}`)
    }
  }

  private async permit(signer: Signer, receiver: string, dai: string, nonce: number, chainId: number, expiry: number) {
    const domainSchema = [
      { name: 'name', type: 'string' },
      { name: 'version', type: 'string' },
      { name: 'chainId', type: 'uint256' },
      { name: 'verifyingContract', type: 'address' },
    ]

    const permitSchema = [
      { name: 'holder', type: 'address' },
      { name: 'spender', type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'expiry', type: 'uint256' },
      { name: 'allowed', type: 'bool' },
    ]

    const domain = {
      name: 'Dai Stablecoin',
      version: '1',
      chainId,
      verifyingContract: dai,
    }

    const message = {
      holder: await signer.getAddress(),
      spender: receiver,
      nonce,
      expiry: expiry,
      allowed: true,
    }

    const data = {
      types: {
        EIP712Domain: domainSchema,
        Permit: permitSchema,
      },
      domain,
      primaryType: 'Permit',
      message,
    }
    const sig = splitSignature(
      await (signer.provider as providers.JsonRpcProvider)!.send('eth_signTypedData_v4', [
        await signer.getAddress(),
        JSON.stringify(data),
      ])
    )

    return { signature: sig }
  }

  public async relay(
    amountIn: BigNumber,
    amountOutMin: BigNumber,
    path: string[],
    to: string,
    deadline: BigNumber
  ): Promise<string> {
    // TODO: caching

    const signerAddress = await this.signer.getAddress()

    // check the permit status
    const dai = this.chainId === 3 ? DAIRopsten : DAIMainnet
    const daiFacced = new ContractFactory(daiJson.abi, daiJson.bytecode, this.signer).attach(dai.address)

    // check the approval for the uniswap contract
    let dataTx: { data: string; to: string }
    const uniswapExchange = new UniswapExchange(this.uniswapAddress)
    const allowance = await daiFacced.allowance(signerAddress, this.uniswapAddress)
    if (allowance.eq(0)) {
      // batch with a permit
      const multisender = new MultiSender()

      const nonce = await daiFacced.functions.nonces(signerAddress)
      const expiry = Math.floor(Date.now() / 1000) + 25 * 60

      const { signature } = await this.permit(
        this.signer,
        this.uniswapAddress,
        daiFacced.address,
        BigNumber.isBigNumber(nonce) ? nonce.toNumber() : parseInt(nonce.toString()),
        this.chainId,
        expiry
      )

      const encodedDai = daiFacced.interface.encodeFunctionData('permit', [
        signerAddress,
        this.uniswapAddress,
        BigNumber.isBigNumber(nonce) ? nonce.toNumber() : parseInt(nonce.toString()),
        expiry,
        true,
        signature.v!,
        signature.r,
        signature.s,
      ])

      // TODO: do some confidence checks on these input values
      // TODO: use the input values rather than hardcoded
      const uniswapData = await uniswapExchange.tradeExactIn(
        dai,
        WETH[this.chainId as 1 | 3],
        amountIn,
        this.signer,
        this.brokerAddress,
        132000, // higher overhead for batch
        deadline
      )

      dataTx = multisender.batch([
        {
          data: encodedDai,
          to: dai.address,
          callType: CallType.CALL,
          revertOnFail: true,
        },
        {
          data: uniswapData.data,
          to: uniswapData.to,
          callType: CallType.CALL,
          revertOnFail: true,
        },
      ])
    } else {
      // TODO: do some confidence checks on these input values
      // TODO: use the input values rather than hardcoded
      dataTx = await uniswapExchange.tradeExactIn(
        dai,
        WETH[this.chainId as 1 | 3],
        amountIn,
        this.signer,
        this.brokerAddress,
        40000, // lower overhead for just the trade, looks to be ~10k higher than estimate. Should be enough to cover our refund transactions.
        deadline
      )
    }

    const estimatedGas = 300000 // await this.signer.provider!.estimateGas({ to: dataTx.to, data: dataTx.data })

    // sign this for the daiswapper?
    const daiSwapTx: DaiSwapRelayTransaction = {
      to: dataTx.to,
      data: dataTx.data,
      type: 'daiswap',
      chainId: this.chainId as 1 | 3,
      from: signerAddress,
      gasLimit: estimatedGas,
    }

    const response = await crossFetch(this.apiUrl + '/daiswap', {
      method: 'POST',
      body: JSON.stringify(daiSwapTx),
      headers: { 'Content-Type': 'application/json' },
    })

    // expect a success
    if (!response.ok) {
      const contentType = response.headers.get('content-type')

      if (contentType && contentType.indexOf('application/json') !== -1) {
        const body = await response.json()
        throw new Error(body.message)
      } else throw new Error(await response.text())
    }

    const body = await response.json()

    // return the receipt id for watching
    return body.receipt.id
  }
}
