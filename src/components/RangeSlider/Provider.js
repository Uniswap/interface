import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, transform } from 'framer-motion'
import styled from 'styled-components'

const StyledLiquidity = styled.div`
  width: 100%;
  height: 160px;
  border: 1px solid black;
  border-radius: 4px;
  background-color: #1f2128;
  position: relative;
`

const Track = styled(motion.div)`
  background-color: #000;
  border-radius: 30px;
  width: 100%;
  height: 4px;
  position: absolute;
  top: calc(65% - 4px / 2);
  left: 0;
  z-index: 0;
`

const StyledSVG = styled(motion.svg)`
  position: absolute;
  width: 100%;
  z-index: 1;
`

const Midline = styled(motion.line)`
  position: absolute;
  width: 100%;
`

const Stop = styled(motion.div)`
  width: 8px;
  height: 48px;
  position: absolute;
  top: calc(50% - 48px);
  /* background-color: #888d9b80; */
  opacity: 0.4;
  cursor: pointer;
  :hover {
    opacity: 1;
  }
`
const Key = styled.div`
  font-size: 12px;
  /* transform: rotate(-70deg); */
  color: #888d9b;
  transform: translateY(500%) rotate(-70deg);
`

const Dot = styled.div`
  width: 4px;
  height: 24px;
  position: absolute;
  /* top: calc(50% - 4px); */
  background-color: #888d9b;
  border-radius: 16px;
  z-index: 1;
  bottom: 0px;
`

const Selection = styled(motion.div)`
  width: 4px;
  height: 4px;
  border-radius: 48px;
  position: absolute;
  top: 0px;
  background-color: #2172e5;
  border: none;
  left: 0;
  z-index: 2;
  padding: 0;
  cursor: grab;
  :hover {
    background-color: #2172e530;
  }
  :active {
    cursor: grabbing;
  }
`

const DragHandleLower = styled(motion.div)`
  width: 2px;
  height: 32px;
  border-radius: 48px;
  position: absolute;
  top: -16px;
  background-color: white;
  border: 2px solid #2172e5;
  left: -4px;
  z-index: 2;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  cursor: grab;
  :active {
    cursor: grabbing;
  }
`

const DragHandleMid = styled(motion.div)`
  width: 4px;
  height: 32px;
  border-radius: 48px;
  position: absolute;
  top: -32px;
  background-color: #2172e5;
  /* border: 1px solid #2172e5; */
  left: 0;
  z-index: 1;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  /* cursor: grab;
  :active {
    cursor: grabbing;
  } */
`

const DragHandleUpper = styled(motion.div)`
  width: 1px;
  height: 32px;
  border-radius: 48px;
  position: absolute;
  top: -16px;
  background-color: white;
  border: 2px solid #2172e5;
  left: 8px;
  z-index: 2;
  cursor: grab;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.1);
  :active {
    cursor: grabbing;
  }
`

const Rate = styled.div`
  border-radius: 12px;
  height: fit-content;
  position: relative;
  transform: translateX(-50%) translateY(-125%);
  width: fit-content;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0.5rem;
  background: #191b1f;
  border: 1px solid #627eea;
  z-index: 99999;
  small {
    font-size: 10px;
  }
  box-shadow: 0px 24px 32px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04), 0px 4px 8px rgba(0, 0, 0, 0.04),
    0px 0px 1px rgba(0, 0, 0, 0.04);
`

const LiquidityWrapper = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 8px;
  border-radius: 12px;
  background: rgba(64, 68, 79, 0.4);
  padding: 0.5rem;
  border-radius: 12px;
`

const TokenAmount = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.25;
  border-radius: 12px;
`

const Mid = styled.div`
  border-radius: 8px;
  padding: 0.25rem;
  height: fit-content;
  position: relative;
  transform: translateX(-50%) translateY(-125%);
  width: fit-content;
  background-color: #2172e5;
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: center;
  min-width: 80px;
  small {
    font-size: 10px;
  }
`

export default function Provider({ min, setMin, max, setMax, mid, setMid, amount, parent, price }) {
  // Some constants
  const handleSize = 8
  const trackOffset = 8
  const ticks = 416 / 8
  const tickWidth = 8
  const tickOffset = 8

  // These values drive the positions of elements when stateful values change (2 way bindings)
  const lowerX = useMotionValue(min)
  const midX = useMotionValue(mid)
  const upperX = useMotionValue(max)
  const selectionWidth = useMotionValue(max + 8 - min)
  const midOffset = useMotionValue(mid - min)

  // Some flags to turn on and off side effects of the values above
  const [hovering, setHovering] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [panning, setPanning] = useState(false)

  const [hover, setHover] = useState('none')

  // Refs to check and set styles
  const trackRef = useRef(null)
  const minRef = useRef(null)
  const midRef = useRef(null)
  const maxRef = useRef(null)

  const [dotArray, setDotArray] = useState([])

  useEffect(() => {
    let n = 10000
    let step = 1
    let max = 53
    let min = 0
    let data = {}

    const randn_bm = (min, max, skew) => {
      var u = 0,
        v = 0
      while (u === 0) u = Math.random() //Converting [0,1) to (0,1)
      while (v === 0) v = Math.random()
      let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)

      num = num / 10.0 + 0.5 // Translate to 0 -> 1
      if (num > 1 || num < 0) num = randn_bm(min, max, skew) // resample between 0 and 1 if out of range
      num = Math.pow(num, skew) // Skew
      num *= max - min // Stretch to fill range
      num += min // offset to min
      return num
    }

    const round_to_precision = (x, precision) => {
      var y = +x + (precision === undefined ? 0.5 : precision / 2)
      return y - (y % (precision === undefined ? 1 : +precision))
    }

    // Seed data with a bunch of 0s
    for (let j = min; j < max; j += step) {
      data[j] = 0
    }

    // Create n samples between min and max
    for (let i = 0; i < n; i += step) {
      let rand_num = randn_bm(min, max, 1)
      let rounded = round_to_precision(rand_num, step)
      data[rounded] += 1
    }

    // Count number of samples at each increment
    let hc_data = []
    for (const [key, val] of Object.entries(data)) {
      hc_data.push(val / n)
    }

    // Sort
    hc_data = hc_data.sort(function (a, b) {
      if (a.x < b.x) return -1
      if (a.x > b.x) return 1
      return 0
    })
    console.log(hc_data)

    setDotArray(hc_data)
  }, [])

  // Effect to update the stateful values (min, mid, max) in app.js - we don't want to update them directly
  // Only as a side effect of when a
  useEffect(() => {
    lowerX.onChange((value) => {
      setMin(value)
    })
    midX.onChange((value) => {
      setMid(value)
    })
    upperX.onChange((value) => {
      setMax(value)
    })
  }, [lowerX, midX, upperX, setMin, setMid, setMax])

  // Effects while dragging lower bound
  useEffect(() => {
    if (!dragging) {
      // we only want to update lowerX when the dragging is done
      // if we aren't careful we will get into a loop
      // min drives the x position of the drag handle when it's not being dragged
      lowerX.set(min)
    }
    if (!panning) {
      midOffset.set(mid - min)
      selectionWidth.set(max - min + trackOffset * 2)
    }
  }, [min, mid, dragging, panning, lowerX, max, midOffset, selectionWidth])

  // Effects while dragging middle
  useEffect(() => {
    if (!dragging) {
      midX.set(mid)
      midRef.current.style.x = mid
    }

    if (!panning) {
      midOffset.set(mid - min)
    }
  }, [mid, min, dragging, panning, midOffset, midX, midRef])

  // Effects while dragging upper bound
  useEffect(() => {
    if (!dragging) {
      upperX.set(max)
    }
    if (!panning) {
      midOffset.set(mid - min)
      selectionWidth.set(max - min + trackOffset * 2)
    }
  }, [min, mid, dragging, panning, upperX, max, midOffset, selectionWidth])

  const [elementOffset, setElementElementOffset] = useState(0)

  useEffect(() => {
    setElementElementOffset(parent.current.getBoundingClientRect().left)
  })

  const inputRange = [0, 420]
  const outputRange = [0, price * 1.5]

  function normalizePriceOutput(val) {
    return transform(val, inputRange, outputRange).toPrecision(4)
  }

  function relDiff(a, b) {
    return 100 * Math.abs((a - b) / ((a + b) / 2)).toPrecision(2)
  }

  return (
    <StyledLiquidity>
      <Track ref={trackRef}>
        {Array(ticks)
          .fill()
          .map((_, i) => (
            <Stop
              // drag="/"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onTap={(event, info) => {
                // console.log(event);
                // console.log(info.point.x, info.point.y);
                if (i * tickWidth + tickOffset < mid) {
                  setMin(i * tickWidth + 2 * tickOffset)
                } else if (i * tickWidth + tickOffset > mid) {
                  setMax(i * tickWidth + tickOffset - tickOffset / 2)
                }
              }}
              onHoverStart={(event, info) => {
                setHover(i)
                setHovering(true)
              }}
              onHoverEnd={(event, info) => {
                setHover('none')
                setHovering(false)
              }}
              key={i}
              style={{
                x: i * tickWidth + tickOffset,
                // height: 10,
              }}
            >
              {i % 4 === 0 && <Key>{normalizePriceOutput(i * tickWidth + tickOffset)}</Key>}
              <Dot
                style={{
                  backgroundColor: i * tickWidth + tickOffset > min && i * tickWidth + tickOffset < max && ' #2172e5',
                  height: dotArray[i] * 1000,
                }}
              />

              {hover === i && (
                <Rate>
                  <small>Price</small>
                  <b>{i && normalizePriceOutput(i * tickWidth + tickOffset)}</b>
                  <small> {relDiff(mid, i * tickWidth + tickOffset)}% change</small>

                  {/* <LiquidityWrapper>
                    <small>Ending liquidity</small>
                    <TokenAmount>
                      <span>TokenA</span>
                      <span>{i && normalizePriceOutput(((i / max) * amount) / 2)}</span>
                    </TokenAmount>
                    <TokenAmount>
                      <span>TokenB</span>
                      <span>{i && normalizePriceOutput(1 / (((i / max) * amount) / 2))}</span>
                    </TokenAmount>
                  </LiquidityWrapper> */}
                </Rate>
              )}
            </Stop>
          ))}
        <Selection
          drag="x"
          initial={{ x: 0, width: 0 }}
          style={{ x: min, width: selectionWidth }}
          onDrag={function (event, info) {
            setPanning(true)
            setMin(info.point.x - elementOffset)
            // setMid(info.point.x + midOffset.current + trackOffset);
            setMax(info.point.x - elementOffset + selectionWidth.current)
          }}
          onDragEnd={(event, info) => {
            setPanning(false)
            setMin(info.point.x - elementOffset)
            // setMid(info.point.x + midOffset.current + trackOffset);
            setMax(info.point.x - elementOffset + selectionWidth.current)
          }}
          dragConstraints={trackRef}
          dragMomentum={false}
          //   whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 1 }}
        />
        <DragHandleLower
          drag="x"
          ref={minRef}
          initial={{ x: min }}
          style={{ x: lowerX, opacity: hovering ? 0.2 : 1 }}
          onDrag={function (event, info) {
            if (info.point.x - elementOffset < mid) {
              lowerX.set(info.point.x - elementOffset)
            }
            setDragging(true)
          }}
          onDragEnd={(event, info) => {
            if (info.point.x - elementOffset < mid) {
              lowerX.set(info.point.x - elementOffset)
            }
            setDragging(false)
          }}
          onHoverStart={(event, info) => {
            setHover('min')
          }}
          onHoverEnd={(event, info) => {
            setHover('none')
          }}
          dragConstraints={{ left: 0, right: mid }}
          dragMomentum={false}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Mid>
            <small>Min Price</small>
            <b>{min && normalizePriceOutput(min)}</b>

            <small>-{relDiff(mid, min)}% change</small>
          </Mid>
        </DragHandleLower>

        <DragHandleMid
          // drag="x"
          ref={midRef}
          initial={{ x: mid }}
          style={{ x: mid, width: '2px', backgroundColor: '#2172e5' }}
          onDrag={function (event, info) {
            if (info.point.x - elementOffset > min || info.point.x - elementOffset < max) {
              midX.set(info.point.x - elementOffset)
            }
            setDragging(true)
          }}
          onDragEnd={(event, info) => {
            if (info.point.x > min || info.point.x < max) {
              midX.set(info.point.x - elementOffset)
            }
            setDragging(false)
          }}
          onHoverStart={() => {
            setHover('mid')
          }}
          onHoverEnd={() => {
            setHover('none')
          }}
          dragConstraints={{ left: min + 32, right: max - 32 }}
          dragMomentum={false}
          // whileHover={{ scale: 1.1 }}
          // whileTap={{ scale: 0.95 }}
        >
          <Mid style={{ backgroundColor: '#333' }}>
            <small>Current Price</small>
            <b>{mid && price}</b>
          </Mid>
        </DragHandleMid>

        <DragHandleUpper
          drag="x"
          ref={maxRef}
          initial={{ x: max }}
          style={{ x: upperX, opacity: hovering ? 0.2 : 1 }}
          onDrag={(event, info) => {
            upperX.set(info.point.x - elementOffset)
            setDragging(true)
          }}
          onDragEnd={(event, info) => {
            upperX.set(info.point.x - elementOffset)
            setDragging(false)
          }}
          onHoverStart={() => {
            setHover('max')
          }}
          onHoverEnd={() => {
            setHover('none')
          }}
          dragConstraints={{ left: mid, right: 420 }}
          dragMomentum={false}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Mid>
            <small>Max Price</small>
            <b>{max && normalizePriceOutput(max)}</b>
            <small>+{relDiff(mid, max)}% change</small>
          </Mid>
        </DragHandleUpper>
      </Track>
    </StyledLiquidity>
  )
}

{
  /* <StyledSVG
        width="648px"
        height="320px"
        viewBox="0 0 648 320"
        stroke-linecap="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        <Midline
          animate
          x1={min}
          y1="160"
          x2={max}
          y2="160"
          style={{
            strokeWidth: '32px',
            strokeLinecap: 'round',
          }}
          stroke="#2172e540"
        />
      </StyledSVG> */
}
