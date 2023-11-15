#!/bin/bash

# this is here because putting it in package.json scripts doesn't work as it wont run until install happens

# CYPRESS_INSTALL_BINARY=0 yarn workspaces focus @uniswap/interface

CYPRESS_INSTALL_BINARY=0 yarn install
