'use client'

import { ChevronDown } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface SimpleDropdownProps {
  id: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function SimpleDropdown({
  id: _id,
  value,
  options,
  onChange,
  disabled = false,
  placeholder = 'Select option',
}: SimpleDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(
    null,
  )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      // Check if click is on dropdown button or inside the portal menu
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        !(target instanceof Element && target.closest('.dropdown-menu-portal'))
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Measure and set menu position relative to viewport to avoid clipping
  const measure = () => {
    const btn = buttonRef.current
    if (!btn) return
    const rect = btn.getBoundingClientRect()
    setMenuRect({ top: rect.bottom, left: rect.left, width: rect.width })
  }

  useEffect(() => {
    if (!isOpen) return
    measure()
    const onScroll = () => measure()
    const onResize = () => measure()
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
    }
  }, [isOpen])

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
    }
  }

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
  }

  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        ref={buttonRef}
        className="w-full max-w-full min-h-[42px] px-3 py-2 text-left rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between transition-colors border border-[var(--tf-border)] bg-[var(--tf-input-fill)] text-[var(--tf-text-primary)] hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-transparent overflow-hidden"
      >
        <span className="truncate text-sm font-medium flex-1 min-w-0">
          {selectedOption
            ? selectedOption.value === ''
              ? selectedOption.label
              : selectedOption.label
            : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 ml-1 flex-shrink-0 transition-transform text-[var(--tf-text-muted)] ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen &&
        menuRect &&
        createPortal(
          <div
            className="dropdown-menu-portal"
            style={{
              position: 'fixed',
              top: menuRect.top,
              left: Math.max(8, Math.min(menuRect.left, window.innerWidth - menuRect.width - 8)),
              width: Math.min(menuRect.width, window.innerWidth - 16),
              zIndex: 9999,
            }}
          >
            <div className="tf-popup-surface mt-1 border border-[var(--tf-border)] rounded-lg shadow-xl max-h-48 overflow-y-auto max-w-full">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionClick(option.value)}
                  className={`w-full max-w-full px-3 py-2 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg truncate ${
                    option.value === value
                      ? 'bg-primary/15 text-primary font-semibold'
                      : 'text-[var(--tf-text-primary)] hover:bg-[var(--tf-nav-hover)] font-medium'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
