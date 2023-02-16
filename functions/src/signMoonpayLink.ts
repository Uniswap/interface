import cors from 'cors'
import * as crypto from 'crypto'
import * as functions from 'firebase-functions'
import { URL } from 'url'

const corsHandler = cors({
  origin: [/localhost:(?:\d{0,5})$/, /\.uniswap\.(org|com)$/, /\.vercel\.app$/],
})

/**
 * @param {object} params Object of query params
 * @return {string} A serialized string of query params
 */
function serializeQueryParams(
  params: Record<string, Parameters<typeof encodeURIComponent>[0]>
): string {
  const queryString: string[] = []
  for (const [param, paramValue] of Object.entries(params)) {
    queryString.push(`${encodeURIComponent(param)}=${encodeURIComponent(paramValue)}`)
  }
  return queryString.join('&')
}

export const signMoonpayLink = functions
  .runWith({
    secrets: [
      'MOONPAY_API_KEY',
      'MOONPAY_SECRET_KEY',
      'MOONPAY_PUBLISHABLE_KEY_WEB',
      'MOONPAY_SECRET_KEY_WEB',
    ],
  })
  // TODO: [MOB-3862] type request params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  .https.onRequest((request: functions.Request<any>, response: functions.Response<unknown>) => {
    corsHandler(request, response, () => {
      const platform = request.query.platform

      const { MOONPAY_URL } = process.env
      let { MOONPAY_API_KEY, MOONPAY_SECRET_KEY } = process.env
      if (platform && platform === 'web') {
        MOONPAY_API_KEY = process.env.MOONPAY_PUBLISHABLE_KEY_WEB
        MOONPAY_SECRET_KEY = process.env.MOONPAY_SECRET_KEY_WEB
      }

      const {
        baseCurrencyAmount,
        colorCode,
        currencyCode,
        defaultCurrencyCode,
        externalTransactionId,
        externalCustomerId,
        redirectURL,
        theme,
        walletAddress,
        walletAddresses,
      } = request.body

      const url = `${MOONPAY_URL}?`.concat(
        serializeQueryParams({
          apiKey: MOONPAY_API_KEY ?? '',
          baseCurrencyAmount,
          colorCode,
          currencyCode,
          defaultCurrencyCode,
          externalTransactionId,
          externalCustomerId,
          redirectURL,
          theme,
          walletAddress,
          walletAddresses,
        })
      )

      console.log(`Requested signature for: ${url}`)

      const signature = crypto
        .createHmac('sha256', MOONPAY_SECRET_KEY ?? '')
        .update(new URL(url).search)
        .digest('base64')

      const urlWithSignature = `${url}&signature=${encodeURIComponent(signature)}`

      console.log(`Returning signed URL: ${urlWithSignature}`)
      response.send(JSON.stringify({ url: urlWithSignature }))
    })
  })
