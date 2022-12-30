import { BytesLike } from "@ethersproject/bytes";
import { BaseContract } from "@ethersproject/contracts";

import MetamocksContext from "./context";
import { AbiHandlerInterface, BaseHandlerInterface } from "./types";
import { decodeFunctionCall, encodeFunctionResult } from "./utils/abi";

export default class BaseAbiHandler<T extends BaseContract>
  implements BaseHandlerInterface
{
  abi: any[] = [];
  context: MetamocksContext;

  constructor(context: MetamocksContext, abi?: any[]) {
    this.context = context;
    if (abi) {
      this.abi = abi;
    }
  }

  async handleCall(data: BytesLike, setResult?: (result: string) => void) {
    console.log("handleCall called");
    const decoded = decodeFunctionCall(this.abi, data);
    console.log({ decoded });
    const res: any = await (this as unknown as AbiHandlerInterface<T>)[
      decoded.method
    ](...decoded.inputs);
    console.log({ res });
    const isLikeArray = (obj: any) =>
      obj[0] !== undefined && typeof obj !== "string";

    const filterArray = (arr: any[]): any[] => {
      if (!isLikeArray(arr)) return arr;
      const a: any[] = [];
      let i = 0;
      while (arr[i] !== undefined) {
        a.push(filterArray(arr[i]));
        i++;
      }
      return a;
    };
    try {
      console.log(
        encodeFunctionResult(
          this.abi,
          decoded.method as string,
          isLikeArray(res) ? filterArray(res) : [res]
        )
      );
    } catch (e) {
      console.log(e);
    }
    if (setResult) {
      setResult(
        encodeFunctionResult(
          this.abi,
          decoded.method as string,
          isLikeArray(res) ? filterArray(res) : [res]
        )
      );
    }
  }

  async handleTransaction(data: BytesLike, setResult: (arg0: string) => void) {
    await this.handleCall(data);
    setResult(this.context.getFakeTransactionHash());
  }
}
