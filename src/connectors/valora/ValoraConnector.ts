import { ConnectorUpdate } from '@web3-react/types'

import { MiniRpcProvider, NetworkConnector } from '../NetworkConnector'
import { ValoraProvider } from './ValoraProvider'
import { IValoraAccount, requestValoraAuth } from './valoraUtils'

export class ValoraConnector extends NetworkConnector {
  private account: string | null = null
  public valoraAccount: IValoraAccount | null = null

  private mainProvider: MiniRpcProvider | null = null

  setSavedValoraAccount(acc: IValoraAccount | null) {
    this.valoraAccount = acc
  }

  public async activate(): Promise<ConnectorUpdate> {
    if (!this.valoraAccount) {
      this.valoraAccount = await requestValoraAuth()
    }
    this.account = this.valoraAccount.address
    this.mainProvider = new ValoraProvider(this.currentChainId)
    return {
      provider: this.mainProvider,
      chainId: this.currentChainId,
      account: this.valoraAccount.address,
    }
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
