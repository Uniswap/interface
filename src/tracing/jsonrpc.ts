/**
 * Traces all JsonRpc requests as spans, reporting them if there is an active transaction.
 * This is analagous to import("@sentry/tracing").BrowserTracingOptions.shouldCreateSpanForRequest.
 *
 * This is able to collect all requests because there is only one copy of @ethersproject/providers, and web3-react wraps
 * any external (EIP-1193) provider in that prototype - overriding the prototype will override send for all instances.
 */
import { JsonRpcProvider } from '@ethersproject/providers'

import { maybeTrace } from './trace'

const JsonRpcProviderSend = JsonRpcProvider.prototype.send
JsonRpcProvider.prototype.send = async function LoggingAwareSend(this, method, params) {
  maybeTrace('jsonRpc.send', async ({ setTraceData }) => {
    setTraceData('method', method)
    if (method === 'eth_call') {
      // Trim the calldata to the method hash to avoid recording large payloads and sensitive information.
      const methodHash = (params[0].data as string).substring(0, 10)
      setTraceData('params', { ...params, [0]: { ...params[0], data: methodHash } })
    } else {
      setTraceData('params', params)
    }
    return JsonRpcProviderSend.call(this, method, params)
  })
}
