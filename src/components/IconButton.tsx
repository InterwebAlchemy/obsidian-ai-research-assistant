import React, { useEffect, useRef } from 'react'
import { setIcon } from 'obsidian'

export interface IconButtonProps extends React.ComponentPropsWithRef<'button'> {
  iconName: string
  a11yText: string
  buttonStyle?: 'primary' | 'secondary' | 'danger' | 'success'
  buttonVariant?: 'outlined' | 'iconOnly'
}

const IconButton = ({
  iconName,
  a11yText,
  children,
  className,
  buttonStyle = 'secondary',
  buttonVariant = 'outlined',
  ...props
}: IconButtonProps): React.ReactElement => {
  const iconButton = useRef<HTMLElement>()

  useEffect(() => {
    if (typeof iconButton.current !== 'undefined') {
      const button = iconButton.current

      if (button instanceof HTMLElement) {
        setIcon(button, iconName)
      }
    }
  }, [iconButton.current, iconName])

  return (
    <button
      className={`ai-research-assistant__icon-button ai-research-assistant__icon-button--${buttonStyle} ai-research-assistant__icon-button--${buttonVariant} clickable-icon ${
        typeof className !== 'undefined' ? ` ${className}` : ''
      }`}
      title={a11yText}
      {...props}
    >
      {/* @ts-expect-error */}
      <div className="ai-research-assistant__icon-button__icon" ref={iconButton} />
      <div className="ai-research-assistant__icon-button__a11y-text">{a11yText}</div>
      {children}
    </button>
  )
}

export default IconButton
