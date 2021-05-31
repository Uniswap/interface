import React, { ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom';
import styled from 'styled-components';

const Wrapper = styled.div`
  position: relative;
`;

const DropdownContent = styled.div`
  position: fixed;
  background: ${({ theme }) => theme.bg1};
  border-radius: 12px;
  border-width: 1px;
  border-style: solid;
  border-color: ${({ theme }) => theme.bg2};
  z-index: 999;
`;


interface DropdownProps {
  isVisible: boolean;
  dropdownButton: ReactNode;
  children: ReactNode;
}

export const Dropdown = ({isVisible, dropdownButton, children}: DropdownProps) => {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({
    top: 0,
    right: 0,
  });
  
  useEffect(() => {
    if (ref.current) {
      const position = ref.current.getBoundingClientRect()
      setPosition({
        top: position.top + ref.current.offsetHeight + 10,
        right: window.innerWidth - position.right,
      })
    }
  }, [])
  
  return (
    <Wrapper ref={ref}>
      {dropdownButton}
      {isVisible && createPortal(
        <DropdownContent style={position}>
          {children}
        </DropdownContent>,
        document.body
      )}
    </Wrapper>
  )
}
