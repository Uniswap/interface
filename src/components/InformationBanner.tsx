export const InformationBanner = ({ text }: { text: string | React.ReactNode }) => {
  return (
    <div
      style={{
        display: 'flex',
        fontWeight: 500,
        fontSize: '0.875rem',
        lineHeight: '1.25rem',
        paddingLeft: '1.25rem',
        paddingRight: '1.25rem',
        backgroundColor: 'rgb(250, 241, 228)',
        paddingTop: '0.75rem',
        paddingBottom: '0.75rem',
        borderRadius: '0.375rem',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '10px',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: '0%',
          textAlign: 'center',
          alignSelf: 'center',
          rowGap: '0.5rem',
          columnGap: '0.5rem',
          flexDirection: 'column',
        }}
      >
        {typeof text === 'string' ? <p>{text}</p> : text}
      </div>
    </div>
  )
}
