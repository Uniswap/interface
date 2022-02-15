import React, {useState, useEffect} from 'react'
import styled from 'styled-components'
import MainNavigation from './MainNavigation'
import Layout from './Layout'

const Header = (props) => {
    return (
        <header>
            <StyledHeader className="full-width">
                <MainNavigation />
                {props.hero}
            </StyledHeader>
        </header>
    )
}

const StyledHeader = styled(Layout)`
    display: flex;
    flex-direction: column;
`;

export default Header;