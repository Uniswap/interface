import { ComponentProps } from 'react'

export const Bag = (props: ComponentProps<'svg'>) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      fill-rule="evenodd"
      clip-rule="evenodd"
      d="M9.25 8H7.75V6.5C7.75 4.16 9.66 2.25 12 2.25C14.34 2.25 16.25 4.16 16.25 6.5V8H14.75V6.5C14.75 4.98 13.52 3.75 12 3.75C10.48 3.75 9.25 4.98 9.25 6.5V8ZM18.5 8H16.25V11C16.25 11.41 15.91 11.75 15.5 11.75C15.09 11.75 14.75 11.41 14.75 11V8H9.25V11C9.25 11.41 8.91 11.75 8.5 11.75C8.09 11.75 7.75 11.41 7.75 11V8H5.5C4.67 8 4 8.67 4 9.5V18C4 20 5 21 7 21H17C19 21 20 20 20 18V9.5C20 8.67 19.33 8 18.5 8Z"
      fill="#9B9B9B"
    />
  </svg>
)
