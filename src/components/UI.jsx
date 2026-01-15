import React, { useEffect, useRef } from 'react'

export const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null)

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
        <div className="modal-body">{children}</div>
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
