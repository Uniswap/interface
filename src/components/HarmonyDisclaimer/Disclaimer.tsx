import * as React from 'react';
import CookieBanner from 'react-cookie-banner';

const styles = {
  banner: {
    height: 60,
    background: '#EDEEF2',
    backgroundSize: '20px 20px',
    backgroundColor: '',
    fontSize: '16px',
    fontWeight: 600,
    position: 'fixed',
    bottom: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 999,
    borderRadius: 5,
    // marginBottom: -10,
    // marginTop: -10
  },
  button: {
    position: 'static',
    border: '1px solid #888D9B',
    borderRadius: 4,
    width: 120,
    height: 40,
    background: 'transparent',
    color: '#888D9B',
    fontSize: '14px',
    fontWeight: 600,
    opacity: 1,
    top: 0,
    marginTop: 0,
    right: 0,
    marginLeft: 40,
    marginRight: 32,
  },
  message: {
    display: 'block',
    lineHeight: 1.5,
    textAlign: 'left',
    color: '#888D9B',
    marginLeft: 32,
    // fontWeight: "bold"
    fontSize: '17px',
  },
  link: {
    textDecoration: 'none',
    fontWeight: 'bold',
  },
};

export const Disclaimer = () => (
  <CookieBanner
    styles={styles}
    message="This project is a tech demo in beta. Use at your own risk."
    onAccept={() => {}}
    cookie="swoop-accept"
    dismissOnScroll={false}
    dismissOnClick={false}
  />
);
