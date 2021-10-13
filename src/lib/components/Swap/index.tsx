import { Provider as AtomProvider } from 'jotai'
import { useState } from 'react'

import { BoundaryProvider } from '../Popover'
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
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  return (
    <Widget darkMode={darkMode}>
      <AtomProvider>
        <Header></Header>
        <div ref={setContainer}>
          <BoundaryProvider value={container}>
            <InputPanel></InputPanel>
            <ReverseButton></ReverseButton>
            <OutputPanel></OutputPanel>
            <SubmitButton></SubmitButton>
          </BoundaryProvider>
        </div>
      </AtomProvider>
    </Widget>
  )
}
