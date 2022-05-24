import { decodeEthCall, encodeEthResult } from './abiutils'
import { CustomizedBridgeContext } from './CustomizedBridge'

export class AbiHandler {
  abi = {}

  async handleCall(context: CustomizedBridgeContext, data: string, setResult?: (arg0: string) => void) {
    const decoded = decodeEthCall(this.abi, data)
    if (decoded.method === 'multicall') {
      const [deadline, [data]] = decoded.inputs
      await this.handleCall(context, data, setResult)
      return
    }
    // @ts-ignore
    if (this[decoded.method]) {
      // @ts-ignore
      const res = await this[decoded.method](context, decoded.inputs)
      setResult?.(encodeEthResult(this.abi, decoded.method, res))
    }
  }

  async handleTransaction(context: CustomizedBridgeContext, data: string, setResult: (arg0: string) => void) {
    await this.handleCall(context, data)
    setResult(context.getFakeTransactionHash())
  }
}
