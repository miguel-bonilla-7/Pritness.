import { useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Trash2 } from 'lucide-react'

interface SwipeToDeleteProps {
  /** Si retorna Promise<boolean>, se espera confirmación. true = eliminar, false = cancelar. */
  onDelete: () => void | Promise<boolean>
  onTap?: () => void
  children: React.ReactNode
}

const THRESHOLD = -72

export function SwipeToDelete({ onDelete, onTap, children }: SwipeToDeleteProps) {
  const x = useMotionValue(0)
  const deleteOpacity = useTransform(x, [0, THRESHOLD], [0, 1])
  const deleteScale = useTransform(x, [0, THRESHOLD], [0.6, 1])
  const constraintsRef = useRef(null)

  const handleDragEnd = async () => {
    if (x.get() < THRESHOLD) {
      const result = onDelete()
      const proceed = result instanceof Promise ? await result : true
      if (proceed) {
        animate(x, -500, { duration: 0.25, ease: 'easeIn' }).then(() => {
          // El padre ya eliminó; el componente se desmontará
        })
      } else {
        animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
      }
    } else {
      animate(x, 0, { type: 'spring', stiffness: 400, damping: 30 })
    }
  }

  return (
    <div ref={constraintsRef} className="relative overflow-hidden rounded-2xl">
      {/* Delete background */}
      <motion.div
        className="absolute inset-y-0 right-0 flex items-center justify-end pr-5 bg-red-500/90 rounded-2xl"
        style={{ opacity: deleteOpacity, left: 0 }}
      >
        <motion.div style={{ scale: deleteScale }}>
          <Trash2 className="w-5 h-5 text-white" />
        </motion.div>
      </motion.div>

      {/* Draggable content */}
      <motion.div
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragConstraints={{ left: THRESHOLD * 1.5, right: 0 }}
        dragElastic={{ left: 0.2, right: 0 }}
        onDragEnd={handleDragEnd}
        onTap={onTap}
        className="relative cursor-grab active:cursor-grabbing"
      >
        {children}
      </motion.div>
    </div>
  )
}
