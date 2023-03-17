/**
 * Traces all JsonRpc requests as spans, reporting them if there is an active transaction.
 * This is analagous to import("@sentry/tracing").BrowserTracingOptions.shouldCreateSpanForRequest.
 *
 * This is able to collect all requests because there is only one copy of @ethersproject/providers, and web3-react wraps
 * any external (EIP-1193) provider in that prototype - overriding the prototype will override send for all instances.
 */
import { JsonRpcProvider } from '@ethersproject/providers'

import { maybeTrace } from './trace'

const jsonRpcProviderSend = JsonRpcProvider.prototype.send
JsonRpcProvider.prototype.send = async function LoggingAwareSend(this, method, params) {
  maybeTrace('json_rpc', async ({ setTraceData }) => {
    setTraceData('method', method)
    if (method === 'eth_call') {
      // Trim the calldata to the method hash (10 chars) to avoid recording large payloads and sensitive information.
      const methodHash = (params[0].data as string).substring(0, 10)
      // Override the calldata with the method hash, which is part of the first param.
      setTraceData('params', { ...params, [0]: { ...params[0], data: methodHash } })
    } else {
      setTraceData('params', params)
    }
    return jsonRpcProviderSend.call(this, method, params)
  })
}
