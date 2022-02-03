import React, {useState, useEffect} from 'react'
import styled from 'styled-components'
import Layout from './layout/Layout'
import Button from './common/Button'
import { BlogContent } from '../../utils/ui-constants'
import { breakpoints } from '../../utils/theme'

const BlogNavigation = () => {
    return (
        <StyledBlogNavigation data-aos={'fade-up'} width={'main-width'} id={'blog-navigation'}>
            <ul className={'blog-list'}>
                {BlogContent.posts.map((post, key) => (
                    <li className="blog-item" key={key}>
                        <div 
                            className="blog-image" 
                            style={{backgroundImage: `url(${post.image})`}} 
                        />
                        <h3>{post.title}</h3>
                        <p>{post.content}</p>
                        <Button size={'small'} label={BlogContent.readBlogPost} type={'dark'} />
                    </li>
                ))}
            </ul>
        </StyledBlogNavigation>
    )
}

const StyledBlogNavigation = styled(Layout)`
    &#blog-navigation {
        margin-bottom: 160px;
        .blog-list {
            display: flex;
            justify-content: space-between;
            .blog-item {
                border: 1px solid rgba(178, 0, 255, 0.15);
                width: 360px;
                padding: 24px;
                background: linear-gradient(265.51deg, rgba(42, 47, 78, 0.3) -7.41%, rgba(42, 47, 78, 0.093) 90.54%);
                border-radius: 4px;
                .blog-image {
                    width: 100%;
                    height: 109px;
                    margin-bottom: 33px;
                }
                h3 {
                    font-size: 20px;
                    line-height: 30px;
                    color: ${(props) => (props.theme.gray)};
                    margin-bottom: 8px;
                    font-weight: 400;
                }
                p {
                    font-size: 16px;
                    line-height: 24px;
                    font-weight: 200;
                    color: ${(props) => (props.theme.gray)};
                    height: 72px;
                    display: inline-block;
                    margin-bottom: 39px;
                }
                .button {
                    width: 150px;
                }
            }
        }
    }
    @media screen and (max-width: ${breakpoints.l}) {
        width: unset !important;
        padding: 0 32px;
        .blog-list {
            .blog-item {
                width: calc(33% - 12px) !important;
                max-width: 360px;
            }
        }
    }
    @media screen and (max-width: ${breakpoints.md}) {
        .blog-list {
            flex-direction: column;
            align-items: center;
            .blog-item {
                margin-bottom: 40px;
                width: 100% !important;
            }
        }
    }
`;

export default BlogNavigation;