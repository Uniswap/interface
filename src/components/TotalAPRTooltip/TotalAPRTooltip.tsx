// import { Box } from '@material-ui/core'
// import { CustomTooltip } from 'components'
import { formatNumber } from '@uniswap/conedison/format'
import Tooltip from 'components/Tooltip'
import React from 'react'
import { Box } from 'rebass'
// import { Box } from 'react-feather'
// import { formatNumber } from 'utils'

interface TotalAPRToolTipProps {
  poolAPR: number
  farmAPR: number
  children: any
}

export default function TotalAPRTooltip({ poolAPR, farmAPR, children }: TotalAPRToolTipProps) {
  return (
    <Tooltip
      show={true}
      text={
        <Box className="totalAPRTooltipWrapper">
          <Box className="flex justify-between items-center bg-grey29" height="40px">
            <small>totalAPR</small>
            <small className="text-sucess">{formatNumber(poolAPR + farmAPR)}%</small>
          </Box>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
            <small className="text-secondary">poolAPR</small>
            <small>{formatNumber(poolAPR)}%</small>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', marginBottom: '10px' }}>
            <small className="text-secondary">farmAPR</small>
            <small>{formatNumber(farmAPR)}%</small>
          </div>
        </Box>
      }
    >
      {children}
    </Tooltip>
  )
}
