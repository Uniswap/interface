/**
 * Traces all JsonRpc requests as spans, reporting them if there is an active transaction.
 * This is analagous to import("@sentry/tracing").BrowserTracingOptions.shouldCreateSpanForRequest.
 *
 * This works because there is only one copy of @ethersproject/providers, and web3-react wraps any external (EIP-1193)
 * provider in that prototype - overriding the prototype will override send for all instances.
 */
import { JsonRpcProvider } from '@ethersproject/providers'
import * as Sentry from '@sentry/react'

const JsonRpcProviderSend = JsonRpcProvider.prototype.send
JsonRpcProvider.prototype.send = async function LoggingAwareSend(this, method, params) {
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction()
  if (!transaction) return JsonRpcProviderSend.call(this, method, params)

  let data = { method, params }
  if (method === 'eth_call') {
    // TODO(zzmp): Maintain a map of known contracts/method names.
    // Trim the calldata to the method hash.
    const methodHash = (params[0].data as string).substring(0, 10)
    data = { method, params: { ...params, [0]: { ...params[0], data: methodHash } } }
  }
  const span = transaction.startChild({ op: 'jsonRpc.send', data })

  try {
    const result = await JsonRpcProviderSend.call(this, method, params)
    return result
  } catch (error) {
    span.setData('error', error)
    span.setStatus('unknown_error')
  } finally {
    span.finish()
  }
}
