import { DEFAULT_COLOR } from 'constants/tokenColors'
import {
  arrayBufferBlackGif,
  arrayBufferBlackJpg,
  arrayBufferBlackPng,
  arrayBufferBlackPngInvalid,
  arrayBufferBluePng,
  arrayBufferPinkPng,
  arrayBufferWhitePng,
} from 'test-utils/images'

import { getColor } from './getColor'

function getMockImageFetch(data: Uint8Array, dataType = 'image/png') {
  return () =>
    Promise.resolve({
      ok: true,
      status: 200,
      headers: {
        get: jest.fn().mockReturnValue(dataType),
      },
      arrayBuffer: jest.fn().mockResolvedValue(data),
    } as unknown as Response)
}

test('should return the average color of a black PNG image', async () => {
  jest.spyOn(global, 'fetch').mockImplementation(getMockImageFetch(arrayBufferBlackPng))

  const color = await getColor('fakeUrl')
  expect(color).toEqual([0, 0, 0])
})

test('should return the average color of a blue PNG image', async () => {
  jest.spyOn(global, 'fetch').mockImplementation(getMockImageFetch(arrayBufferBluePng))

  const color = await getColor('fakeUrl')
  expect(color).toEqual([0, 0, 255])
})

test('should return the average color of a white PNG image', async () => {
  jest.spyOn(global, 'fetch').mockImplementation(getMockImageFetch(arrayBufferWhitePng))

  const color = await getColor('fakeUrl')
  expect(color).toEqual([255, 255, 255])
})

test('should return the average color of a white PNG image with whiteness dimmed', async () => {
  jest.spyOn(global, 'fetch').mockImplementation(getMockImageFetch(arrayBufferWhitePng))

  const color = await getColor('fakeUrl', true)
  expect(color).toEqual(DEFAULT_COLOR)
})

test('should return the average color of a black JPG image', async () => {
  jest.spyOn(global, 'fetch').mockImplementation(getMockImageFetch(arrayBufferBlackJpg, 'image/jpeg'))

  const color = await getColor('fakeUrl')
  expect(color).toEqual([0, 0, 0])
})

test('should return default color for a GIF image', async () => {
  jest.spyOn(global, 'fetch').mockImplementation(getMockImageFetch(arrayBufferBlackGif))

  const color = await getColor('fakeUrl')
  expect(color).toEqual(DEFAULT_COLOR)
})

test('should return default color for a invalid image', async () => {
  jest.spyOn(global, 'fetch').mockImplementation(getMockImageFetch(arrayBufferBlackPngInvalid))

  const color = await getColor('fakeUrl')
  expect(color).toEqual(DEFAULT_COLOR)
})

test('should return pink for a pink PNG image', async () => {
  jest.spyOn(global, 'fetch').mockImplementation(getMockImageFetch(arrayBufferPinkPng))

  const color = await getColor('fakeUrl')
  expect(color).toEqual([230, 52, 140])
})
