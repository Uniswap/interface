/* eslint-disable */
const waitPort = require('wait-port')

const params = {
  port: 3001,
  host: 'localhost',
}

beforeAll(async () => {
  await waitPort(params)
}, 60000)

test('example', async () => {
  expect(true).toBe(true)
})
