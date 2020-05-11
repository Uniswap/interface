import React, { useState, useEffect, useCallback } from 'react'
import Slider from '@material-ui/core/Slider'
import { withStyles } from '@material-ui/core/styles'
import { useDebounce } from '../../hooks'

const StyledSlider = withStyles({
  root: {
    width: '90%',
    color: '#565A69',
    height: 4,
    marginLeft: '15px',
    marginRight: '15px',
    padding: '15px 0'
  },
  thumb: {
    height: 28,
    width: 28,
    backgroundColor: '#565A69',
    marginTop: -14,
    marginLeft: -14,
    '&:focus,&:hover,&$active': {
      boxShadow:
        '0px 0px 1px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04), 0px 24px 32px rgba(0, 0, 0, 0.04)',
      // Reset on touch devices, it doesn't add specificity
      '@media (hover: none)': {}
    }
  },
  active: {},
  track: {
    height: 4
  },
  rail: {
    height: 2,
    opacity: 0.5,
    backgroundColor: '#C3C5CB'
  },
  mark: {
    backgroundColor: '#C3C5CB',
    height: 12,
    width: 2,
    marginTop: -4
  },
  markActive: {
    opacity: 1,
    backgroundColor: 'currentColor',
    height: 12,
    width: 2,
    marginTop: -4
  }
})(Slider)

interface InputSliderProps {
  value: number
  onChange: (val: number) => void
  override?: boolean
}

export default function InputSlider({ value, onChange, override }: InputSliderProps) {
  const [internalVal, setInternalVal] = useState<number>(value)
  const debouncedInternalValue = useDebounce(internalVal, 100)

  const handleChange = useCallback(
    (e, val) => {
      setInternalVal(val)
      if (val !== debouncedInternalValue) {
        onChange(val)
      }
    },
    [setInternalVal, onChange, debouncedInternalValue]
  )

  useEffect(() => {
    if (override) {
      setInternalVal(value)
    }
  }, [override, value])

  return (
    <StyledSlider
      value={typeof internalVal === 'number' ? internalVal : 0}
      onChange={handleChange}
      aria-labelledby="input-slider"
      step={1}
    />
  )
}
