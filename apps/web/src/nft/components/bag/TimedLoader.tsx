import { Flex } from 'ui/src'

const styles = {
  circle: {
    strokeDasharray: '1000',
    strokeDashoffset: '0',
    animation: 'dash 160s linear',
  },
  container: {
    position: 'absolute' as const,
  },
} as const

export const TimedLoader = () => {
  const stroke = 1.5

  return (
    <Flex style={styles.container}>
      <svg height="18px" width="18px">
        <circle
          style={{
            ...styles.circle,
            transform: 'rotate(90deg)',
            transformOrigin: '50% 50%',
            stroke: 'var(--accent1)',
          }}
          strokeWidth={`${stroke}`}
          strokeLinecap="round"
          fill="transparent"
          r="8px"
          cx="9px"
          cy="9px"
        />
      </svg>
    </Flex>
  )
}
