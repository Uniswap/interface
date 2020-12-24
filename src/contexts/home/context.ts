import { createContext } from 'react'
import { HomeContext } from './types'

const context = createContext<HomeContext>({
  home: []
})

export default context
