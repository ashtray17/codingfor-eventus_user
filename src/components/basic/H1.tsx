import React, { forwardRef } from 'react';

export interface H1Props extends React.HTMLAttributes<HTMLHeadingElement> {}

/**
 * 기본 h1 컴포넌트
 */
export const H1 = forwardRef<HTMLHeadingElement, H1Props>(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <h1
      ref={ref}
      className={className}
      {...props}
    >
      {children}
    </h1>
  );
});

H1.displayName = 'H1';
