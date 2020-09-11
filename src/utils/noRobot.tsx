import React from 'react'
import { Helmet } from 'react-helmet'

export const NoRobot = () => {
  return (
    <>
      <Helmet>
        <meta name="robots" content="nofollow,noindex" />
      </Helmet>
    </>
  )
}
