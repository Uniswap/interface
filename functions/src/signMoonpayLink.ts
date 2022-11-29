import * as crypto from 'crypto'
import * as functions from 'firebase-functions'
import { URL } from 'url'

/**
 * @param {object} params Object of query params
 * @return {string} A serialized string of query params
 */
function serializeQueryParams(params: Record<string, Parameters<typeof encodeURIComponent>[0]>) {
  const queryString = []
  for (const param in params) {
    if (params[param]) {
      queryString.push(`${encodeURIComponent(param)}=${encodeURIComponent(params[param])}`)
    }
  }
  return queryString.join('&')
}

export const signMoonpayLink = functions
  .runWith({ secrets: ['MOONPAY_API_KEY', 'MOONPAY_SECRET_KEY'] })
  .https.onRequest((request: functions.Request<any>, response: functions.Response<any>) => {
    const { MOONPAY_URL, MOONPAY_API_KEY, MOONPAY_SECRET_KEY } = process.env

    const {
      baseCurrencyAmount,
      colorCode,
      currencyCode,
      defaultCurrencyCode,
      externalTransactionId,
      externalCustomerId,
      redirectURL,
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
