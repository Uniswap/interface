import { Connectors } from 'web3-react'
import WalletLink from 'walletlink'

const { Connector } = Connectors

const APP_NAME = 'Uniswap Exchange'
const APP_LOGO_URL =
  'https://emojipedia-us.s3.dualstack.us-west-1.amazonaws.com/thumbs/240/apple/232/unicorn-face_1f984.png'
const ETH_JSONRPC_URL = 'https://mainnet.infura.io/v3/60ab76e16df54c808e50a79975b4779f'
const CHAIN_ID = 1

export default class WalletLinkConnector extends Connector {
  private walletLinkProvider: any

  public async onActivation(): Promise<void> {
    const walletLink = new WalletLink({
      appName: APP_NAME,
      appLogoUrl: APP_LOGO_URL
    })
    this.walletLinkProvider = walletLink.makeWeb3Provider(ETH_JSONRPC_URL, CHAIN_ID)
  }

  public async getProvider() {
    return this.walletLinkProvider
  }

  async getAccount() {
    let accounts = await this.walletLinkProvider.enable()
    return accounts[0]
  }
}
