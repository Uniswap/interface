import { Token } from '@uniswap/sdk-core';
import _ from 'lodash';
import sinon from 'sinon';
import {
  CachingTokenListProvider,
  ChainId,
  NodeJSCache,
  USDC_MAINNET as USDC,
} from '../../../src';
import { mockTokenList } from '../../test-util/mock-data';

describe('caching token list provider', () => {
  let mockCache: sinon.SinonStubbedInstance<NodeJSCache<Token>>;

  let cachingTokenListProvider: CachingTokenListProvider;

  beforeEach(async () => {
    mockCache = sinon.createStubInstance(NodeJSCache);

    cachingTokenListProvider = await CachingTokenListProvider.fromTokenList(
      ChainId.MAINNET,
      mockTokenList,
      mockCache
    );
  });

  describe('get tokens by address', () => {
    test('succeeds to get token and updates cache', async () => {
      const address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

      const token = await cachingTokenListProvider.getTokenByAddress(address);
      expect(token).toEqual(USDC);

      // Checks cache, then sets it with the token.
      sinon.assert.calledOnce(mockCache.get);
      sinon.assert.calledOnce(mockCache.set);
    });

    test('fails to get token that is in token list but not on the selected chain', async () => {
      const nonMainnetToken = _.filter(
        mockTokenList.tokens,
        (token) => token.chainId != ChainId.MAINNET
      )![0];
      const address = nonMainnetToken!.address;

      const token = await cachingTokenListProvider.getTokenByAddress(address);
      expect(token).toBeUndefined();

      sinon.assert.notCalled(mockCache.get);
      sinon.assert.notCalled(mockCache.set);
    });

    test('succeeds for any chain id', async () => {
      cachingTokenListProvider = await CachingTokenListProvider.fromTokenList(
        777,
        mockTokenList,
        mockCache
      );

      const token = await cachingTokenListProvider.getTokenByAddress(
        '0x577D296678535e4903D59A4C929B718e1D575e0A'
      );
      expect(token).toBeDefined();
      expect(token!.symbol!).toEqual('WBTC');

      // Checks cache, then sets it with the token.
      sinon.assert.calledOnce(mockCache.get);
      sinon.assert.calledOnce(mockCache.set);
    });

    test('succeeds and is non case sensistive', async () => {
      const address =
        '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'.toLowerCase();

      const token = await cachingTokenListProvider.getTokenByAddress(address);
      expect(token).toEqual(USDC);

      // Checks cache, then sets it with the token.
      sinon.assert.calledOnce(mockCache.get);
      sinon.assert.calledOnce(mockCache.set);
    });

    test('succeeds to get token from cache', async () => {
      const address = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

      mockCache.get
        .onFirstCall()
        .resolves(undefined)
        .onSecondCall()
        .resolves(USDC);

      await cachingTokenListProvider.getTokenByAddress(address);
      await cachingTokenListProvider.getTokenByAddress(address);

      mockCache.get.alwaysCalledWith(
        `token-list-token-1/Tokens/2021-01-05T20:47:02.923Z/1/${address.toLowerCase()}/6/USDC/USDC`
      );

      sinon.assert.calledTwice(mockCache.get);
      sinon.assert.calledOnce(mockCache.set);
    });
  });
});
