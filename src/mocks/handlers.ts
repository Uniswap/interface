import { rest } from 'msw'

export const BLOCKED_ADDRESS = '0x3e3Da032591d4471E7Ca1a6d588D64bC36e232f4'
const SIGNED_URL =
  'https://buy.moonpay.com?apiKey=pk_live_uQG4BJC4w3cxnqpcSqAfohdBFDTsY6E&colorCode=%234C82FB&defaultCurrencyCode=eth&walletAddresses=%7B%22eth%22%3A%220x48c89D77ae34Ae475e4523b25aB01e363dce5A78%22%2C%22eth_arbitrum%22%3A%220x48c89D77ae34Ae475e4523b25aB01e363dce5A78%22%2C%22eth_optimism%22%3A%220x48c89D77ae34Ae475e4523b25aB01e363dce5A78%22%2C%22eth_polygon%22%3A%220x48c89D77ae34Ae475e4523b25aB01e363dce5A78%22%2C%22weth%22%3A%220x48c89D77ae34Ae475e4523b25aB01e363dce5A78%22%2C%22wbtc%22%3A%220x48c89D77ae34Ae475e4523b25aB01e363dce5A78%22%2C%22matic_polygon%22%3A%220x48c89D77ae34Ae475e4523b25aB01e363dce5A78%22%2C%22polygon%22%3A%220x48c89D77ae34Ae475e4523b25aB01e363dce5A78%22%2C%22usdc_arbitrum%22%3A%220x48c89D77ae34Ae475e4523b25aB01e363dce5A78%22%2C%22usdc_optimism%22%3A%220x48c89D77ae34Ae475e4523b25aB01e363dce5A78%22%2C%22usdc_polygon%22%3A%220x48c89D77ae34Ae475e4523b25aB01e363dce5A78%22%7D&signature=0lqJLvlq2eGU%2B9KX8m7JluBQWOSAly4FGIjbBThQfx8%3D'

export const handlers = [
  rest.get(
    'https://temp.api.uniswap.org/v1/nft/rewards/0x3e3Da032591d4471E7Ca1a6d588D64bC36e232f4',
    (_req, res, ctx) => {
      return res(ctx.json({ data: [] }))
    }
  ),
  rest.post('https://screening-worker.uniswap.workers.dev', async (req, res, ctx) => {
    try {
      const { address } = await req.json()
      return res(ctx.json({ block: address === BLOCKED_ADDRESS }))
    } catch (e) {
      return res(ctx.json({}))
    }
  }),
  rest.post('https://us-central1-uniswap-mobile.cloudfunctions.net/signMoonpayLinkStaging', (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ url: SIGNED_URL }))
  }),
  rest.get('https://api.coinbase.com/v2/exchange-rates', (_req, res, ctx) => {
    return res(ctx.json({ data: { rates: { USD: 1 } } }))
  }),
]
