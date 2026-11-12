import { createIcon } from '../factories/createIcon'
import { G, Path, Svg } from '../factories/svg-elements'

export const [Database, AnimatedDatabase] = createIcon({
  name: 'Database',
  getIcon: (props) => (
    <Svg preserveAspectRatio="none" overflow="visible" viewBox="0 0 20 20" fill="none" {...props}>
      <G id="database" preserveAspectRatio="none" overflow="visible">
        <Path
          id="database_2"
          d="M10 14.5833C12.8667 14.5833 15.2917 13.7917 16.6667 12.5417V14.1667C16.6667 16.0083 13.6833 17.5 10 17.5C6.31667 17.5 3.33333 16.0083 3.33333 14.1667V12.5417C4.71667 13.7917 7.13333 14.5833 10 14.5833ZM3.33333 8.37504V10C3.33333 11.8417 6.31667 13.3333 10 13.3333C13.6833 13.3333 16.6667 11.8417 16.6667 10V8.37504C15.2917 9.62504 12.8667 10.4167 10 10.4167C7.13333 10.4167 4.71667 9.62504 3.33333 8.37504ZM10 9.16667C13.6817 9.16667 16.6667 7.67417 16.6667 5.83333C16.6667 3.9925 13.6817 2.5 10 2.5C6.31833 2.5 3.33333 3.9925 3.33333 5.83333C3.33333 7.67417 6.31833 9.16667 10 9.16667Z"
          fill="currentColor"
          preserveAspectRatio="none"
          overflow="visible"
        />
      </G>
    </Svg>
  ),
  defaultFill: '#131313',
})
