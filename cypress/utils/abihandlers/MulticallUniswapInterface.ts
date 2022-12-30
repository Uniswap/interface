import { BigNumber } from "@ethersproject/bignumber";
import MulticallJson from "@uniswap/v3-periphery/artifacts/contracts/lens/UniswapInterfaceMulticall.sol/UniswapInterfaceMulticall.json";
import { CallOverrides } from "ethers";
import { AbiHandler, AbiHandlerInterface, isTheSameAddress } from "metamocks";

import { UniswapInterfaceMulticall } from "../../../src/types/v3";

const { abi: MulticallABI } = MulticallJson;

export default class MulticallUniswapAbiHandler
  extends AbiHandler<UniswapInterfaceMulticall>
  implements AbiHandlerInterface<UniswapInterfaceMulticall>
{
  abi = MulticallABI;

  getCurrentBlockTimestamp(
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    return Promise.resolve(BigNumber.from(1672356726));
  }

  getEthBalance(
    addr: string,
    overrides: CallOverrides | undefined
  ): Promise<BigNumber> {
    return Promise.resolve(BigNumber.from(10).pow(22));
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
    console.log("multicalllllll");
    const results: UniswapInterfaceMulticall.ResultStructOutput[] = [];
    for (const call of calls) {
      const { target, gasLimit, callData } = call;
      console.log("call");
      console.log(call);
      let returnData =
        "0x0000000000000000000000000000000000000000000000000000000000000000";
      for (const contractAddress in this.context.handlers) {
        if (isTheSameAddress(contractAddress, target)) {
          try {
            await this.context.handlers[contractAddress].handleCall(
              callData,
              (r: string) => {
                returnData = r;
              }
            );
          } catch (e) {
            console.error(e);
          }
        }
      }
      const success =
        returnData !==
        "0x0000000000000000000000000000000000000000000000000000000000000000";
      const res = Object.assign(
        {
          success,
          gasUsed: BigNumber.from(gasLimit),
          returnData,
        },
        [success, BigNumber.from(gasLimit), returnData]
      ) as UniswapInterfaceMulticall.ResultStructOutput;
      console.log({ ressss: res });
      results.push(res);
      console.log("call handled");
    }
    console.log({ results });
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
