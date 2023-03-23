import { useTheme } from 'styled-components/macro'
import { colors } from 'theme/colors'

type SVGProps = React.SVGProps<SVGSVGElement> & { fill?: string }

const useEmptyStateIconColors = () => {
  const theme = useTheme()
  const primary = theme.darkMode ? colors.gray150 : colors.gray600
  const secondary = theme.darkMode ? colors.gray600 : colors.gray300
  return { primary, secondary }
}

export const EmptyActivityIcon = (props: SVGProps) => {
  const { primary, secondary } = useEmptyStateIconColors()
  return (
    <svg {...props} width="96" height="66" viewBox="0 0 96 66" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect
        x="89.2"
        y="8.3"
        width="30.4"
        height="82.4"
        rx="5.2"
        transform="rotate(90 89.2 8.3)"
        stroke={secondary}
        strokeWidth="2.4"
      />
      <line x1="17.7" y1="19.3" x2="23.3" y2="19.3" stroke={secondary} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="17.7" y1="24.3" x2="23.3" y2="24.3" stroke={secondary} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="28.7" y1="19.3" x2="78.3" y2="19.3" stroke={secondary} strokeWidth="2.4" strokeLinecap="round" />
      <line x1="28.7" y1="24.3" x2="78.3" y2="24.3" stroke={secondary} strokeWidth="2.4" strokeLinecap="round" />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M23 56.5C29.6274 56.5 35 51.1274 35 44.5C35 37.8726 29.6274 32.5 23 32.5C16.3726 32.5 11 37.8726 11 44.5C11 51.1274 16.3726 56.5 23 56.5ZM27.5 44.5L23 40L18.5 44.5L23 49L27.5 44.5Z"
        fill={primary}
      />
    </svg>
  )
}

export const EmptyNftsIcon = (props: SVGProps) => {
  const { primary, secondary } = useEmptyStateIconColors()
  return (
    <svg {...props} width="88" height="66" viewBox="0 0 88 66" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_963_210087)">
        <rect
          x="21.1665"
          y="12.6367"
          width="39.1249"
          height="52.1665"
          rx="5.61681"
          stroke={secondary}
          strokeWidth="2.4"
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M43.3569 0.982394C39.6744 0.199643 36.0545 2.55041 35.2718 6.23295L33.9106 12.6366H36.3643L37.6193 6.73194C38.1265 4.34591 40.4719 2.82278 42.8579 3.32995L70.1397 9.12887C72.5258 9.63604 74.0489 11.9814 73.5417 14.3675L65.0313 54.4059C64.5595 56.6254 62.4972 58.0982 60.2912 57.8848V59.1863C60.2912 59.5622 60.2543 59.9295 60.1839 60.2848C63.5428 60.5495 66.6594 58.2898 67.3788 54.9049L75.8893 14.8665C76.672 11.1839 74.3213 7.56407 70.6387 6.78132L43.3569 0.982394Z"
          fill={secondary}
        />
        <circle cx="31.3553" cy="27.7161" r="5.29816" fill={primary} />
        <path
          d="M29.6131 38.9281C25.6488 39.4121 22.8663 43.2392 21.9814 45.8259V58.3157C21.9814 61.4178 24.4962 63.9325 27.5983 63.9325H53.8593C56.9614 63.9325 59.4761 61.4178 59.4761 58.3157V34.617C58.3701 32.6052 55.0962 28.8401 50.849 29.8748C46.6019 30.9095 40.8947 40.0778 38.2402 44.9637C37.2448 42.6316 34.5903 38.3205 29.6131 38.9281Z"
          fill={primary}
        />
      </g>
      <defs>
        <clipPath id="clip0_963_210087">
          <rect width="86.6667" height="65" fill="white" transform="translate(0.666504 0.5)" />
        </clipPath>
      </defs>
    </svg>
  )
}

export const EmptyTokensIcon = (props: SVGProps) => {
  const { primary, secondary } = useEmptyStateIconColors()
  return (
    <svg {...props} width="66" height="66" viewBox="0 0 66 66" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g clipPath="url(#clip0_963_209164)">
        <rect
          x="35.5728"
          y="23.4258"
          width="8.46281"
          height="36.0727"
          rx="2.32727"
          transform="rotate(90 35.5728 23.4258)"
          fill={secondary}
        />
        <rect
          x="35.5728"
          y="11.9629"
          width="8.46281"
          height="36.0727"
          rx="2.32727"
          transform="rotate(90 35.5728 11.9629)"
          fill={secondary}
        />
        <rect
          x="40.2271"
          y="0.5"
          width="8.46281"
          height="36.0727"
          rx="2.32727"
          transform="rotate(90 40.2271 0.5)"
          fill={secondary}
        />
        <rect
          x="39.0635"
          y="34.8887"
          width="8.46281"
          height="36.0727"
          rx="2.32727"
          transform="rotate(90 39.0635 34.8887)"
          fill={secondary}
        />
        <rect
          x="35.5728"
          y="46.3511"
          width="8.46281"
          height="36.0727"
          rx="2.32727"
          transform="rotate(90 35.5728 46.3511)"
          fill={secondary}
        />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M49.4092 65.5C58.2457 65.5 65.4092 58.3366 65.4092 49.5C65.4092 40.6634 58.2457 33.5 49.4092 33.5C40.5726 33.5 33.4092 40.6634 33.4092 49.5C33.4092 58.3366 40.5726 65.5 49.4092 65.5ZM55.4092 49.5L49.4092 43.5L43.4092 49.5L49.4092 55.5L55.4092 49.5Z"
          fill={primary}
        />
      </g>
      <defs>
        <clipPath id="clip0_963_209164">
          <rect width="66" height="65" fill="white" transform="translate(0 0.5)" />
        </clipPath>
      </defs>
    </svg>
  )
}
