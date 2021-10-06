import Widget from '../Widget'
import Header from './Header'
import Input from './Input'
import Output from './Output'
import Submit from './Submit'

export interface SwapProps {
  darkMode?: boolean
}

export default function Swap({ darkMode = true }: SwapProps) {
  return (
    <Widget darkMode={darkMode}>
      <Header></Header>
      <Input></Input>
      <Output></Output>
      <Submit></Submit>
    </Widget>
  )
}
