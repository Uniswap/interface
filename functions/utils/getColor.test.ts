import getColor from './getColor'

test('should return the average color of a PNG image', async () => {
  const image = 'https://static.vecteezy.com/system/resources/previews/001/209/957/original/square-png.png'
  const color = await getColor(image)
  expect(color).toEqual([0, 0, 0])
})

test('should return the average color of a JPG image', async () => {
  const image =
    'https://imageio.forbes.com/specials-images/imageserve/5ed6636cdd5d320006caf841/0x0.jpg?format=jpg&width=1200'
  const color = await getColor(image)
  expect(color).toEqual([0, 0, 0])
})
