/**
 * Fixtures are pulled from real error messages with redacted details
 */

const nonceError = `processing response error (body="{\"jsonrpc\":\"2.0\",\"id\":107,\"error\":{\"code\":-32000,\"message\":\"gapped-nonce tx from delegated accounts\"}}", error={"code":-32000}, requestBody="{\"method\":\"eth_sendRawTransactionSync\",\"params\":[\"...\"],\"id\":107,\"jsonrpc\":\"2.0\"}", requestMethod="POST", url="...", code=SERVER_ERROR, version=web/5.7.1)`

const missingResponseBody =
  'missing response (requestBody="{\"method\":\"eth_blockNumber\",\"params\":[],\"id\":46,\"jsonrpc\":\"2.0\"}", requestMethod="POST", serverError={}, url="...", code=SERVER_ERROR, version=web/5.7.1)'

const txLimitReachedForDelegatedAccount =
  'processing response error (body="{\"jsonrpc\":\"2.0\",\"id\":116,\"error\":{\"code\":-32000,\"message\":\"in-flight transaction limit reached for delegated accounts\"}}\n", error={"code":-32000}, requestBody="{\"method\":\"eth_sendRawTransaction\",\"params\":[\"...\"],\"id\":116,\"jsonrpc\":\"2.0\"}", requestMethod="POST", url="...", code=SERVER_ERROR, version=web/5.7.1)'

const timeout =
  'timeout (requestBody="{\"method\":\"eth_sendRawTransaction\",\"params\":[\"...\"],\"id\":165,\"jsonrpc\":\"2.0\"}", requestMethod="POST", timeout=120000, url="...", code=TIMEOUT, version=web/5.7.1)'

const confirmationTimeout =
  'processing response error (body="{\"jsonrpc\":\"2.0\",\"id\":305,\"error\":{\"code\":4,\"message\":\"Transaction ... was added to the mempool but wasn\'t confirmed within 6s.\"}}", error={"code":4}, requestBody="{\"method\":\"eth_sendRawTransactionSync\",\"params\":[\"...\"],\"id\":305,\"jsonrpc\":\"2.0\"}", requestMethod="POST", url="...", code=SERVER_ERROR, version=web/5.7.1)'

const noNetwork = 'could not detect network (event="noNetwork", code=NETWORK_ERROR, version=providers/5.7.2)'

const cannotReadProperty1 = "Cannot read properties of null (reading 'to')"
const cannotReadProperty2 = 'Cannot convert null value to object'

const insufficientFunds1 =
  'Missing or invalid parameters.\nDouble check you have provided the correct parameters.\nURL: ...\nRequest body: {"method":"eth_sendRawTransaction","params":["..."]}\nDetails: insufficient funds for gas * price + value: balance 6173587363950832, tx cost 6253742649427800, overshot 80155285476968\nVersion: viem@2.30.5'
const insufficientFunds2 =
  'insufficient funds for intrinsic transaction cost [ See: https://links.ethers.org/v5-errors-INSUFFICIENT_FUNDS ] (error={"reason":"processing response error","code":"SERVER_ERROR","body":"{\"jsonrpc\":\"2.0\",\"id\":60,\"error\":{\"code\":-32000,\"message\":\"insufficient funds for gas * price + value: balance 48004520658901, tx cost 50506500000000, overshot 2501979341099\"}}\n","error":{"code":-32000},"requestBody":"{\"method\":\"eth_sendRawTransaction\",\"params\":[\"...\"],\"id\":60,\"jsonrpc\":\"2.0\"}","requestMethod":"POST","url":"..."}, method="sendTransaction", transaction="...", code=INSUFFICIENT_FUNDS, version=providers/5.7.2)'
const insufficientFunds3 =
  'processing response error (body="{\"jsonrpc\":\"2.0\",\"id\":88,\"error\":{\"code\":-32003,\"message\":\"insufficient funds for gas * price + value: have 750000000000 want 966580125428\"}}", error={"code":-32003}, requestBody="{\"method\":\"eth_sendRawTransactionSync\",\"params\":[\"...\"],\"id\":88,\"jsonrpc\":\"2.0\"}", requestMethod="POST", url="...", code=SERVER_ERROR, version=web/5.7.1)'
const gasTooLow =
  'replacement fee too low [ See: https://links.ethers.org/v5-errors-REPLACEMENT_UNDERPRICED ] (error={"reason":"processing response error","code":"SERVER_ERROR","body":"{\"jsonrpc\":\"2.0\",\"id\":159,\"error\":{\"code\":-32000,\"message\":\"replacement transaction underpriced\"}}\n","error":{"code":-32000},"requestBody":"{\"method\":\"eth_sendRawTransaction\",\"params\":[\"...\"],\"id\":159,\"jsonrpc\":\"2.0\"}","requestMethod":"POST","url":"..."}, method="sendTransaction", transaction="...", code=REPLACEMENT_UNDERPRICED, version=providers/5.7.2)'

const invalidDataValue = 'Invalid data value: undefined'

const reverted = 'Failed in pending block with: Reverted'
const instrinsicGasTooLow = 'intrinsic gas too low'

const badGateway =
  'bad response (status=502, headers={"cache-control":"private, max-age=0, no-store, no-cache, must-revalidate, post-check=0, pre-check=0","cf-ray":"972b0c808fb771f8-LHR","content-length":"15","content-type":"text/plain; charset=UTF-8","date":"Thu, 21 Aug 2025 15:08:58 GMT","expires":"Thu, 01 Jan 1970 00:00:01 GMT","referrer-policy":"same-origin","server":"cloudflare","x-frame-options":"SAMEORIGIN"}, body="error code: 502", requestBody="{\"method\":\"eth_sendRawTransaction\",\"params\":[\"...\"],\"id\":49,\"jsonrpc\":\"2.0\"}", requestMethod="POST", url="...", code=SERVER_ERROR, version=web/5.7.1)'

const rateLimited1 = 'Response status: 429'
const rateLimited2 = 'Too Many Requests'

export const rpcUtilsFixtures = {
  nonceError,
  insufficientFunds1,
  insufficientFunds2,
  insufficientFunds3,
  missingResponseBody,
  txLimitReachedForDelegatedAccount,
  timeout,
  confirmationTimeout,
  noNetwork,
  cannotReadProperty1,
  cannotReadProperty2,
  gasTooLow,
  reverted,
  invalidDataValue,
  instrinsicGasTooLow,
  badGateway,
  rateLimited1,
  rateLimited2,
}
