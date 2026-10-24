import React, { forwardRef } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

/**
 * 기본 여러 줄 입력 컴포넌트
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  className = '',
  ...props
}, ref) => (
  <textarea ref={ref} className={className} {...props} />
));

Textarea.displayName = 'Textarea';
