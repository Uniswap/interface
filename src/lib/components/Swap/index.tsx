import { Provider } from 'jotai'

import Widget from '../Widget'
import Header from './Header'
import InputPanel from './InputPanel'
import OutputPanel from './OutputPanel'
import ReverseButton from './ReverseButton'
import SubmitButton from './SubmitButton'

export interface SwapProps {
  darkMode?: boolean
}

export default function Swap({ darkMode = true }: SwapProps) {
  return (
    <Widget darkMode={darkMode}>
      <Provider>
        <Header></Header>
        <InputPanel></InputPanel>
        <ReverseButton></ReverseButton>
        <OutputPanel></OutputPanel>
        <SubmitButton></SubmitButton>
      </Provider>
    </Widget>
  )
}
