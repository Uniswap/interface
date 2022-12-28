import { BaseContract } from '@ethersproject/contracts';

import { latestBlock } from './fake-tx-data';
import { AbiHandlerInterface } from './types';
import { formatChainId } from './utils/abi';
import { keccak256 } from '@ethersproject/keccak256'

export default class MetamocksContext {
  chainId: string;
  supportedChainIds: string[];
  latestBlockNumber = 1;
  fakeTransactionIndex = 0;
  handlers: { [key: string]: AbiHandlerInterface<BaseContract> } = {};

  constructor(chainId: number, supportedChainIds?: number[]) {
    this.chainId = formatChainId(String(chainId));
    this.supportedChainIds = supportedChainIds?.map((cid) => formatChainId(String(cid))) || [this.chainId];
  }

  getLatestBlock() {
    this.latestBlockNumber++;
    return Object.assign(latestBlock, {
      number: this.latestBlockNumber,
    });
  }

  getFakeTransactionHash() {
    return keccak256([this.fakeTransactionIndex++]);
  }

  setHandler(address: string, handler: AbiHandlerInterface<BaseContract>) {
    this.handlers[address] = handler;
  }
}
