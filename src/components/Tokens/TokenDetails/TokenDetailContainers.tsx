import { Link } from 'react-router-dom'
import styled from 'styled-components/macro'

export const AboutContainer = styled.div`
  gap: 16px;
  padding: 24px 0px;
`
export const AboutHeader = styled.span`
  font-size: 28px;
  line-height: 36px;
`
export const BreadcrumbNavLink = styled(Link)`
  display: flex;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  line-height: 20px;
  align-items: center;
  gap: 4px;
  text-decoration: none;
  margin-bottom: 16px;

  &:hover {
    color: ${({ theme }) => theme.textTertiary};
  }
`
export const ChartHeader = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.textPrimary};
  gap: 4px;
  margin-bottom: 24px;
`
export const ContractAddressSection = styled.div`
  padding: 24px 0px;
`
export const ChartContainer = styled.div`
  display: flex;
  height: 436px;
  align-items: center;
`
export const Stat = styled.div`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.textSecondary};
  font-size: 14px;
  min-width: 168px;
  flex: 1;
  gap: 4px;
  padding: 24px 0px;
`
export const StatsSection = styled.div`
  display: flex;
  flex-wrap: wrap;
`
export const StatPair = styled.div`
  display: flex;
  flex: 1;
  flex-wrap: wrap;
`
export const TokenNameCell = styled.div`
  display: flex;
  gap: 8px;
  font-size: 20px;
  line-height: 28px;
  align-items: center;
`
export const TokenInfoContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`
export const TopArea = styled.div`
  max-width: 832px;
  overflow: hidden;
`
export const ResourcesContainer = styled.div`
  display: flex;
  padding-top: 12px;
  gap: 14px;
`
