import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils'; // Assuming you have a utils file for cn, if not I'll handle it.

// If cn is not available, I'll define a simple version or check if it exists. 
// Based on other components, it likely exists.

const Dialog = ({ open, onOpenChange, children }) => {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-md animate-in fade-in-0">
            <div className="fixed inset-0" onClick={() => onOpenChange(false)} />
            {children}
        </div>
    );
};

const DialogContent = ({ className, children, ...props }) => {
    return (
        <div
            className={cn(
                "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg md:w-full animate-in zoom-in-95 slide-in-from-bottom-10",
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
};

const DialogHeader = ({ className, ...props }) => (
    <div
        className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
        {...props}
    />
);

const DialogFooter = ({ className, ...props }) => (
    <div
        className={cn(
            "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
            className
        )}
        {...props}
    />
);

const DialogTitle = ({ className, ...props }) => (
    <h3
        className={cn("text-lg font-semibold leading-none tracking-tight", className)}
        {...props}
    />
);

const DialogDescription = ({ className, ...props }) => (
    <p
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
);

export {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
};
