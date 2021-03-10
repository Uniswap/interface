import React, { useState, useEffect, useRef } from 'react'
import Provider from './Provider'
import Values from './Values'
import styled from 'styled-components'
import { transform } from 'framer-motion'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`

interface ProviderProps {
  price: any
  onUpperRangeInput: (value: string) => void
  onLowerRangeInput: (value: string) => void
}

/**
 * Based on array of steps, create a step counter of circles.
 * A circle can be enabled, disabled, or confirmed. States are derived
 * from previous step.
 *
 * An extra circle is added to represent the ability to swap, add, or remove.
 * This step will never be marked as complete (because no 'txn done' state in body ui).
 *
 * @param steps  array of booleans where true means step is complete
 */
export default function RangeSlider({ price, onUpperRangeInput, onLowerRangeInput }: ProviderProps) {
  const amount = 20

  const [minVal, setMin] = useState(0)
  const [midVal, setMid] = useState(210)
  const [maxVal, setMax] = useState(420)

  useEffect(() => {
    console.log(midVal)
  }, [midVal])

  useEffect(() => {
    console.log(minVal)
    onLowerRangeInput(normalizePriceOutput(minVal).toString())
  }, [minVal])

  useEffect(() => {
    console.log(maxVal)
    onUpperRangeInput(normalizePriceOutput(maxVal).toString())
  }, [maxVal])

  useEffect(() => {
    console.log(price)
  }, [price])

  const inputRange = [0, 420]
  const outputRange = [price - price / 3, price * 1.5]

  function normalizePriceOutput(val: any) {
    return transform(val, inputRange, outputRange).toPrecision(4)
  }

  const wrapperRef = useRef<HTMLDivElement>(null)

  return (
    <Wrapper ref={wrapperRef}>
      <Provider
        min={minVal}
        setMin={setMin}
        max={maxVal}
        setMax={setMax}
        mid={midVal}
        setMid={setMid}
        amount={amount}
        parent={wrapperRef}
        price={price}
      />
      {/* <Values
        min={min}
        setMin={setMin}
        max={max}
        setMax={setMax}
        mid={mid}
        setMid={setMid}
      /> */}
    </Wrapper>
  )
}
