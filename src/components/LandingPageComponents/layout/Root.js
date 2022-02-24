import React, {useState, useEffect} from 'react'
import styled, {ThemeProvider} from 'styled-components'
import theme from '../../utils/theme'
import './../../css/stylesheet.css'

import AOS from 'aos';
import 'aos/dist/aos.css';

const Root = (props) => {
    
    useEffect(() => {
        setTimeout(function () { AOS.init({
            duration: 500
        }); }, 1000);
    }, []);

    return (
        <ThemeProvider theme={theme}>
            {props.children}
        </ThemeProvider>
    )
};

export default Root;