const Deposit = ({ width, height, color }: { width?: number; height?: number; color?: string }) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={width || 16} height={height || 16} viewBox="0 0 16 16">
      <path
        d="M11.06 6H10V2.66667C10 2.3 9.70004 2 9.33337 2H6.66671C6.30004 2 6.00004 2.3 6.00004 2.66667V6H4.94004C4.34671 6 4.04671 6.72 4.46671 7.14L7.52671 10.2C7.78671 10.46 8.20671 10.46 8.46671 10.2L11.5267 7.14C11.9467 6.72 11.6534 6 11.06 6ZM3.33337 12.6667C3.33337 13.0333 3.63337 13.3333 4.00004 13.3333H12C12.3667 13.3333 12.6667 13.0333 12.6667 12.6667C12.6667 12.3 12.3667 12 12 12H4.00004C3.63337 12 3.33337 12.3 3.33337 12.6667Z"
        fill={color || 'currentColor'}
      />
    </svg>
  )
}

export default Deposit
