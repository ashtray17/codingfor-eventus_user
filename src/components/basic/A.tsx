import React, { forwardRef } from 'react';

export interface AProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {}

/**
 * 기본 a 컴포넌트
 */
export const A = forwardRef<HTMLAnchorElement, AProps>(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <a
      ref={ref}
      className={className}
      {...props}
    >
      {children}
    </a>
  );
});

A.displayName = 'A';
