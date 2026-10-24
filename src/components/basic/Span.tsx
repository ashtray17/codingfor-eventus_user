import React, { forwardRef } from 'react';

export interface SpanProps extends React.HTMLAttributes<HTMLSpanElement> {}

/**
 * 기본 span 컴포넌트
 */
export const Span = forwardRef<HTMLSpanElement, SpanProps>(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <span
      ref={ref}
      className={className}
      {...props}
    >
      {children}
    </span>
  );
});

Span.displayName = 'Span';
