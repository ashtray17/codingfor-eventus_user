import React, { forwardRef } from 'react';

export interface ImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  ref?: React.Ref<HTMLImageElement>;
}

/**
 * 기본 img 컴포넌트
 */
export const Img = forwardRef<HTMLImageElement, ImgProps>(({
  className = '',
  ...props
}, ref) => {
  return (
    <img
      ref={ref}
      className={className}
      {...props}
    />
  );
});

Img.displayName = 'Img';
