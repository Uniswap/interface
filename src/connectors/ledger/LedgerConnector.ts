// Largely based off of CeloVote
// https://github.com/zviadm/celovote-app/blob/main/src/ledger.ts

import { ContractKit, newKit } from '@celo/contractkit'
import { AddressValidation, LedgerWallet, newLedgerWalletWithSetup } from '@celo/wallet-ledger'
import TransportWebUSB from '@ledgerhq/hw-transport-webusb'
import { ChainId, CHAIN_INFO } from '@ubeswap/sdk'
import { AbstractConnector } from '@web3-react/abstract-connector'
import { ConnectorUpdate } from '@web3-react/types'
import { NETWORK_CHAIN_ID } from 'connectors'

export class LedgerKit {
  private closed = false
  private constructor(public chainId: ChainId, public kit: ContractKit, public wallet: LedgerWallet) {}

  public static async init(chainId: ChainId, idxs: number[]) {
    const transport = await TransportWebUSB.create()
    try {
      const wallet = await newLedgerWalletWithSetup(transport, idxs, undefined, AddressValidation.never)
      const kit = newKit(CHAIN_INFO[chainId].fornoURL, wallet)
      return new LedgerKit(chainId, kit, wallet)
    } catch (e) {
      transport.close()
      throw e
    }
  }

  close = () => {
    if (this.closed) {
      return
    }
    this.closed = true
    this.wallet.transport.close()
    this.kit.stop()
  }
}

export class LedgerConnector extends AbstractConnector {
  private kit: LedgerKit | null = null
  private index: number | null = null

  constructor(connectedKit?: { kit: LedgerKit; index: number }) {
    super({ supportedChainIds: [NETWORK_CHAIN_ID] })
    if (connectedKit) {
      this.kit = connectedKit.kit
      this.index = connectedKit.index
    }
  }

  public async activate(): Promise<ConnectorUpdate> {
    if (this.kit && this.index !== null) {
      return {
        provider: this.kit.kit.web3.currentProvider,
        chainId: NETWORK_CHAIN_ID,
        account: this.kit.wallet.getAccounts()[this.index]
      }
    }
    const idxs = [0, 1, 2, 3, 4]
    const ledgerKit = await LedgerKit.init(NETWORK_CHAIN_ID, idxs)
    this.kit = ledgerKit
    return {
      provider: ledgerKit.kit.web3.currentProvider,
      chainId: NETWORK_CHAIN_ID,
      account: ledgerKit.wallet.getAccounts()[0]
    }
  }

  public async getProvider(): Promise<any> {
    return this.kit?.kit.web3.currentProvider ?? null
  }

  public async getChainId(): Promise<number> {
    return NETWORK_CHAIN_ID
  }

  public async getAccount(): Promise<string | null> {
    return this.kit?.wallet.getAccounts()?.[0] ?? null
  }

  public deactivate() {
    this.kit?.close()
  }

  async close() {
    this.kit?.close()
    this.kit = null
    this.emitDeactivate()
  }
}
