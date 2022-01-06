import { useActiveWeb3React } from 'hooks/web3'
import React from 'react'
export function PlaygroundPage() {
  const { connector, account, library } = useActiveWeb3React()

  async function getPairs() {
    try {
      const r = await library?.send('eth_gasPrice', [])
      console.log(r)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <>
      <h1>Playground</h1>
      <p>
        <button onClick={getPairs}>Get Pairs</button>
      </p>
    </>
  )
}
