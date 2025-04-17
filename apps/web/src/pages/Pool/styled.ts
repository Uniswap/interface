import styled from 'styled-components';
import { AutoColumn } from 'components/Column';
import { ButtonPrimary } from 'components/Button';
import { ThemedText } from 'theme/components';
import { ScrollBarStyles } from 'components/Common';
import Row from 'components/Row';

// export const IncentiveCard = styled.div`
//   background: ${({ theme }) => theme.surface2};
//   border-radius: 16px;
//   padding: 16px;
//   cursor: pointer;
//   min-height: 72px;
//   display: flex;
//   flex-direction: column;
//   transition: background-color 0.2s ease;
  
//   &:hover {
//     background: ${({ theme }) => theme.surface3};
//   }
// `

// export const IncentiveHeader = styled(Row)`
//   justify-content: space-between;
//   align-items: center;
//   gap: 12px;
// `

// export const IncentiveContent = styled(AutoColumn)`
//   padding-top: 16px;
//   border-top: 1px solid ${({ theme }) => theme.surface3};
// `

// export const IncentiveStatus = styled.div<{ isActive: boolean }>`
//   background: ${({ theme, isActive }) => isActive ? theme.success : theme.surface3};
//   color: ${({ theme, isActive }) => isActive ? theme.surface1 : theme.neutral2};
//   padding: 4px 8px;
//   border-radius: 6px;
//   font-size: 14px;
//   font-weight: 500;
// `

export const AutoColumnWrapper = styled(AutoColumn)`
  width: 100%;
  padding: 0;
` 

export const Wrapper = styled.div`
  position: relative;
  padding: 1rem;
  width: 100%;
`;

export const Dots = styled.span`
  &::after {
    display: inline-block;
    animation: ellipsis 1.25s infinite;
    content: ".";
    width: 1em;
    text-align: left;
  }
  @keyframes ellipsis {
    0% {
      content: ".";
    }
    33% {
      content: "..";
    }
    66% {
      content: "...";
    }
  }
`;

export const LoadingRows = styled.div`
  display: grid;
  min-width: 75%;
  max-width: 100%;
  padding: 0;
  & > div {
    @keyframes shimmer {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }
    animation: shimmer 1.5s linear infinite;
    background: linear-gradient(
      90deg,
      ${({ theme }) => theme.surface2} 0%,
      ${({ theme }) => theme.surface3} 50%,
      ${({ theme }) => theme.surface2} 100%
    );
    background-size: 400% 400%;
    height: 2.4em;
    border-radius: 12px;
  }
  & > div:nth-child(4n + 1) {
    grid-column: 1 / -1;
  }
  & > div:nth-child(4n + 2) {
    grid-column: 1 / -1;
  }
  & > div:nth-child(4n + 3) {
    grid-column: 1 / -1;
  }
`;

export const ClickableText = styled(ThemedText.DeprecatedMain)`
  color: ${({ theme }) => theme.accent1};
  user-select: none;
  text-decoration: none;
  &:hover {
    cursor: pointer;
    opacity: 0.6;
  }
`;

export const MaxButton = styled(ButtonPrimary)`
  background-color: ${({ theme }) => theme.surface3};
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0.5rem;
  color: ${({ theme }) => theme.accent1};
  &:hover {
    opacity: 0.8;
  }
  &:focus {
    box-shadow: 0 0 0 1pt ${({ theme }) => theme.accent2};
    background-color: ${({ theme }) => theme.accent2};
  }
  &:active {
    box-shadow: 0 0 0 1pt ${({ theme }) => theme.accent2};
    background-color: ${({ theme }) => theme.accent2};
  }
  &:disabled {
    opacity: 50%;
    cursor: auto;
  }
`;

export const Container = styled(AutoColumnWrapper)`
  position: relative;
  height: 100%;
`;

export const ScrollableContent = styled(AutoColumnWrapper)`
  max-height: calc(100vh - 340px);
  overflow-y: auto;
  gap: 8px;
  ${ScrollBarStyles}
`;

export const IncentiveCard = styled.div`
  cursor: pointer;
  transition: transform 0.2s ease;
  width: 100%;
  box-sizing: border-box;
  background: ${({ theme }) => theme.surface2};
  border-radius: 12px;
  margin-bottom: 8px;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

export const IncentiveHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  flex-wrap: wrap;
  gap: 0px;
  width: 100%;
  box-sizing: border-box;
`;

export const IncentiveContent = styled(AutoColumn)`
  padding: 16px;
  border-top: 1px solid ${({ theme }) => theme.neutral3};
  width: 100%;
  box-sizing: border-box;
  gap: 16px;
  background: ${({ theme }) => theme.surface2};
  border-radius: 0 0 12px 12px;
`;

type IncentiveStatusProps = {
  isActive: boolean;
};

export const IncentiveStatus = styled.div<IncentiveStatusProps>`
  background-color: ${({ isActive, theme }) => isActive ? theme.accent1 : theme.surface3};
  color: ${({ isActive, theme }) => isActive ? theme.white : theme.neutral2};
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  display: inline-block;
`; 