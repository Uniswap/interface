import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { CSSTransitionGroup } from 'react-transition-group'

import Modal from '../Modal'
import QrCodeSVG from '../../assets/images/qr-code.svg'
import QrScanner from '../../libraries/qr-scanner'
import './qr-code.scss'

class QrCode extends Component {
  static propTypes = {
    onValueReceived: PropTypes.func
  }

  static defaultProps = {
    onValueReceived() {}
  }

  state = {
    videoOpen: false,
    stream: null
  }

  componentDidUpdate() {
    const { videoOpen, stream } = this.state

    if (videoOpen && !stream && this.videoRef) {
      this.startStreamingVideo(this.videoRef)
    } else if (!videoOpen && stream) {
      this.setState({ stream: null })
    }
  }

  startStreamingVideo(videoRef) {
    if (navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then(stream => {
          videoRef.srcObject = stream
          new QrScanner(videoRef, val => {
            this.closeVideo()
            this.props.onValueReceived(val)
          })
          this.setState({
            stream: stream.getTracks()[0]
          })
        })
        .catch(error => {
          this.closeVideo()
          console.error(error)
        })
    }
  }

  openVideo = () => {
    this.setState({ videoOpen: true })
  }

  closeVideo = () => {
    if (this.state.stream) {
      this.state.stream.stop()
    }
    this.setState({ videoOpen: false, stream: null })
    this.videoRef = null
  }

  setVideoRef = element => {
    this.videoRef = element
  }

  renderQrReader() {
    if (this.state.videoOpen) {
      return (
        <Modal key="modal" onClose={this.closeVideo}>
          <CSSTransitionGroup
            transitionName="qr-modal"
            transitionAppear={true}
            transitionLeave={true}
            transitionAppearTimeout={200}
            transitionLeaveTimeout={200}
            transitionEnterTimeout={200}
          >
            <div className="qr-code__modal">
              <video playsInline muted autoPlay ref={this.setVideoRef} className="qr-code__video" />
            </div>
          </CSSTransitionGroup>
        </Modal>
      )
    }

    return null
  }

  render() {
    return [
      <img
        key="icon"
        src={QrCodeSVG}
        alt="code"
        onClick={() => {
          this.state.videoOpen ? this.closeVideo() : this.openVideo()
        }}
      />,
      this.renderQrReader()
    ]
  }
}

export default QrCode
