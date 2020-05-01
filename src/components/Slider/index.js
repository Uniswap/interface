import React, { useState, useEffect } from 'react'
import Slider from '@material-ui/core/Slider'
import { withStyles } from '@material-ui/core/styles'
import { useDebounce } from '../../hooks'

// const marks = [
//   {
//     value: 0
//   },
//   {
//     value: 25
//   },
//   {
//     value: 50
//   },
//   {
//     value: 75
//   },
//   {
//     value: 100
//   }
// ]

const StyledSlider = withStyles({
  root: {
    width: '95%',
    color: '#3880ff',
    height: 4,
    marginLeft: '15px',
    padding: '15px 0'
  },
  thumb: {
    height: 28,
    width: 28,
    backgroundColor: '#2172E5',
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
    backgroundColor: '#bfbfbf'
  },
  mark: {
    backgroundColor: '#bfbfbf',
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

export default function InputSlider({ value, onChange, override }) {
  const [internalVal, setInternalVal] = useState(0)
  const debouncedInternalValue = useDebounce(internalVal, 10)

  function handleChange(e, val) {
    setInternalVal(val)
    if (val === debouncedInternalValue) {
      onChange(e, val)
    }
  }

  useEffect(() => {
    if (override && value !== internalVal) {
      setInternalVal(value)
    }
  }, [internalVal, override, value])

  return (
    <StyledSlider
      value={typeof internalVal === 'number' ? internalVal : 0}
      onChange={handleChange}
      aria-labelledby="input-slider"
      // marks={marks}
    />
  )
}
