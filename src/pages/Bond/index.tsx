// import { ButtonPrimary } from 'components/Button'
// import { AutoRow } from 'components/Row'
// import Toggle from 'components/Toggle'
// import { useState } from 'react'
// import { RouteComponentProps } from 'react-router-dom'
//
import { useGetAllBonds } from 'hooks/useBondDepository'

import AppBody from '../AppBody'

// import { useEffect } from 'react'

// const TOKEN_NAMES = {
//   sGen: 'sGEN',
//   gGen: 'gGEN',
// }

export default function Bond() {
  const { bonds, isLoading, error } = useGetAllBonds()

  // useEffect(() => {
  //   console.log('Markets: ', markets, 'Is Loading: ', isLoading, 'Error: ', error)
  // })

  // const [usingStakedGen, setUsingStakedGen] = useState(false)

  // const onToggle = () => setUsingStakedGen(!usingStakedGen)

  return <AppBody>Bonds</AppBody>
}
