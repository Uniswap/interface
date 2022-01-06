// eslint-disable-next-line @typescript-eslint/no-var-requires
const https = require('https')

run()
async function run() {
  const tokens = await getRegisteredTokens()
  const list = getList(tokens)
}

async function getRegisteredTokens() {
  const tokens = await fetch('https://rest.rpc.evmos.dev/evmos/intrarelayer/v1/token_pairs')
  return tokens
}

function getList(tokens) {
  return {
    name: 'Evmos Whitelisted',
    timestamp: new Date().toISOString(),
    version: {
      major: 0,
      minor: 0,
      patch: 1,
    },
    keywords: ['evmos', 'official', 'whitelisted'],
    tokens: tokens.map((t) => ({
      chainId: 9000,
      address: t.erc20_address,
      name: t.denon,
      decimals: 18,
      symbol: t.denon,
    })),
  }
}

function fetch(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = []
        // const headerDate = res.headers && res.headers.date ? res.headers.date : 'no response date'

        res.on('data', (chunk) => {
          data.push(chunk)
        })

        res.on('end', () => {
          const body = JSON.parse(Buffer.concat(data).toString())

          resolve(body)
        })
      })
      .on('error', (err) => {
        reject(err)
      })
  })
}
