import useTheme from 'hooks/useTheme'

function FTX({ width, height }: { width?: number; height?: number }) {
  const theme = useTheme()

  return (
    <svg width={width || 160} height={height || 50} viewBox="0 0 160 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M79.7962 18.7244V25.5011H93.5343V32.2338H79.7962V42.7993H70.9927V11.9873H95.4017V18.7244H79.7962Z"
        fill={theme.text}
      />
      <path d="M108.161 18.9004H98.6016V11.9873H126.478V18.9004H116.964V42.7993H108.161V18.9004Z" fill={theme.text} />
      <path
        d="M149.863 42.7993L143.416 33.2459L137.058 42.7993H127.01L138.348 27.2173L127.5 11.9873H137.414L143.639 20.8806L149.774 11.9873H159.289L148.44 26.8652L160 42.7993H149.863Z"
        fill={theme.text}
      />
      <path d="M16.3403 49.4702H29.6223V36.326H16.3403V49.4702Z" fill="#84D6D7" />
      <path d="M41.4063 18.1566H16.3403V31.3052H41.4063H45.9648V18.161H41.4063V18.1566Z" fill="#33BBC7" />
      <path d="M16.3403 0.000350952V13.1445H57.4843V0.000350952H16.3403Z" fill="#11A9BC" />
      <path d="M0 31.3052H13.2775V18.1566H0V31.3052Z" fill="#33BBC7" />
    </svg>
  )
}

export default FTX
