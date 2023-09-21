import { DEFAULT_COLOR } from 'constants/tokenColors'

import { getColor } from './getColor'

test('should return the average color of a black PNG image', async () => {
  const image = '/test-utils/black.png'
  const color = await getColor(image)
  expect(color).toEqual([0, 0, 0])
})

test('should return the average color of a blue PNG image', async () => {
  const image = '/test-utils/blue.png'
  const color = await getColor(image)
  expect(color).toEqual([2, 6, 251])
})

test('should return the average color of a white PNG image', async () => {
  const image = '/test-utils/white.png'
  const color = await getColor(image)
  expect(color).toEqual([255, 255, 255])
})

test('should return the average color of a white PNG image with whiteness dimmed', async () => {
  const image = '/test-utils/white.png'
  const color = await getColor(image, true)
  expect(color).toEqual(DEFAULT_COLOR)
})

test('should return the average color of a black JPG image', async () => {
  const image = '/test-utils/black.jpg'
  const color = await getColor(image)
  expect(color).toEqual([0, 0, 0])
})

test('should return default color for a gif image', async () => {
  const image = '/test-utils/uniFan.gif'
  const color = await getColor(image)
  expect(color).toEqual(DEFAULT_COLOR)
})
