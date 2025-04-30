"use client"

import { motion, useMotionValue, animate } from "framer-motion"
import { useEffect, useRef } from "react"
import { addPropertyControls, ControlType } from "framer"

function Magnetic({
  component,
  axis = "all",
  attractSpeed = 0.3,
  returnSpeed = 0.3,
  smoothness = 1,
  delayStart = 0,
  delayEnd = 0.3,
  maxDistanceX = 100,
  maxDistanceY = 100,
  triggerDistanceX = 150,
  triggerDistanceY = 150,
  curveFollow = false,
}) {
  const containerRef = useRef(null)
  const childRef = useRef(null)
  const x = useMotionValue(0)
  const y = useMotionValue(0)

  useEffect(() => {
    const node = childRef.current
    if (!node) return

    const handleMouseMove = (event) => {
      const rect = node.getBoundingClientRect()
      const centerX = rect.left + rect.width / 2
      const centerY = rect.top + rect.height / 2
      const dx = event.clientX - centerX
      const dy = event.clientY - centerY

      const inXRange = Math.abs(dx) < triggerDistanceX
      const inYRange = Math.abs(dy) < triggerDistanceY

      if (inXRange && inYRange) {
        let moveX = 0
        let moveY = 0

        if (axis === "all" || axis === "x") {
          const influence = axis === "x" ? 1 - Math.abs(dy) / triggerDistanceY : 1
          moveX = (dx / triggerDistanceX) * Math.min(Math.abs(dx), maxDistanceX) * influence
        }

        if (axis === "all" || axis === "y") {
          const influence = axis === "y" ? 1 - Math.abs(dx) / triggerDistanceX : 1
          moveY = (dy / triggerDistanceY) * Math.min(Math.abs(dy), maxDistanceY) * influence
        }

        if (curveFollow && (axis === "all" || axis === "x" || axis === "y")) {
          const distance = Math.sqrt(dx * dx + dy * dy)
          const arcOffset = 0.2 * distance
          if (axis === "x") {
            moveY = arcOffset * (dy > 0 ? 1 : -1)
          } else if (axis === "y") {
            moveX = arcOffset * (dx > 0 ? 1 : -1)
          } else {
            moveY += arcOffset * (dy > 0 ? 1 : -1)
          }
        }

        const distance = Math.sqrt(dx * dx + dy * dy)
        const dynamicDamping = Math.max(
          1,
          ((distance / Math.max(triggerDistanceX, triggerDistanceY)) * 10) / (attractSpeed * smoothness),
        )

        setTimeout(() => {
          animate(x, moveX, {
            type: "spring",
            stiffness: 100,
            damping: dynamicDamping,
          })
          animate(y, moveY, {
            type: "spring",
            stiffness: 100,
            damping: dynamicDamping,
          })
        }, delayStart * 1000)
      } else {
        setTimeout(() => {
          animate(x, 0, {
            type: "spring",
            stiffness: 100,
            damping: 10 / (returnSpeed * smoothness),
          })
          animate(y, 0, {
            type: "spring",
            stiffness: 100,
            damping: 10 / (returnSpeed * smoothness),
          })
        }, delayEnd * 1000)
      }
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [
    axis,
    attractSpeed,
    returnSpeed,
    smoothness,
    delayStart,
    delayEnd,
    maxDistanceX,
    maxDistanceY,
    triggerDistanceX,
    triggerDistanceY,
    curveFollow,
    x,
    y,
  ])

  const renderedChild = component ? (
    <div ref={childRef} style={{ width: "100%", height: "100%" }}>
      {component}
    </div>
  ) : (
    <div ref={childRef} style={{ padding: 20, background: "#eee" }}>
      Attach a component from assets
    </div>
  )

  return (
    <motion.div ref={containerRef} style={{ x, y, width: "fit-content", height: "fit-content" }}>
      {renderedChild}
    </motion.div>
  )
}

addPropertyControls(Magnetic, {
  component: {
    type: ControlType.ComponentInstance,
    title: "Component",
  },
  axis: {
    type: ControlType.Enum,
    options: ["all", "x", "y"],
    optionTitles: ["All", "X Axis", "Y Axis"],
  },
  attractSpeed: {
    type: ControlType.Number,
    min: 0.01,
    max: 1,
    step: 0.01,
    title: "Attract Speed",
  },
  returnSpeed: {
    type: ControlType.Number,
    min: 0.01,
    max: 1,
    step: 0.01,
    title: "Return Speed",
  },
  smoothness: { type: ControlType.Number, min: 0.1, max: 2, step: 0.01 },
  delayStart: { type: ControlType.Number, min: 0, max: 2, step: 0.1 },
  delayEnd: { type: ControlType.Number, min: 0, max: 2, step: 0.1 },
  maxDistanceX: {
    type: ControlType.Number,
    min: 10,
    max: 500,
    title: "Max Distance X",
  },
  maxDistanceY: {
    type: ControlType.Number,
    min: 10,
    max: 500,
    title: "Max Distance Y",
  },
  triggerDistanceX: {
    type: ControlType.Number,
    min: 10,
    max: 1000,
    title: "Trigger Distance X",
  },
  triggerDistanceY: {
    type: ControlType.Number,
    min: 10,
    max: 1000,
    title: "Trigger Distance Y",
  },
  curveFollow: { type: ControlType.Boolean, title: "Curve Follow" },
})

export default Magnetic
