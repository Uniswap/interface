import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ImageResponse } from '@vercel/og'
import { PoolImage } from 'functions/api/image/pools'
import { createElement } from 'react'

const interFont = readFileSync(resolve(__dirname, '../../../../public/fonts/Inter-normal.var.ttf'))

async function renderPoolImage(token0ImageUrl?: string, token1ImageUrl?: string): Promise<ArrayBuffer> {
  const response = new ImageResponse(
    createElement(PoolImage, { token0ImageUrl, token1ImageUrl, tokenSymbol0: 'AAA', tokenSymbol1: 'BBB' }),
    { width: 200, height: 200, fonts: [{ name: 'Inter', data: interFont, style: 'normal' }] },
  ) as Response
  return response.arrayBuffer()
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47]

describe('PoolImage', () => {
  it.each([
    ['ipfs://bafkreiexample/logo.png', undefined],
    [undefined, 'ipfs://bafkreiexample/logo.png'],
    ['ar://example-tx-id', 'not a url'],
    ['https://example.com/logo.webp', undefined],
  ])('renders a non-empty PNG when a logo URL is not loadable by Satori (%s, %s)', async (token0, token1) => {
    const body = await renderPoolImage(token0, token1)
    expect(body.byteLength).toBeGreaterThan(0)
    expect([...new Uint8Array(body).slice(0, 4)]).toEqual(PNG_SIGNATURE)
  })

  it('renders the same placeholder card for an unsupported scheme as for a missing logo', async () => {
    const withIpfs = new Uint8Array(await renderPoolImage('ipfs://bafkreiexample/logo.png', 'ipfs://other'))
    const withoutLogos = new Uint8Array(await renderPoolImage(undefined, undefined))
    expect(withIpfs).toEqual(withoutLogos)
  })
})
