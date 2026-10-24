import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

/**
 * 기본 입력 필드 컴포넌트
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(({
  className = '',
  ...props
}, ref) => (
  <input ref={ref} className={className} {...props} />
));

Input.displayName = 'Input';
