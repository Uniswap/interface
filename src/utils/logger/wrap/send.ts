/***
 * Logs a timing for every JSON-RPC triggered by a logged timing (by monkey-patching JsonRpcProvider).
 */

import { JsonRpcProvider } from '@ethersproject/providers'

import { wrap } from '..'

const JsonRpcProviderSend = JsonRpcProvider.prototype.send
JsonRpcProvider.prototype.send = function LoggingAwareSend(this, method, params) {
  let data = { method, params }
  if (method === 'eth_call') {
    // TODO(zzmp): Maintain a map of known contracts/method names.
    // Trim the calldata to the method hash.
    const methodHash = (params[0].data as string).substring(0, 10)
    data = { method, params: { ...params, [0]: { ...params[0], data: methodHash } } }
  }

  return wrap(method, () => JsonRpcProviderSend.call(this, method, params), { squelch: true, data })
}
