import React from 'react'
import useTheme from 'hooks/useTheme'

function Binance({ size }: { size?: number }) {
  const theme = useTheme()
  return (
    <svg width={size || 36} height={size || 36} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_2081_61401)">
        <path
          d="M11.0085 15.1277L18 8.13624L24.9948 15.1308L29.0628 11.0628L18 0.000244141L6.9408 11.0594L11.0087 15.1274L11.0085 15.1277ZM0 18.0002L4.06814 13.9315L8.136 17.9994L4.06786 22.0675L0 18.0002ZM11.0085 20.8732L18 27.8642L24.9947 20.8699L29.0648 24.9357L29.0628 24.9379L18 36.0002L6.9408 24.941L6.93504 24.9353L11.0089 20.8728L11.0085 20.8732ZM27.864 18.002L31.9321 13.9338L36 18.0017L31.932 22.0698L27.864 18.002Z"
          fill={theme.text}
        />
        <path
          d="M22.1258 17.998H22.1276L17.9999 13.8701L14.949 16.9202L14.5985 17.2708L13.8756 17.9939L13.8699 17.9995L13.8756 18.0054L17.9999 22.1303L22.1278 18.0024L22.1299 18L22.1261 17.998"
          fill={theme.text}
        />
      </g>
      <defs>
        <clipPath id="clip0_2081_61401">
          <rect width="36.0001" height="36" fill={theme.text} transform="translate(0 0.000244141)" />
        </clipPath>
      </defs>
    </svg>
  )
}

export default Binance
