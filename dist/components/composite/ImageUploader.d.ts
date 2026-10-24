import { default as React } from 'react';
export interface ImageUploaderProps extends React.HTMLAttributes<HTMLElement> {
    uploadEndpoint?: string;
    listEndpoint?: string;
    statusBase?: string;
    batchStatusEndpoint?: string;
    beginUploadEndpoint?: string;
    chunkEndpointBase?: string;
    completeEndpointBase?: string;
    accept?: string;
    maxSizeMb?: number;
    memberMaxSizeMb?: number;
    chunkSizeMb?: number;
    title?: string;
    description?: string;
    chooseLabel?: string;
    copyLabel?: string;
    copyAllLabel?: string;
    copiedLabel?: string;
    copyAllCopiedLabel?: string;
    processingLabel?: string;
    readyLabel?: string;
    deleteLabel?: string;
    emptyLabel?: string;
}
export declare const ImageUploader: React.FC<ImageUploaderProps>;
