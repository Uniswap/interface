import { Token } from '@uniswap/sdk-core';
import _ from 'lodash';

import { ITokenValidator__factory } from '../types/other/factories/ITokenValidator__factory';
import { ChainId, log, WRAPPED_NATIVE_CURRENCY } from '../util';

import { ICache } from './cache';
import { IMulticallProvider } from './multicall-provider';
import { ProviderConfig } from './provider';

const DEFAULT_ALLOWLIST = new Set<string>([
  // RYOSHI. Does not allow transfers between contracts so fails validation.
  '0x777E2ae845272a2F540ebf6a3D03734A5a8f618e'.toLowerCase(),
]);

export enum TokenValidationResult {
  UNKN = 0,
  FOT = 1,
  STF = 2,
}

export interface TokenValidationResults {
  getValidationByToken(token: Token): TokenValidationResult | undefined;
}

const TOKEN_VALIDATOR_ADDRESS = '0xb5ee1690b7dcc7859771148d0889be838fe108e0';
const AMOUNT_TO_FLASH_BORROW = '1000';
const GAS_LIMIT_PER_VALIDATE = 1_000_000;

/**
 * Provider for getting token data.
 *
 * @export
 * @interface ITokenValidatorProvider
 */
export interface ITokenValidatorProvider {
  /**
   * Gets the token at each address. Any addresses that are not valid ERC-20 are ignored.
   *
   * @param addresses The token addresses to get.
   * @param [providerConfig] The provider config.
   * @returns A token accessor with methods for accessing the tokens.
   */
  validateTokens(
    tokens: Token[],
    providerConfig?: ProviderConfig
  ): Promise<TokenValidationResults>;
}

export class TokenValidatorProvider implements ITokenValidatorProvider {
  private CACHE_KEY = (chainId: ChainId, address: string) =>
    `token-${chainId}-${address}`;

  private BASES: string[];

  constructor(
    protected chainId: ChainId,
    protected multicall2Provider: IMulticallProvider,
    private tokenValidationCache: ICache<TokenValidationResult>,
    private tokenValidatorAddress = TOKEN_VALIDATOR_ADDRESS,
    private gasLimitPerCall = GAS_LIMIT_PER_VALIDATE,
    private amountToFlashBorrow = AMOUNT_TO_FLASH_BORROW,
    private allowList = DEFAULT_ALLOWLIST
  ) {
    this.BASES = [WRAPPED_NATIVE_CURRENCY[this.chainId]!.address];
  }

  public async validateTokens(
    tokens: Token[],
    providerConfig?: ProviderConfig
  ): Promise<TokenValidationResults> {
    const tokenAddressToToken = _.keyBy(tokens, 'address');
    const addressesRaw = _(tokens)
      .map((token) => token.address)
      .uniq()
      .value();

    const addresses: string[] = [];
    const tokenToResult: { [tokenAddress: string]: TokenValidationResult } = {};

    // Check if we have cached token validation results for any tokens.
    for (const address of addressesRaw) {
      if (
        await this.tokenValidationCache.has(
          this.CACHE_KEY(this.chainId, address)
        )
      ) {
        tokenToResult[address.toLowerCase()] =
          (await this.tokenValidationCache.get(
            this.CACHE_KEY(this.chainId, address)
          ))!;
      } else {
        addresses.push(address);
      }
    }

    log.info(
      `Got token validation results for ${
        addressesRaw.length - addresses.length
      } tokens from cache. Getting ${addresses.length} on-chain.`
    );

    const functionParams = _(addresses)
      .map((address) => [address, this.BASES, this.amountToFlashBorrow])
      .value() as [string, string[], string][];

    // We use the validate function instead of batchValidate to avoid poison pill problem.
    // One token that consumes too much gas could cause the entire batch to fail.
    const multicallResult =
      await this.multicall2Provider.callSameFunctionOnContractWithMultipleParams<
        [string, string[], string], // address, base token addresses, amount to borrow
        [number]
      >({
        address: this.tokenValidatorAddress,
        contractInterface: ITokenValidator__factory.createInterface(),
        functionName: 'validate',
        functionParams: functionParams,
        providerConfig,
        additionalConfig: {
          gasLimitPerCallOverride: this.gasLimitPerCall,
        },
      });

    for (let i = 0; i < multicallResult.results.length; i++) {
      const resultWrapper = multicallResult.results[i]!;
      const tokenAddress = addresses[i]!;
      const token = tokenAddressToToken[tokenAddress]!;

      if (this.allowList.has(token.address.toLowerCase())) {
        tokenToResult[token.address.toLowerCase()] = TokenValidationResult.UNKN;

        await this.tokenValidationCache.set(
          this.CACHE_KEY(this.chainId, token.address.toLowerCase()),
          tokenToResult[token.address.toLowerCase()]!
        );

        continue;
      }

      // Could happen if the tokens transfer consumes too much gas so we revert. Just
      // drop the token in that case.
      if (!resultWrapper.success) {
        log.info(
          { result: resultWrapper },
          `Failed to validate token ${token.symbol}`
        );

        continue;
      }

      const validationResult = resultWrapper.result[0]!;

      tokenToResult[token.address.toLowerCase()] =
        validationResult as TokenValidationResult;

      await this.tokenValidationCache.set(
        this.CACHE_KEY(this.chainId, token.address.toLowerCase()),
        tokenToResult[token.address.toLowerCase()]!
      );
    }

    return {
      getValidationByToken: (token: Token) =>
        tokenToResult[token.address.toLowerCase()],
    };
  }
}
