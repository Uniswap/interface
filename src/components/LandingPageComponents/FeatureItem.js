import React, {useState, useEffect, useRef} from 'react'
import styled from 'styled-components'
import Button from './common/Button'
import { breakpoints } from './../../utils/theme'

const FeatureItem = (props) => {
    const {feature} = props;
    const [isElementVisible, setIsElementVisible] = useState(false);
    const [isSafari, setIsSafari] = useState(false);

    useEffect(() => {
        // let safari;
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        setIsSafari(isSafari);
    }, []);

    useEffect(() => {
        window.addEventListener('scroll', (e) => {
            let el = document.getElementById(props.id);
            let elRect = el.getBoundingClientRect().y;
            if (elRect < 800) {
                setIsElementVisible(true);
            } else if (elRect > 1200) {
                setIsElementVisible(false);
            }
        })
    }, []);

    return (
        <StyledFeatureItem className="feature-item" data-aos="fade-up" id={props.id}>
            <div className="feature-item-content">
                <div className="image-container">
                {!isSafari ? (
                    isElementVisible && (
                        <object type="image/svg+xml" data={feature.animation}></object>
                        // <embed src={feature.animation} />
                        // <img src={feature.image} alt="image"/>
                    )
                ) : (
                    <img src={feature.image} alt="image"/>
                )}
                </div>
                <div className="feature-content">
                    <h3>{feature.title}</h3>
                    <p>{feature.content}</p>
                    <div className="feature-buttons">
                        {feature.buttons.map((button, key) => (
                            <Button key={key} label={button.label} type={button.type}/>
                        ))}
                    </div>
                </div>
            </div>
        </StyledFeatureItem>
    )
}

const StyledFeatureItem = styled.div`
    width: 50%;
    display: flex;
    justify-content: center;
    margin-bottom: 124px;
    position: relative;
    &:after {
        content: '';
        position: absolute;
        bottom: 0;
        width: 389px;
        height: 1px;
        background: linear-gradient(90deg, black, #8780BF, black);
    }
    &:nth-child(even) {
        top: 140px;
    }
    .feature-item-content {
        width: 414px;
        display: flex;
        align-items: center;
        flex-direction: column;
        .image-container {
            height: 300px;
            display: flex;
            width: 100%;
            align-items: flex-end;
            justify-content: center;
            img {
                /* margin-bottom: 56px; */
                transform: scale(0.5);
                transform-origin: 50% 100%;
            }
            embed {
                svg {
                    background: #0c0b12;
                }
            }
            embed {
                height: 100%;
                width: 100%;
                max-width: 360px;
            }
        }
        .feature-content {
            h3 {
                margin-bottom: 6px;
                font-weight: 500;
                letter-spacing: 1px;
            }
            p {
                font-size: 20px;
                line-height: 30px;
                font-weight: 100;
                margin-bottom: 40px;
                color: #B7B5CB;
            }
            .feature-buttons {
                margin-bottom: 72px;
                display: flex;
                .button {
                    width: 142px;
                    margin-right: 24px;
                    height: 36px;
                    a {
                        padding: 0;
                        height: inherit;
                        line-height: 36px;
                        font-size: 10px;
                        letter-spacing: 0.85px;
                    }
                }
            }
        }
    }
    @media screen and (max-width: ${breakpoints.md}) {
        &:nth-child(even) {
            top: 0;
        }
        .feature-item-content {
            .image-container {
                width: 100%;
                justify-content: center;
                height: 200px !important;
                align-items: flex-end;
            }
            .feature-content {
                .feature-buttons {
                    /* flex-direction: column; */
                    flex-wrap: wrap;
                    margin-bottom: 14px;
                    .button {
                        margin-bottom: 16px;
                        width: fit-content !important;
                        a {
                            width: inherit;
                            .label {
                                padding: 0 24px;
                            }
                        }
                    }
                }
                p {
                    font-size: 16px;
                    line-height: 150%;
                    margin-bottom: 32px;
                }
            }
        }
    }
    @media screen and (max-width: ${breakpoints.s}) {
        .image-container {
            transform: scale(0.8);
        }
        .feature-item-content {
            width: 100%;
        }
    }
`;

export default FeatureItem;