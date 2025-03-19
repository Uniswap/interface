import { breakpoints } from 'ui/src/theme'

export const AssetListCss = ({ isFiltersExpanded }: { isFiltersExpanded?: boolean }) => {
  return (
    <>
      <style>
        {`
        .asset-list {
          display: grid;
          gap: 8px;
          grid-template-columns: repeat(auto-fill, minmax(calc(${isFiltersExpanded ? '100%' : '100%/2'} - 8px), 1fr) );
          @media (min-width: ${breakpoints.lg}px) {
            gap: 12px;
            grid-template-columns: repeat(auto-fill, minmax(calc(${isFiltersExpanded ? '50%' : '100%/3'} - 8px), 1fr) );
          }
          @media (min-width: ${breakpoints.xl}px) {
            gap: 16px;
            grid-template-columns: repeat(auto-fill, minmax(calc(${isFiltersExpanded ? '50%' : '100%/3'} - 8px), 1fr) );
          }
          @media (min-width: ${breakpoints.xxl}px) {
            grid-template-columns: repeat(auto-fill, minmax(calc(${isFiltersExpanded ? '33.33%' : '100%/4'} - 16px), 1fr) );
          }
          @media (min-width: ${breakpoints.xxxl}px) {
            grid-template-columns: repeat(auto-fill, minmax(calc(${isFiltersExpanded ? '25%' : '100%/5'} - 16px), 1fr) );
          }
        }
      `}
      </style>
    </>
  )
}
