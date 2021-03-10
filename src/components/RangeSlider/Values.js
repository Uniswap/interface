import React, { useState, useEffect } from 'react'
import styled from 'styled-components'

const StyledHeader = styled.header`
  display: flex;
  width: 100%;
  justify-content: space-between;
  padding: 1rem;
  box-sizing: border-box;
  max-width: 640px;
`

export default function Values({ min, setMin, mid, setMid, max, setMax }) {
  const [inputMin, setInputMin] = useState(min)
  const [inputMid, setInputMid] = useState(mid)
  const [inputMax, setInputMax] = useState(max)

  const handleInputChangeMin = (e) => {
    setMin(e.currentTarget.value)
  }
  const handleInputChangeMid = (e) => {
    setMid(e.currentTarget.value)
  }
  const handleInputChangeMax = (e) => {
    setMax(e.currentTarget.value)
  }

  // const handleEnterMin = (e) => {
  //   if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
  //     // do something here (enter has been pressed)
  //     setMin(e.currentTarget.value)
  //     console.log('enter')
  //   } else {
  //     return false // somehow prevents "default" form behaviors
  //   }
  // }

  // const handleEnterMid = (e) => {
  //   if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
  //     // do something here (enter has been pressed)
  //     console.log('enter')
  //     setMid(e.currentTarget.value)
  //   } else {
  //     return false // somehow prevents "default" form behaviors
  //   }
  // }

  // const handleEnterMax = (e) => {
  //   if ((e.which && e.which === 13) || (e.keyCode && e.keyCode === 13)) {
  //     // do something here (enter has been pressed)
  //     console.log('enter')
  //     setMax(e.currentTarget.value)
  //   } else {
  //     return false // somehow prevents "default" form behaviors
  //   }
  // }

  useEffect(() => {
    setInputMin(min)
  }, [min])

  useEffect(() => {
    setInputMid(mid)
  }, [mid])

  useEffect(() => {
    setInputMax(max)
  }, [max])

  return (
    <StyledHeader className="header">
      <input
        type="number"
        name="min"
        value={inputMin}
        onChange={handleInputChangeMin}
        // onKeyPress={handleEnterMin}
      />
      <input
        type="number"
        name="mid"
        value={inputMid}
        onChange={handleInputChangeMid}
        // onKeyPress={handleEnterMid}
      />
      <input
        type="number"
        name="max"
        value={inputMax}
        onChange={handleInputChangeMax}
        // onKeyPress={handleEnterMax}
      />
    </StyledHeader>
  )
}
