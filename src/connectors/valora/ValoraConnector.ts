import { DappKitRequestTypes, DappKitResponseStatus } from '@celo/utils'
import { ConnectorUpdate } from '@web3-react/types'
import { MiniRpcProvider, NetworkConnector } from 'connectors/NetworkConnector'

import { ValoraProvider } from './ValoraProvider'
import { IValoraAccount, parseDappkitResponse } from './valoraUtils'

export class ValoraConnector extends NetworkConnector {
  private account: string | null = null
  public valoraAccount: IValoraAccount | null = null

  private mainProvider: MiniRpcProvider | null = null

  setSavedValoraAccount(acc: IValoraAccount | null) {
    this.valoraAccount = acc
  }

  public async activate(): Promise<ConnectorUpdate> {
    if (this.valoraAccount) {
      this.account = this.valoraAccount.address
      this.mainProvider = new ValoraProvider(this.currentChainId)
      return {
        provider: this.mainProvider,
        chainId: this.currentChainId,
        account: this.valoraAccount.address,
      }
    }

    const data = parseDappkitResponse(window.location.href)
    if (!data) {
      throw new Error('Dappkit response not found')
    }
    if (data.type === DappKitRequestTypes.ACCOUNT_ADDRESS) {
      if (data.status === DappKitResponseStatus.SUCCESS) {
        this.account = data.address
        this.mainProvider = new ValoraProvider(this.currentChainId)
        return {
          provider: this.mainProvider,
          chainId: this.currentChainId,
          account: this.account,
        }
      }
    }
    throw new Error('Could not activate')
  }

  public get provider(): MiniRpcProvider | null {
    return this.mainProvider
  }

  async getAccount(): Promise<string | null> {
    return this.account
  }

  public async getProvider(): Promise<MiniRpcProvider | null> {
    return this.mainProvider
  }

  async close() {
    this.valoraAccount = null
    this.emitDeactivate()
  }
}
