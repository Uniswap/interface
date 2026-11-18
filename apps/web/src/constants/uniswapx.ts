/**
 * UniswapX order service (nonce, order and limit-order submission, order status), served by the legacy
 * `api.uniswap.org/v2` API Gateway. The Entry Gateway has no UniswapX routes yet. Every environment uses
 * production: these are real on-chain orders, and staging builds already pointed here.
 */
export const UNISWAPX_API_URL = 'https://api.uniswap.org/v2'
