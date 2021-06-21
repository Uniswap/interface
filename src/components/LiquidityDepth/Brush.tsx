import useTheme from 'hooks/useTheme'
import React, { SVGProps } from 'react'

interface BrushProps extends SVGProps<SVGRectElement> {
  leftLabel: string | undefined
  leftHandleColor: string

  rightLabel: string | undefined
  rightHandleColor: string

  allowDrag: boolean
}

const LEFT_HEAD_OFFSET = 13
const LABEL_PADDING = 10
const LABEL_CHAR_WIDTH = 6

const labelWidth = (label: string | undefined) =>
  label ? label.split('').length * LABEL_CHAR_WIDTH + LABEL_PADDING * 2 : 0

export function Brush({
  x,
  y,
  width,
  height,
  leftLabel,
  leftHandleColor,
  rightLabel,
  rightHandleColor,
  allowDrag,
}: BrushProps) {
  const theme = useTheme()

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
              y + 3
            }c0,-4.21467 3.41667,-3.3134 3.3134,-3.3134l10.49306,0l0,25.7558l-10.49306,0c-4.21468,0 -3.3134,-3.4167 -3.3134,-3.314l0,-10.49306z`}
          />
          <line
            id="seeker_left_accent_left"
            strokeWidth="1.3"
            strokeOpacity="0.6"
            stroke="white"
            y2={y + 18}
            x2={x + 5 - LEFT_HEAD_OFFSET}
            y1={y + 7}
            x1={x + 5 - LEFT_HEAD_OFFSET}
          />
          <line
            id="seeker_left_accent_right"
            strokeWidth="1.3"
            strokeOpacity="0.6"
            stroke="white"
            y2={y + 18}
            x2={x + 9 - LEFT_HEAD_OFFSET}
            y1={y + 7}
            x1={x + 9 - LEFT_HEAD_OFFSET}
          />
          {leftLabel && (
            <g id="seeker_left_label">
              {/* move label to right to avoid overlap when range is small */}
              <rect
                x={x - labelWidth(leftLabel) / (width < 35 ? 1 : 2)}
                y={y + height - 30 / 2}
                width={`${labelWidth(leftLabel)}px`}
                height="30px"
                fill={theme.bg2}
                rx="8px"
              />
              <text
                x={x - (width < 35 ? labelWidth(leftLabel) / 2 : 0)}
                y={y + height}
                fill={theme.text1}
                fontSize="13px"
                dominantBaseline="middle"
                textAnchor="middle"
              >
                {leftLabel}
              </text>
            </g>
          )}
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
            },${y}l10.49309,0c4.2147,0 3.313,3.41666 3.313,7.63134l0,14.49306c0,4.2147 -3.4166,3.314 -3.313,3.314l-10.49309,0l0,-25.7558z`}
          />
          <line
            id="seeker_right_accent_left"
            strokeWidth="1.3"
            strokeOpacity="0.6"
            stroke="white"
            y2={y + 18}
            x2={x + width + 5}
            y1={y + 7}
            x1={x + width + 5}
          />
          <line
            id="seeker_right_accent_right"
            strokeWidth="1.3"
            strokeOpacity="0.6"
            stroke="white"
            y2={y + 18}
            x2={x + width + 9}
            y1={y + 7}
            x1={x + width + 9}
          />
          {rightLabel && (
            <g id="seeker_right_label">
              {/* move label to right to avoid overlap when range is small */}
              <rect
                x={x + width - (width > 35 ? labelWidth(rightLabel) / 2 : 0)}
                y={y + height - 30 / 2}
                width={`${labelWidth(rightLabel)}px`}
                height="30px"
                fill={theme.bg2}
                rx="8px"
              />
              <text
                x={x + width + (width < 35 ? labelWidth(rightLabel) / 2 : 0)}
                y={y + height}
                fill={theme.text1}
                fontSize="13px"
                dominantBaseline="middle"
                textAnchor="middle"
              >
                {rightLabel}
              </text>
            </g>
          )}
        </g>
      </g>
    </g>
  )
}
