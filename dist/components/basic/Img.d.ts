import { default as React } from 'react';
export interface ImgProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    ref?: React.Ref<HTMLImageElement>;
}
/**
 * 기본 img 컴포넌트
 */
export declare const Img: React.ForwardRefExoticComponent<Omit<ImgProps, "ref"> & React.RefAttributes<HTMLImageElement>>;
