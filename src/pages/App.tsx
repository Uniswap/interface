import useActiveWeb3React from 'hooks/useActiveWeb3React'
import React from 'react'

import ErrorBoundary from '../components/ErrorBoundary'
import Web3ReactManager from '../components/Web3ReactManager'

const AppTest = () => {
  const { connector } = useActiveWeb3React()
  console.log(connector)
  return <div>test</div>
}

export default function App() {
  return (
    <ErrorBoundary>
      <Web3ReactManager>
        <AppTest />
      </Web3ReactManager>
    </ErrorBoundary>
  )
}
