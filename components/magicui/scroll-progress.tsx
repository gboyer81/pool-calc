'use client'

import { cn } from '@/lib/utils'
import { motion, MotionProps, useScroll } from 'motion/react'
import React from 'react'
interface ScrollProgressProps
  extends Omit<React.HTMLAttributes<HTMLElement>, keyof MotionProps> {}

export const ScrollProgress = React.forwardRef<
  HTMLDivElement,
  ScrollProgressProps
>(({ className, ...props }, ref) => {
  const { scrollYProgress } = useScroll()

  return (
    <motion.div
      ref={ref}
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-[1.5px] origin-left bg-gradient-to-r from-[#1e00ff] via-[#00ddff] to-[#ff00d4]',
        className
      )}
      style={{
        scaleX: scrollYProgress,
      }}
      {...props}
    />
  )
})

ScrollProgress.displayName = 'ScrollProgress'
