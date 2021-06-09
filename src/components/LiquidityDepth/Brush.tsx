import React, { SVGProps } from 'react'

interface BrushProps extends SVGProps<SVGRectElement> {
  leftHandleColor: string
  rightHandleColor: string
  allowDrag: boolean
}

// need to move the head by -18px
const LEFT_HEAD_OFFSET = 18

export default function Brush({ x, y, width, height, leftHandleColor, rightHandleColor, allowDrag }: BrushProps) {
  if (!(x && y && width && height)) return null

  x = Number(x)
  y = Number(y)
  width = Number(width)
  height = Number(height)

  return (
    <g>
      <defs>
        <linearGradient y2={y} x2="100%" y1={y} x1="0%" id="seeker_gradient">
          <stop stopColor={leftHandleColor} />
          <stop stopColor={rightHandleColor} offset="1" />
        </linearGradient>
      </defs>
      <g>
        <g id="gradient">
          <rect
            x={x}
            y={y}
            id="svg_19"
            fill="url(#seeker_gradient)"
            height={height}
            width={width}
            opacity="0.1"
            cursor={allowDrag ? 'move' : 'auto'}
          />
        </g>

        <g id="seeker_left">
          <path id="seeker_left_bar" strokeWidth="1.90783" stroke={leftHandleColor} d={`m${x},${y}l0,${height}`} />
          <path
            id="seeker_left_head"
            fill={leftHandleColor}
            d={`m${x - LEFT_HEAD_OFFSET},${
              y + 7.5
            }c0,-4.21467 3.41667,-7.63134 7.63134,-7.63134l10.49306,0l0,25.7558l-10.49306,0c-4.21468,0 -7.63134,-3.4167 -7.63134,-7.6314l0,-10.49306z`}
          />
          <line
            id="seeker_left_accent_left"
            strokeWidth="0.95392"
            strokeOpacity="0.6"
            stroke="white"
            y2={y + 17.5}
            x2={x + 8 - LEFT_HEAD_OFFSET}
            y1={y + 9}
            x1={x + 8 - LEFT_HEAD_OFFSET}
          />
          <line
            id="seeker_left_accent_right"
            strokeWidth="0.95392"
            strokeOpacity="0.6"
            stroke="white"
            y2={y + 17.5}
            x2={x + 11 - LEFT_HEAD_OFFSET}
            y1={y + 9}
            x1={x + 11 - LEFT_HEAD_OFFSET}
          />
        </g>

        <g id="seeker_right">
          <path
            id="seeker_right_bar"
            strokeWidth="1.90783"
            stroke={rightHandleColor}
            d={`m${x + width},${y}l0,${height}`}
          />
          <path
            id="seeker_right_head"
            fill={rightHandleColor}
            d={`m${
              x + width
            },${y}l10.49309,0c4.2147,0 7.6313,3.41666 7.6313,7.63134l0,10.49306c0,4.2147 -3.4166,7.6314 -7.6313,7.6314l-10.49309,0l0,-25.7558z`}
          />
          <line
            id="seeker_right_accent_left"
            strokeWidth="0.95392"
            strokeOpacity="0.6"
            stroke="white"
            y2={y + 17.5}
            x2={x + width + 6}
            y1={y + 9}
            x1={x + width + 6}
          />
          <line
            id="seeker_right_accent_right"
            strokeWidth="0.95392"
            strokeOpacity="0.6"
            stroke="white"
            y2={y + 17.5}
            x2={x + width + 9}
            y1={y + 9}
            x1={x + width + 9}
          />
        </g>
      </g>
    </g>
  )
}
