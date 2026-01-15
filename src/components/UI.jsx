import React, { useEffect, useRef } from 'react'

export const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null)
  const bodyRef = useRef(null)

  const updateScrollbar = () => {
    const body = bodyRef.current
    if (!body) return

    const trackPadding = 16
    const minThumb = 32
    const trackHeight = Math.max(body.clientHeight - trackPadding * 2, 0)
    if (trackHeight === 0) {
      body.style.setProperty('--scrollbar-thumb-height', '0px')
      body.style.setProperty('--scrollbar-thumb-top', `${trackPadding}px`)
      return
    }

    const { scrollTop, scrollHeight, clientHeight } = body
    let thumbHeight = trackHeight
    let thumbTop = trackPadding

    if (scrollHeight > clientHeight) {
      thumbHeight = Math.max((clientHeight / scrollHeight) * trackHeight, minThumb)
      const maxThumbTop = trackHeight - thumbHeight
      const scrollRatio = scrollTop / (scrollHeight - clientHeight)
      thumbTop = trackPadding + maxThumbTop * scrollRatio
    }

    body.style.setProperty('--scrollbar-thumb-height', `${thumbHeight}px`)
    body.style.setProperty('--scrollbar-thumb-top', `${thumbTop}px`)
  }

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'auto'
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const body = bodyRef.current
    if (!body) return

    const handleScroll = () => updateScrollbar()
    const handleResize = () => updateScrollbar()

    updateScrollbar()
    body.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)

    return () => {
      body.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    updateScrollbar()
  })

  if (!isOpen) return null

  return (
    <div className="modal-backdrop">
      <div
        ref={modalRef}
        className="modal"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button onClick={onClose} className="modal-close">
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div ref={bodyRef} className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

export const Card = ({ children, className = '' }) => (
  <div className={`card ${className}`}>{children}</div>
)

export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  className = '',
  disabled,
}) => {
  const variants = {
    primary: 'btn btn--primary',
    secondary: 'btn btn--secondary',
    danger: 'btn btn--danger',
    ghost: 'btn btn--ghost',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}
