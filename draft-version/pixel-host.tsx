"use client"

/**
 * Author: PixelHost (v0)
 * Type: Component Hosting Container with Random Background
 * Version: 1.0.0
 */

import { addPropertyControls, ControlType } from "framer"
import { useState, useEffect } from "react"

function getRandomColor() {
  const letters = "0123456789ABCDEF"
  let color = "#"
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

export default function PixelHost(props) {
  const {
    width = 100,
    height = 100,
    children,
    cornerRadius = 0,
    useRandomColor = true,
    backgroundColor = "#3291FF",
    padding = 0,
  } = props

  const [randomColor, setRandomColor] = useState(getRandomColor())

  useEffect(() => {
    setRandomColor(getRandomColor())
  }, [])

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: useRandomColor ? randomColor : backgroundColor,
        borderRadius: cornerRadius,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding,
        overflow: "hidden",
        position: "relative",
      }}
    >
      {children}
    </div>
  )
}

addPropertyControls(PixelHost, {
  width: {
    type: ControlType.Number,
    title: "Width",
    defaultValue: 100,
    min: 10,
    max: 1000,
    step: 1,
  },
  height: {
    type: ControlType.Number,
    title: "Height",
    defaultValue: 100,
    min: 10,
    max: 1000,
    step: 1,
  },
  cornerRadius: {
    type: ControlType.Number,
    title: "Corner Radius",
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 1,
  },
  useRandomColor: {
    type: ControlType.Boolean,
    title: "Random Color",
    defaultValue: true,
  },
  backgroundColor: {
    type: ControlType.Color,
    title: "Background",
    defaultValue: "#3291FF",
    hidden(props) {
      return props.useRandomColor
    },
  },
  padding: {
    type: ControlType.Number,
    title: "Padding",
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 1,
  },
})
