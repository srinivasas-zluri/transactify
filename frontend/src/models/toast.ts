export type Toast = {
    error: (message: string) => void;
    success: (message: string) => void;
    info: (message: string) => void;
    warning: (message: string) => void;
};