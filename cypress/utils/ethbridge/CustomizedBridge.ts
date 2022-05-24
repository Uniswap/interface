// ***********************************************
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

import { BigNumber } from '@ethersproject/bignumber/lib.esm'
import { Eip1193Bridge } from '@ethersproject/experimental/lib/eip1193-bridge'

import { SupportedChainId } from '../../../src/constants/chains'
import { TEST_ADDRESS_NEVER_USE } from '../data'
import {
  fakeBlockByNumberResponse,
  fakeTransactionByHashResponse,
  fakeTransactionReceipt,
  latestBlock,
} from '../fake_tx_data'
import { AbiHandler } from './AbiHandler'
import { formatChainId, keccak256 } from './abiutils'

function isTheSameAddress(address1: string, address2: string) {
  return address1.toLowerCase() === address2.toLowerCase()
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class CustomizedBridgeContext {
  chainId = SupportedChainId.RINKEBY

  latestBlockNumber = 1
  fakeTransactionIndex = 0
  handlers: { [key: string]: AbiHandler } = {}

  getLatestBlock() {
    this.latestBlockNumber++
    return Object.assign(latestBlock, {
      number: this.latestBlockNumber,
    })
  }

  getFakeTransactionHash() {
    return keccak256([this.fakeTransactionIndex++])
  }

  setHandler(address: string, handler: AbiHandler) {
    this.handlers[address] = handler
  }
}

export class CustomizedBridge extends Eip1193Bridge {
  context = new CustomizedBridgeContext()

  setHandler(address: string, handler: AbiHandler) {
    this.context.setHandler(address, handler)
  }

  async sendAsync(...args: any[]) {
    console.debug('sendAsync called', ...args)
    return this.send(...args)
  }

  getSendArgs(args: any[]) {
    console.debug('send called', ...args)
    const isCallbackForm = typeof args[0] === 'object' && typeof args[1] === 'function'
    let callback
    let method
    let params
    if (isCallbackForm) {
      callback = args[1]
      method = args[0].method
      params = args[0].params
    } else {
      method = args[0]
      params = args[1]
    }
    return {
      isCallbackForm,
      callback,
      method,
      params,
    }
  }

  async send(...args: any[]) {
    const { isCallbackForm, callback, method, params } = this.getSendArgs(args)
    let result = null
    let resultIsSet = false

    function setResult(r: any) {
      result = r
      resultIsSet = true
    }

    if (method === 'eth_requestAccounts' || method === 'eth_accounts') {
      setResult([TEST_ADDRESS_NEVER_USE])
    }
    if (method === 'eth_chainId') {
      setResult(formatChainId(String(this.context.chainId)))
    }
    if (method === 'eth_estimateGas') {
      setResult('0xba7f')
    }
    if (method === 'eth_getBlockByNumber') {
      if (params[0] === 'latest') {
        setResult(this.context.getLatestBlock())
      } else {
        const [blockNumber, returnFullHashes] = params
        setResult(
          Object.assign(fakeBlockByNumberResponse, {
            number: BigNumber.from(blockNumber).toNumber(),
          })
        )
      }
    }
    if (method === 'eth_getTransactionByHash') {
      const [transactionHash] = params
      setResult(
        Object.assign(fakeTransactionByHashResponse, {
          hash: transactionHash,
        })
      )
    }
    if (method === 'eth_getTransactionReceipt') {
      const [transactionHash] = params
      const latestBlock = this.context.getLatestBlock()
      const resultLocal = Object.assign(fakeTransactionReceipt, {
        transactionHash,
        blockHash: latestBlock.hash,
        blockNumber: latestBlock.number,
        logs: fakeTransactionReceipt.logs.map((log) => Object.assign(log, transactionHash)),
      })
      setResult(resultLocal)
    }
    // if (method === 'eth_blockNumber') {
    //   setResult(this.context.getLatestBlock().number)
    // }
    if (method === 'eth_call') {
      for (const contractAddress in this.context.handlers) {
        if (isTheSameAddress(contractAddress, params[0].to)) {
          await this.context.handlers[contractAddress].handleCall(this.context, params[0].data, setResult)
        }
      }
    }

    if (method === 'eth_sendTransaction') {
      for (const contractAddress in this.context.handlers) {
        if (isTheSameAddress(contractAddress, params[0].to)) {
          await this.context.handlers[contractAddress].handleTransaction(this.context, params[0].data, setResult)
        }
      }
    }

    if (resultIsSet) {
      if (isCallbackForm) {
        callback(null, { result })
      } else {
        return result
      }
    }

    try {
      const result = await super.send(method, params)
      if (isCallbackForm) {
        callback(null, { result })
      } else {
        return result
      }
    } catch (error) {
      if (isCallbackForm) {
        callback(error, null)
      } else {
        throw error
      }
    }
  }
}
