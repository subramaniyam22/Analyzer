"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Tabs = ({ children, defaultValue, className }: any) => {
    const [value, setValue] = React.useState(defaultValue);
    return (
        <div className={cn("space-y-4", className)}>
            {React.Children.map(children, (child) =>
                React.cloneElement(child, { value, setValue })
            )}
        </div>
    );
};

const TabsList = ({ children, value, setValue, className }: any) => (
    <div className={cn("inline-flex h-12 items-center justify-center rounded-2xl bg-secondary p-1 text-muted-foreground", className)}>
        {React.Children.map(children, (child) =>
            React.cloneElement(child, { active: child.props.value === value, onClick: () => setValue(child.props.value) })
        )}
    </div>
);

const TabsTrigger = ({ children, active, onClick, className }: any) => (
    <button
        onClick={onClick}
        className={cn(
            "inline-flex items-center justify-center whitespace-nowrap rounded-xl px-6 py-2 text-sm font-bold ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
            active ? "bg-background text-foreground shadow-sm" : "hover:text-foreground"
            , className)}
    >
        {children}
    </button>
);

const TabsContent = ({ children, value, activeValue, className }: any) => {
    if (value !== activeValue) return null;
    return <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>{children}</div>;
};

// Simplified TabsContent for the wrapper pattern
const TabsContentWrapper = ({ children, value, setValue, activeValue, ...props }: any) => {
    // This is a bit tricky with React.Children.map, usually people use Context
    return <div {...props}>{children}</div>
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
