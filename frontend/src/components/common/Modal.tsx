'use client';

import { ReactNode, useEffect } from 'react';
import clsx from 'clsx';

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal = ({ isOpen, title, children, onClose, footer, size = 'md' }: ModalProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={clsx('bg-white rounded-lg shadow-lg', sizeClasses[size])}>
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-4 max-h-96 overflow-y-auto">{children}</div>

        {footer && <div className="px-6 py-4 border-t bg-gray-50 rounded-b-lg">{footer}</div>}
      </div>
    </div>
  );
};
