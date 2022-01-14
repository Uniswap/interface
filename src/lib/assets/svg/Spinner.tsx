import * as React from 'react'

function SvgSpinner(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <mask id="spinner_svg__a">
        <path fill="#fff" strokeWidth={0} d="M0 0h24v24H0z" />
        <path fill="#000" strokeWidth={0} d="M0 0h12v12H0z" />
        <circle cx={2} cy={12} r={1} fill="#fff" strokeWidth={0} />
        <circle cx={12} cy={2} r={1} fill="#fff" strokeWidth={0} />
      </mask>
      <circle cx={12} cy={12} r={10} mask="url(#spinner_svg__a)" />
    </svg>
  )
}

export default SvgSpinner
