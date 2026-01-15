import React, { useEffect, useRef } from 'react'

export const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null)
  const bodyRef = useRef(null)

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

    const trackPadding = 16
    const minThumb = 32

    const updateScrollbar = () => {
      const { scrollTop, scrollHeight, clientHeight } = body
      const trackHeight = Math.max(clientHeight - trackPadding * 2, 0)

      if (scrollHeight <= clientHeight || trackHeight === 0) {
        body.style.setProperty('--scrollbar-thumb-height', `${trackHeight}px`)
        body.style.setProperty('--scrollbar-thumb-top', `${trackPadding}px`)
        body.style.setProperty('--scrollbar-visible', '0')
        return
      }

      const thumbHeight = Math.max((clientHeight / scrollHeight) * trackHeight, minThumb)
      const maxThumbTop = trackHeight - thumbHeight
      const scrollRatio = scrollTop / (scrollHeight - clientHeight)
      const thumbTop = trackPadding + maxThumbTop * scrollRatio

      body.style.setProperty('--scrollbar-thumb-height', `${thumbHeight}px`)
      body.style.setProperty('--scrollbar-thumb-top', `${thumbTop}px`)
      body.style.setProperty('--scrollbar-visible', '1')
    }

    updateScrollbar()
    body.addEventListener('scroll', updateScrollbar)
    const resizeObserver = new ResizeObserver(updateScrollbar)
    resizeObserver.observe(body)
    const mutationObserver = new MutationObserver(updateScrollbar)
    mutationObserver.observe(body, { childList: true, subtree: true, characterData: true })
    window.addEventListener('resize', updateScrollbar)

    return () => {
      body.removeEventListener('scroll', updateScrollbar)
      resizeObserver.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener('resize', updateScrollbar)
    }
  }, [isOpen])

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
