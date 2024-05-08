type SVGProps = React.SVGProps<SVGSVGElement> & {
  fill?: string
  height?: string | number
  width?: string | number
}

export const CheckMark = (props: SVGProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    data-testid="checkmark-icon"
    {...props}
  >
    <path
      d="M9.00002 17C8.99902 17 8.99802 17 8.99602 17C8.72902 16.999 8.47502 16.892 8.28802 16.702L4.28802 12.64C3.90002 12.246 3.90503 11.613 4.29903 11.226C4.69303 10.839 5.32502 10.843 5.71302 11.237L9.00602 14.581L18.294 5.29398C18.685 4.90298 19.317 4.90298 19.708 5.29398C20.099 5.68398 20.099 6.31798 19.708 6.70798L9.70801 16.708C9.52001 16.895 9.26502 17 9.00002 17Z"
      fill="#40B66B"
    />
  </svg>
)
