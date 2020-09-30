import React from 'react'
import AppBody from '../AppBody'
import { SwapPoolTabs } from '../../components/NavigationTabs'
import CurrencyInputPanel from '../../components/CurrencyInputPanel'

export default function Bridge() {
  return (
    <>
      <AppBody>
        <SwapPoolTabs active={'bridge'} />
        <CurrencyInputPanel
          value="1"
          onUserInput={() => {
            console.log('user input')
          }}
          id="bridge-input-token"
          showMaxButton={false}
        />
      </AppBody>
    </>
  )
}
