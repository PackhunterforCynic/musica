import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { pageVariants } from './motionVariants';

interface PageTransitionProps {
  children: React.ReactNode;
  routeKey?: string;
  className?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  routeKey,
  className = 'w-full flex-1 flex flex-col',
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
