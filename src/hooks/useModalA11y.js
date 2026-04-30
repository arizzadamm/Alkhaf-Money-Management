import { useEffect, useId, useRef } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

export const useModalA11y = (onClose) => {
  const titleId = useId();
  const modalRef = useRef(null);

  useEffect(() => {
    const previousFocusedElement = document.activeElement;
    const root = modalRef.current;

    if (root) {
      const focusable = root.querySelectorAll(FOCUSABLE_SELECTORS);
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }

    const handleKeydown = (event) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !modalRef.current) return;
      const focusableElements = modalRef.current.querySelectorAll(FOCUSABLE_SELECTORS);
      if (focusableElements.length === 0) return;

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const isShiftTab = event.shiftKey;

      if (isShiftTab && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!isShiftTab && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeydown);
    return () => {
      document.removeEventListener('keydown', handleKeydown);
      if (previousFocusedElement && typeof previousFocusedElement.focus === 'function') {
        previousFocusedElement.focus();
      }
    };
  }, [onClose]);

  const handleOverlayClick = (event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return {
    modalRef,
    titleId,
    handleOverlayClick,
  };
};
