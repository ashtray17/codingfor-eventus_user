import React, { forwardRef } from 'react';

export interface H3Props extends React.HTMLAttributes<HTMLHeadingElement> {}

/**
 * 기본 h3 컴포넌트
 */
export const H3 = forwardRef<HTMLHeadingElement, H3Props>(({
  children,
  className = '',
  ...props
}, ref) => {
  return (
    <h3
      ref={ref}
      className={className}
      {...props}
    >
      {children}
    </h3>
  );
});

H3.displayName = 'H3';
