import { ButtonPrimary } from 'components/Button'
import { AutoRow } from 'components/Row'
import Toggle from 'components/Toggle'
import { useState } from 'react'
import { RouteComponentProps } from 'react-router-dom'

import AppBody from '../AppBody'

const TOKEN_NAMES = {
  sGen: 'sGEN',
  gGen: 'gGEN',
}

export default function Stake({ history }: RouteComponentProps<{ currencyIdA?: string; currencyIdB?: string }>) {
  const [usingStakedGen, setUsingStakedGen] = useState(false)

  const onToggle = () => setUsingStakedGen(!usingStakedGen)

  return (
    <AppBody>
      <AutoRow style={{ padding: '1rem' }}>
        <Toggle isActive={usingStakedGen} toggle={onToggle} checked={TOKEN_NAMES.sGen} unchecked={TOKEN_NAMES.gGen} />
      </AutoRow>
      <AutoRow style={{ padding: '1rem' }}>
        <ButtonPrimary>Approve {usingStakedGen ? TOKEN_NAMES.sGen : TOKEN_NAMES.gGen}</ButtonPrimary>
      </AutoRow>
    </AppBody>
  )
}
