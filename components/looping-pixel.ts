
/**
 * Author: PixelLooping (ChatGPT)
 * Type: Oscillating/Looping Animation Component (Pure)
 * Version: 1.3.12
 * Related To: 1.3.5 (Base Stable Version)
 * Relation Type: Direct clean continuation from 1.3.5
 *
 * Features:
 * - Clean sine wave oscillation
 * - Asymmetric top/bottom loop distances
 * - Start offset control
 * - Adjustable loop speed
 * - Axis (X/Y) switching
 * - Optional visual guides
 * - No hosting features yet (future modular extension)
 *
 * Component Properties:
 * - loopDistanceTop (Number)
 * - loopDistanceBottom (Number)
 * - startPosition (Number)
 * - loopSpeed (Number)
 * - loopAxis (Enum: "x" | "y")
 * - showGuides (Boolean)
 */

import * as React from "react"
import { useEffect, useMemo, useRef, useState, useLayoutEffect } from "react"
import {
    motion,
    addPropertyControls,
    ControlType,
    useMotionValue,
    useAnimationFrame,
    useTime,
    RenderTarget,
} from "framer"

/**
 * Hook to track the size of the component container.
 */
function useComponentSize(ref) {
    const [size, setSize] = useState({ width: 0, height: 0 })
    useLayoutEffect(() => {
        const element = ref.current
        if (!element) return
        const update = () =>
            setSize({ width: element.offsetWidth, height: element.offsetHeight })
        update()
        const resizeObserver = new ResizeObserver(update)
        resizeObserver.observe(element)
        return () => resizeObserver.disconnect()
    }, [ref])
    return size
}

/**
 * Main PixelLooping Component.
 */
export default function PixelLooping(props) {
    const {
        loopDistanceTop = 1,
        loopDistanceBottom = 1,
        startPosition = 0,
        loopSpeed = 50,
        loopAxis = "y",
        showGuides = false,
        children,
    } = props

    const elementRef = useRef(null)
    const bounds = useComponentSize(elementRef)
    const time = useTime()
    const startAngleRef = useRef(0)
    const isAnimatingRef = useRef(false)

    // Setup based on bounds
    const referenceSize = loopAxis === "y" ? bounds.height : bounds.width
    const squareSize = Math.min(bounds.width, bounds.height)
    const center = referenceSize / 2

    // Amplitudes for asymmetric loop
    const amplitudeTop = loopDistanceBottom * referenceSize
    const amplitudeBottom = loopDistanceTop * referenceSize
    const totalAmplitude = amplitudeTop + amplitudeBottom
    const effectiveAmplitude = totalAmplitude / 2
    const centerOffset = (amplitudeTop - amplitudeBottom) / 2

    // Start position relative to center
    const targetStaticOffset = useMemo(() => {
        return startPosition * referenceSize
    }, [startPosition, referenceSize])

    const axisValue = useMotionValue(targetStaticOffset)

    /**
     * Calculate frequency of oscillation based on loopSpeed.
     */
    const frequency = useMemo(() => {
        const shouldAnimate = referenceSize > 0 && totalAmplitude > 0 && loopSpeed > 0
        if (!shouldAnimate) {
            startAngleRef.current = 0
            isAnimatingRef.current = false
            return 0
        }

        const startRelativeToOscillationCenter = targetStaticOffset - centerOffset
        const normalizedStart = effectiveAmplitude > 0
            ? Math.max(-1, Math.min(1, startRelativeToOscillationCenter / effectiveAmplitude))
            : 0

        startAngleRef.current = !isNaN(Math.asin(normalizedStart))
            ? Math.asin(normalizedStart)
            : 0
        isAnimatingRef.current = true

        return (loopSpeed / 100) * 0.75
    }, [
        referenceSize,
        amplitudeTop,
        amplitudeBottom,
        loopSpeed,
        targetStaticOffset,
        centerOffset,
        effectiveAmplitude,
        totalAmplitude,
    ])

    // Set start position immediately
    useEffect(() => {
        axisValue.set(targetStaticOffset)
    }, [targetStaticOffset, axisValue])

    /**
     * Animation frame updates position over time following a sine wave.
     */
    useAnimationFrame(() => {
        if (!isAnimatingRef.current || totalAmplitude <= 0 || frequency <= 0) {
            if (axisValue.get() !== targetStaticOffset) {
                axisValue.set(targetStaticOffset)
            }
            return
        }

        const t = time.get() / 1000 // convert ms to seconds
        const phase = startAngleRef.current + t * frequency * 2 * Math.PI
        const sineValue = Math.sin(phase)
        const newPosition = centerOffset + sineValue * effectiveAmplitude

        axisValue.set(!isNaN(newPosition) ? newPosition : targetStaticOffset)
    })

    /**
     * Style for drawing guide dots.
     */
    const guideDotStyle = (direction) => ({
        position: "absolute",
        width: direction === "y" ? "100%" : "1px",
        height: direction === "x" ? "100%" : "1px",
        top: direction === "x" ? 0 : undefined,
        left: direction === "y" ? 0 : undefined,
        background: `repeating-linear-gradient(to ${direction === "y" ? "right" : "bottom"}, rgba(255,255,255,0.6), rgba(255,255,255,0.6) 1px, rgba(0,0,0,0.4) 1px, rgba(0,0,0,0.4) 2px)`,
        pointerEvents: "none",
        zIndex: 10,
    })

    // Positions for guides
    const guideTopPos = center - amplitudeBottom - squareSize / 2
    const guideBottomPos = center + amplitudeTop + squareSize / 2

    return (
        <div
            ref={elementRef}
            style={{
                width: "100%",
                height: "100%",
                position: "relative",
                overflow: "visible",
            }}
        >
            {/* Render guides only in Canvas mode */}
            {RenderTarget.current() === RenderTarget.canvas &&
                showGuides &&
                totalAmplitude > 0 && (
                    <>
                        <div style={loopAxis === "y" ? { ...guideDotStyle("y"), top: `${guideTopPos}px` } : { ...guideDotStyle("x"), left: `${guideTopPos}px` }} />
                        <div style={loopAxis === "y" ? { ...guideDotStyle("y"), top: `${guideBottomPos}px` } : { ...guideDotStyle("x"), left: `${guideBottomPos}px` }} />
                        <div style={loopAxis === "y" ? { ...guideDotStyle("y"), top: `${center}px` } : { ...guideDotStyle("x"), left: `${center}px` }} />
                    </>
                )}

            {/* The animated square */}
            <motion.div
                style={{
                    width: squareSize,
                    height: squareSize,
                    backgroundColor: "purple",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    translateX: "-50%",
                    translateY: "-50%",
                    x: loopAxis === "x" ? axisValue : 0,
                    y: loopAxis === "y" ? axisValue : 0,
                    transformOrigin: "center",
                }}
            />
        </div>
    )
}

// Controls for Framer UI
addPropertyControls(PixelLooping, {
    loopDistanceTop: {
        type: ControlType.Number,
        title: "Top Distance",
        defaultValue: 1,
        min: 0,
        max: 10,
        step: 0.25,
    },
    loopDistanceBottom: {
        type: ControlType.Number,
        title: "Bottom Distance",
        defaultValue: 1,
        min: 0,
        max: 10,
        step: 0.25,
    },
    startPosition: {
        type: ControlType.Number,
        title: "Start Offset",
        defaultValue: 0,
        min: -5,
        max: 5,
        step: 0.25,
        displayStepper: true,
    },
    loopSpeed: {
        type: ControlType.Number,
        title: "Loop Speed",
        defaultValue: 50,
        min: 0,
        max: 100,
        step: 1,
    },
    loopAxis: {
        type: ControlType.SegmentedEnum,
        title: "Loop Axis",
        options: ["x", "y"],
        defaultValue: "y",
    },
    showGuides: {
        type: ControlType.Boolean,
        title: "Show Guides",
        defaultValue: false,
    },
})