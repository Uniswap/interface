import Widget from '../Widget'
import Header from './Header'
import InputPanel from './InputPanel'
import OutputPanel from './OutputPanel'
import ReverseButton from './ReverseButton'
import { SwapStateProvider } from './state'
import SubmitButton from './SubmitButton'

export interface SwapProps {
  darkMode?: boolean
}

export default function Swap({ darkMode = true }: SwapProps) {
  return (
    <Widget darkMode={darkMode}>
      <SwapStateProvider>
        <Header></Header>
        <InputPanel></InputPanel>
        <ReverseButton></ReverseButton>
        <OutputPanel></OutputPanel>
        <SubmitButton></SubmitButton>
      </SwapStateProvider>
    </Widget>
  )
}
