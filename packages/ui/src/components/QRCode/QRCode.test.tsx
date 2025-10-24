import { cleanup, render } from '@testing-library/react'
import { QRCodeErrorCorrectionLevel } from 'qrcode'
import { QRCode } from 'ui/src/components/QRCode/QRCode'
import { SharedUIUniswapProvider } from 'ui/src/test/render'
import { describe, expect, it } from 'vitest'

const qrCodeValue = ['s', 'oneSizeBiggerValue']
const sizes = [100, 200]
const ecls: QRCodeErrorCorrectionLevel[] = ['L', 'M', 'Q', 'H']

function generateQRCodeTestCases() {
  const testCases: [string, number, QRCodeErrorCorrectionLevel][] = []
  for (const value of qrCodeValue) {
    for (const size of sizes) {
      for (const ecl of ecls) {
        testCases.push([value, size, ecl])
      }
    }
  }
  return testCases
}

describe('QRCode', () => {
  it.each(generateQRCodeTestCases())(
    'renders the QRCode correctly for value "%s", size %d, and ecl %s',
    (qrCodeValue, size, ecl) => {
      const tree = render(
        <SharedUIUniswapProvider>
          <QRCode
            value={qrCodeValue}
            overlayColor="#FF0000"
            backgroundColor="green"
            size={size}
            color="orange"
            ecl={ecl}
          />
        </SharedUIUniswapProvider>,
      )
      expect(tree.container.innerHTML).toMatchSnapshot()
      cleanup()
    },
  )
})
