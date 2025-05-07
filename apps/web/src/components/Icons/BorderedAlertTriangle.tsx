import React, { type ComponentProps } from 'react'
import { useSporeColorsForTheme } from 'ui/src/hooks/useSporeColors'

export const BorderedAlertTriangle = React.memo((props: ComponentProps<'svg'>) => {
  const colors = useSporeColorsForTheme()
  const bgColor = colors.background.val
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <g clipPath="url(#clip0_2786_211021)">
        <path
          d="M8.28223 4.04199C10.052 1.22865 14.2768 1.32224 15.8818 4.32422L22.4893 16.6797L22.6221 16.9502C23.8898 19.7572 21.8364 23 18.6924 23H5.30859C2.06197 23 -0.0198235 19.5459 1.51172 16.6807V16.6797L8.11816 4.32422L8.11914 4.32324L8.28223 4.04199Z"
          fill="#FFBF17"
          stroke={bgColor}
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d="
            M11.2504 10.0001
            C11.2504 9.58609 11.5864 9.25009 12.0004 9.25009
            C12.4144 9.25009 12.7504 9.58609 12.7504 10.0001
            V14.0001
            C12.7504 14.4141 12.4144 14.7501 12.0004 14.7501
            C11.5864 14.7501 11.2504 14.4141 11.2504 14.0001
            V10.0001
            Z
            M12.0204 18.0001
            C11.4684 18.0001 11.0153 17.5521 11.0153 17.0001
            C11.0153 16.4481 11.4584 16.0001 12.0104 16.0001
            H12.0204
            C12.5734 16.0001 13.0204 16.4481 13.0204 17.0001
            C13.0204 17.5521 12.5724 18.0001 12.0204 18.0001
            Z
          "
          fill={bgColor}
        />
      </g>
      <defs>
        <clipPath id="clip0_2786_211021">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  )
})

BorderedAlertTriangle.displayName = 'BorderedAlertTriangle'
