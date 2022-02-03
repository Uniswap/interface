import React, {useState, useEffect} from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'

const Layout = (props) => {

    const {
        className,
        width,
        id
    } = props;

    return (
        <StyledLayout data-aos={props['data-aos']} id={id} className={`${className} ${width}`}>
            {props.children}
        </StyledLayout>
    )
}

Layout.defaultProps = {
    width: 'full-width',
    id: null,
    className: null
};

Layout.propTypes = {
    className: PropTypes.string,
    id: PropTypes.string,
    width: PropTypes.oneOf(['full-width', 'main-width'])
};

const StyledLayout = styled.div`
    /* background: white; */
`;

export default Layout;