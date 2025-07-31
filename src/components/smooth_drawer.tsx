"use client";

/**
 * @author: @dorian_baffier
 * @description: Smooth Drawer - Reusable drawer component
 * @version: 2.0.0
 * @date: 2025-06-26
 * @license: MIT
 * @website: https://kokonutui.com
 * @github: https://github.com/kokonut-labs/kokonutui
 */

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
    Drawer,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import { motion } from "framer-motion";

interface SmoothDrawerProps {
    trigger?: React.ReactNode;
    title?: React.ReactNode;
    description?: React.ReactNode;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    contentClassName?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    // Navigation props for header buttons
    showBackButton?: boolean;
    onBackClick?: () => void;
    backButtonText?: string;
    actionButton?: React.ReactNode;
}

const drawerVariants = {
    hidden: {
        y: "100%",
        opacity: 0,
        rotateX: 5,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
        },
    },
    visible: {
        y: 0,
        opacity: 1,
        rotateX: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8,
            staggerChildren: 0.07,
            delayChildren: 0.2,
        },
    },
};

const itemVariants = {
    hidden: {
        y: 20,
        opacity: 0,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
        },
    },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 300,
            damping: 30,
            mass: 0.8,
        },
    },
};

export default function SmoothDrawer({
    title,
    description,
    children,
    footer,
    className = "",
    contentClassName = "",
    open,
    onOpenChange,
    showBackButton = false,
    onBackClick,
    backButtonText = "Back",
    actionButton,
}: SmoothDrawerProps) {

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent className={`max-w-fit mx-auto p-2 pt-1 rounded-2xl shadow-xl h-[400px] bg-black ${contentClassName}`}>
                <motion.div
                    variants={drawerVariants as any}
                    initial="hidden"
                    animate="visible"
                    className={`w-[1200px] space-y-2 ${className}`}
                >
                    {(title || description || showBackButton || actionButton) && (
                        <motion.div variants={itemVariants as any}>
                            <DrawerHeader className="px-0 space-y-0 pb-1">
                                {/* Navigation buttons row */}
                                <div className="flex items-center justify-between">
                                    {/* Back button on the left */}
                                    <div className="w-24">
                                        {showBackButton && (
                                            <Button
                                                variant="outline"
                                                onClick={onBackClick}
                                                className="h-10 px-4 rounded-lg"
                                            >
                                                {backButtonText}
                                            </Button>
                                        )}
                                    </div>
                                    
                                    {/* Title in center */}
                                    <div className="flex-1 text-center">
                                        {title && (
                                            <DrawerTitle className="text-xl font-semibold tracking-tighter">
                                                {title}
                                            </DrawerTitle>
                                        )}
                                    </div>
                                    
                                    {/* Action button on the right */}
                                    <div className="w-24 flex justify-end">
                                        {actionButton}
                                    </div>
                                </div>
                                
                                {/* Description below navigation */}
                                {description && (
                                    <motion.div variants={itemVariants as any} className="text-center -mt-1">
                                        <DrawerDescription className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400 tracking-tighter">
                                            {description}
                                        </DrawerDescription>
                                    </motion.div>
                                )}
                            </DrawerHeader>
                        </motion.div>
                    )}

                    {children && (
                        <motion.div variants={itemVariants as any}>
                            {children}
                        </motion.div>
                    )}

                    {footer && (
                        <motion.div variants={itemVariants as any}>
                            <DrawerFooter className="flex flex-col gap-3 px-0">
                                {footer}
                            </DrawerFooter>
                        </motion.div>
                    )}
                </motion.div>
            </DrawerContent>
        </Drawer>
    );
}