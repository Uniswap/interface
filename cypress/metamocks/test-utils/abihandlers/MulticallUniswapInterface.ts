import { BigNumber } from "@ethersproject/bignumber";
import MulticallJson from "@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json";
import { AbiHandler, AbiHandlerInterface, isTheSameAddress } from "../../index";

import { UniswapInterfaceMulticall } from "../abis/types/uniswap";
import { CallOverrides } from "ethers";

const { abi: MulticallABI } = MulticallJson;

export default class MulticallUniswapAbiHandler
  extends AbiHandler<UniswapInterfaceMulticall>
  implements AbiHandlerInterface<UniswapInterfaceMulticall>
{
  abi = MulticallABI;

  getCurrentBlockTimestamp(
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    throw new Error("Method not implemented.");
  }

  getEthBalance(
    addr: string,
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    throw new Error("Method not implemented.");
  }

  async multicall(
    calls: UniswapInterfaceMulticall.CallStruct[],
    overrides: CallOverrides | undefined
  ): Promise<
    [BigNumber, UniswapInterfaceMulticall.ResultStructOutput[]] & {
      blockNumber: BigNumber;
      returnData: UniswapInterfaceMulticall.ResultStructOutput[];
    }
  > {
    const results: UniswapInterfaceMulticall.ResultStructOutput[] = [];
    for (const call of calls) {
      const { target, gasLimit, callData } = call;
      for (const contractAddress in this.context.handlers) {
        if (isTheSameAddress(contractAddress, target)) {
          await this.context.handlers[contractAddress].handleCall(
            callData,
            (r: string) => {
              const res = Object.assign(
                {
                  success: true,
                  gasUsed: BigNumber.from(gasLimit),
                  returnData: r,
                },
                [true, BigNumber.from(gasLimit), r]
              ) as UniswapInterfaceMulticall.ResultStructOutput;
              results.push(res);
            }
          );
        }
      }
    }
    return Object.assign(
      {
        blockNumber: BigNumber.from(this.context.getLatestBlock().number),
        returnData: results,
      },
      [BigNumber.from(this.context.getLatestBlock().number), results]
    ) as [BigNumber, UniswapInterfaceMulticall.ResultStructOutput[]] & {
      blockNumber: BigNumber;
      returnData: UniswapInterfaceMulticall.ResultStructOutput[];
    };
  }
}
/*

  async multicall(decodedInput: any[]) {
    const [calls] = decodedInput;
    const results: any[] = [];
    for (const call of calls) {
      const [callAddress, gasEstimated, callInput] = call;
      for (const contractAddress in this.context.handlers) {
        if (isTheSameAddress(contractAddress, callAddress)) {
          await this.context.handlers[contractAddress].handleCall(
            callInput,
            (r: string) => results.push([true, gasEstimated, r])
          );
        }
      }
    }
    return [this.context.getLatestBlock().number, results];
  }

 */
