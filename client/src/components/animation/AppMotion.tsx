import React from 'react';
import { MotionConfig } from 'motion/react';

export const AppMotion: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  );
};
