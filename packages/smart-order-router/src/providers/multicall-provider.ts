import { Interface } from '@ethersproject/abi';
import { BigNumber } from '@ethersproject/bignumber';

import { ProviderConfig } from './provider';

export type CallSameFunctionOnMultipleContractsParams<
  TFunctionParams,
  TAdditionalConfig = any
> = {
  addresses: string[];
  contractInterface: Interface;
  functionName: string;
  functionParams?: TFunctionParams;
  providerConfig?: ProviderConfig;
  additionalConfig?: TAdditionalConfig;
};

export type CallSameFunctionOnContractWithMultipleParams<
  TFunctionParams,
  TAdditionalConfig = any
> = {
  address: string;
  contractInterface: Interface;
  functionName: string;
  functionParams: TFunctionParams[];
  providerConfig?: ProviderConfig;
  additionalConfig?: TAdditionalConfig;
};

export type CallMultipleFunctionsOnSameContractParams<
  TFunctionParams,
  TAdditionalConfig = any
> = {
  address: string;
  contractInterface: Interface;
  functionNames: string[];
  functionParams?: TFunctionParams[];
  providerConfig?: ProviderConfig;
  additionalConfig?: TAdditionalConfig;
};

export type SuccessResult<TReturn> = {
  success: true;
  result: TReturn;
};

export type FailResult = {
  success: false;
  returnData: string;
};

export type Result<TReturn> = SuccessResult<TReturn> | FailResult;

/**
 * Provider for fetching data on chain using multicall contracts.
 *
 * @export
 * @abstract
 * @class IMulticallProvider
 * @template TMulticallConfig
 */
export abstract class IMulticallProvider<TMulticallConfig = any> {
  /**
   * Calls the same function on multiple contracts.
   *
   * For example, if you wanted to get the ERC-20 balance of 10 different tokens
   * this can be used to call balance on the 10 contracts in a single multicall.
   *
   * @abstract
   * @template TFunctionParams
   * @template TReturn
   * @param params
   * @returns {*}
   */
  public abstract callSameFunctionOnMultipleContracts<
    TFunctionParams extends any[] | undefined,
    TReturn = any
  >(
    params: CallSameFunctionOnMultipleContractsParams<
      TFunctionParams,
      TMulticallConfig
    >
  ): Promise<{
    blockNumber: BigNumber;
    results: Result<TReturn>[];
  }>;

  /**
   * Calls a function on a single contract with different parameters.
   *
   * For example, if you wanted to call the Uniswap V3 Quoter with 10 different
   * swap amounts this can be used to make the calls in a single multicall.
   *
   * @abstract
   * @template TFunctionParams
   * @template TReturn
   * @param params
   * @returns {*}
   */
  public abstract callSameFunctionOnContractWithMultipleParams<
    TFunctionParams extends any[] | undefined,
    TReturn = any
  >(
    params: CallSameFunctionOnContractWithMultipleParams<
      TFunctionParams,
      TMulticallConfig
    >
  ): Promise<{
    blockNumber: BigNumber;
    results: Result<TReturn>[];
  }>;

  public abstract callMultipleFunctionsOnSameContract<
    TFunctionParams extends any[] | undefined,
    TReturn = any
  >(
    params: CallMultipleFunctionsOnSameContractParams<
      TFunctionParams,
      TMulticallConfig
    >
  ): Promise<{
    blockNumber: BigNumber;
    results: Result<TReturn>[];
  }>;
}
