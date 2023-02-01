import { CSSProperties } from 'styled-components'

export default function SendIcon({ size = 13, style = {} }: { size?: number; style?: CSSProperties }) {
  return (
    <svg style={style} width={size} height={size} viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M4.5 0.999837C4.5 1.4665 4.875 1.83317 5.33333 1.83317L9.99166 1.83317L0.916663 10.9082C0.591663 11.2332 0.591663 11.7582 0.916663 12.0832C1.24166 12.4082 1.76666 12.4082 2.09166 12.0832L11.1667 3.00817L11.1667 7.6665C11.1667 8.12484 11.5417 8.49984 12 8.49984C12.4583 8.49984 12.8333 8.12484 12.8333 7.6665L12.8333 0.999837C12.8333 0.541504 12.4583 0.166504 12 0.166504L5.33333 0.166504C4.875 0.166504 4.5 0.541504 4.5 0.999837Z"
        fill="currentColor"
      />
    </svg>
  )
}
