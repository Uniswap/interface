/* eslint-disable @typescript-eslint/no-unused-vars */

import { useAtom } from 'jotai'
import { useState } from 'react'
import { useTheme } from 'styled-components'
import FinalStep from './FinalStep'
import OptionsStep from './OptionsStep'
import PreviewStep from './PreviewStep'
import { launchpadParams } from './launchpad-state'

export default function CreateLaunchpad() {
  //const { account, chainId } = useWeb3React()

  const theme = useTheme()

  const [options, setOptions] = useAtom(launchpadParams)

  const [step, setStep] = useState(1)

  return (
    <>
      {step == 1 ? (
        <OptionsStep onNext={() => setStep(2)} />
      ) : step == 2 ? (
        <PreviewStep onBack={() => setStep(1)} onNext={() => setStep(3)} />
      ) : (
        <FinalStep onBack={() => setStep(2)} />
      )}
    </>
  )
}
