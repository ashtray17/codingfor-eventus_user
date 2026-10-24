import React, { forwardRef } from 'react';

export interface H2Props extends React.HTMLAttributes<HTMLHeadingElement> {}

/**
 * 기본 h2 컴포넌트
 */
export const H2 = forwardRef<HTMLHeadingElement, H2Props>(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <h2
      ref={ref}
      className={className}
      {...props}
    >
      {children}
    </h2>
  );
});

H2.displayName = 'H2';
