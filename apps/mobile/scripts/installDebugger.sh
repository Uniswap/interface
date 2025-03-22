#!/bin/bash
which -s brew
if [[ $? != 0 ]] ; then
    echo 'Homebrew has not been found to install Reactotron! Installing Homebrew now.'
    # Install Homebrew
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    brew update
fi

brew install --cask reactotron
