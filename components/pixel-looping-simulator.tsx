"use client"

/**
 * Author: PixelFramer (v0)
 * Type: Simulator for PixelLooping Animation Component
 * Version: 1.5.0
 * Related To: PixelLooping 1.3.12
 * Relation Type: Simulator/Controller
 *
 * Features:
 * - Canvas zoom controls (5% to 200%)
 * - Animation play/pause controls
 * - Manual stepping through animation cycle
 * - Static guides showing animation boundaries
 * - Property adjustment controls
 * - Side-by-side layout with canvas and controls
 * - Dark/Light mode toggle for canvas
 * - Component testing with other components
 *
 * Simulator Properties:
 * - zoom (Number): Canvas zoom level
 * - isPlaying (Boolean): Animation play state
 * - isManualMode (Boolean): Manual stepping mode
 * - manualPosition (Number): Position in animation cycle when in manual mode
 * - properties (Object): All PixelLooping component properties
 */

import { useState, useRef, useLayoutEffect, useEffect } from "react"
import { Minus, Plus, Play, Pause, ChevronUp, ChevronDown, Moon, Sun } from "lucide-react"
import PixelLooping from "../pixel-looping"
import Magnetic from "../magnetic"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { useTheme } from "next-themes"

/**
 * Hook to track the size of the component container.
 * Identical to the one used in PixelLooping for consistency.
 */
function useComponentSize(ref) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => setSize({ width: element.offsetWidth, height: element.offsetHeight })
    update()
    const resizeObserver = new ResizeObserver(update)
    resizeObserver.observe(element)
    return () => resizeObserver.disconnect()
  }, [ref])
  return size
}

/**
 * Main PixelLoopingSimulator Component.
 * Provides a visual interface for controlling and previewing the PixelLooping component.
 */
export default function PixelLoopingSimulator() {
  // Theme state
  const { theme, setTheme } = useTheme()
  const isDarkMode = theme === "dark"

  // Canvas zoom state
  const [zoom, setZoom] = useState(1)
  const canvasRef = useRef(null)
  const canvasSize = useComponentSize(canvasRef)

  // Animation state
  const [isPlaying, setIsPlaying] = useState(false)
  const [previousSpeed, setPreviousSpeed] = useState(50)
  const [showSpeedControl, setShowSpeedControl] = useState(false)
  const [animationPhase, setAnimationPhase] = useState(0)

  // Manual mode state
  const [isManualMode, setIsManualMode] = useState(false)
  const [manualPosition, setManualPosition] = useState(0) // 0-100% of animation cycle

  // Component selection state
  const [selectedComponent, setSelectedComponent] = useState("pixelLooping")
  const [wrapWithMagnetic, setWrapWithMagnetic] = useState(false)

  // Component properties - match exactly what PixelLooping expects
  const [properties, setProperties] = useState({
    loopDistanceTop: 1,
    loopDistanceBottom: 1,
    startPosition: 0,
    loopSpeed: 0, // Start paused
    loopAxis: "y",
    showGuides: true, // Ensure guides are enabled by default
  })

  // Magnetic properties
  const [magneticProperties, setMagneticProperties] = useState({
    axis: "all",
    attractSpeed: 0.3,
    returnSpeed: 0.3,
    smoothness: 1,
    maxDistanceX: 100,
    maxDistanceY: 100,
    triggerDistanceX: 150,
    triggerDistanceY: 150,
    curveFollow: false,
  })

  /**
   * Update a single property in the properties state.
   */
  const updateProperty = (property: string, value: any) => {
    setProperties((prev) => ({
      ...prev,
      [property]: value,
    }))
  }

  /**
   * Update a single magnetic property.
   */
  const updateMagneticProperty = (property: string, value: any) => {
    setMagneticProperties((prev) => ({
      ...prev,
      [property]: value,
    }))
  }

  /**
   * Reset the animation to start from the beginning.
   */
  const resetAnimation = () => {
    setAnimationPhase(0)
    timeRef.current = Date.now()
  }

  /**
   * Toggle between play and pause states.
   * When pausing, store the current speed.
   * When playing, restore the previous speed and reset animation.
   */
  const togglePlayPause = () => {
    if (isManualMode) {
      // Exit manual mode when play is pressed
      setIsManualMode(false)
    }

    if (isPlaying) {
      // Store the current speed before pausing
      setPreviousSpeed(properties.loopSpeed)
      setProperties((prev) => ({ ...prev, loopSpeed: 0 }))
      setIsPlaying(false)
    } else {
      // Resume with previous speed or default to 50 if it was 0
      setProperties((prev) => ({ ...prev, loopSpeed: previousSpeed || 50 }))
      setIsPlaying(true)
      // Reset animation to start from the beginning
      resetAnimation()
    }
  }

  /**
   * Quick speed adjustment for the animation.
   */
  const adjustSpeed = (increment) => {
    const newSpeed = Math.max(0, Math.min(100, properties.loopSpeed + increment))
    updateProperty("loopSpeed", newSpeed)
    setIsPlaying(newSpeed > 0)
    if (newSpeed > 0) {
      setPreviousSpeed(newSpeed)
    }
  }

  /**
   * Toggle manual mode on/off.
   * When entering manual mode, pause the animation.
   * When exiting, resume animation if previously playing.
   */
  const toggleManualMode = () => {
    if (!isManualMode) {
      // Entering manual mode - pause animation
      if (isPlaying) {
        setPreviousSpeed(properties.loopSpeed)
        setProperties((prev) => ({ ...prev, loopSpeed: 0 }))
        setIsPlaying(false)
      }
    } else {
      // Exiting manual mode - resume animation if there was a previous speed
      if (previousSpeed > 0) {
        setProperties((prev) => ({ ...prev, loopSpeed: previousSpeed }))
        setIsPlaying(true)
        resetAnimation()
      }
    }
    setIsManualMode(!isManualMode)
  }

  /**
   * Calculate animation parameters based on component properties.
   */
  const calculateAnimationParams = () => {
    if (!canvasRef.current) return null

    const referenceSize = properties.loopAxis === "y" ? canvasSize.height : canvasSize.width
    const squareSize = Math.min(canvasSize.width, canvasSize.height)
    const center = referenceSize / 2

    const amplitudeTop = properties.loopDistanceBottom * referenceSize
    const amplitudeBottom = properties.loopDistanceTop * referenceSize
    const totalAmplitude = amplitudeTop + amplitudeBottom
    const effectiveAmplitude = totalAmplitude / 2
    const centerOffset = (amplitudeTop - amplitudeBottom) / 2

    return {
      center,
      amplitudeTop,
      amplitudeBottom,
      totalAmplitude,
      effectiveAmplitude,
      centerOffset,
      squareSize,
      referenceSize,
      isVertical: properties.loopAxis === "y",
    }
  }

  /**
   * Calculate the position value to pass to PixelLooping based on manual mode.
   * In manual mode, we override the startPosition with a calculated value
   * that represents the position in the animation cycle.
   */
  const calculatePositionValue = () => {
    if (!isManualMode) return properties.startPosition

    // Convert manual position (0-100) to a position value
    // that will place the animation at the correct point in its cycle
    const cyclePosition = (manualPosition / 100) * 2 * Math.PI
    const sineValue = Math.sin(cyclePosition)

    const params = calculateAnimationParams()
    if (!params) return properties.startPosition

    // Calculate the position value that will place the animation at this point
    const positionValue = (sineValue * params.effectiveAmplitude + params.centerOffset) / params.referenceSize

    return positionValue
  }

  /**
   * Calculate the static guide positions for the animation boundaries.
   */
  const calculateGuidePositions = () => {
    const params = calculateAnimationParams()
    if (!params) return null

    // Calculate guide positions
    const centerPos = params.center
    const topPos = params.center - params.amplitudeBottom
    const bottomPos = params.center + params.amplitudeTop

    return {
      top: topPos,
      center: centerPos,
      bottom: bottomPos,
      squareSize: params.squareSize,
      isVertical: params.isVertical,
    }
  }

  const timeRef = useRef(Date.now())
  const positionValue = calculatePositionValue()
  const guidePositions = calculateGuidePositions()

  // Ensure animation starts from the correct position
  useEffect(() => {
    if (isPlaying && properties.loopSpeed > 0) {
      // When starting to play, reset the time reference to ensure we start from the beginning
      resetAnimation()
    }
  }, [isPlaying, properties.startPosition])

  // Handle manual position changes
  const handleManualPositionChange = (newPosition) => {
    setManualPosition(newPosition)
  }

  // Toggle theme
  const toggleTheme = () => {
    setTheme(isDarkMode ? "light" : "dark")
  }

  // Render the selected component
  const renderComponent = () => {
    let component

    switch (selectedComponent) {
      case "pixelLooping":
        component = (
          <PixelLooping
            loopDistanceTop={properties.loopDistanceTop}
            loopDistanceBottom={properties.loopDistanceBottom}
            startPosition={isManualMode ? positionValue : properties.startPosition}
            loopSpeed={properties.loopSpeed}
            loopAxis={properties.loopAxis}
            showGuides={false} // We're using our own guides
          />
        )
        break
      case "card":
        component = (
          <div className="flex items-center justify-center w-full h-full">
            <Card className="w-64 h-64 flex items-center justify-center bg-purple-600 text-white">
              <h3 className="text-xl font-bold">Card Component</h3>
            </Card>
          </div>
        )
        break
      case "button":
        component = (
          <div className="flex items-center justify-center w-full h-full">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700">
              Button Component
            </Button>
          </div>
        )
        break
      default:
        component = (
          <PixelLooping
            loopDistanceTop={properties.loopDistanceTop}
            loopDistanceBottom={properties.loopDistanceBottom}
            startPosition={isManualMode ? positionValue : properties.startPosition}
            loopSpeed={properties.loopSpeed}
            loopAxis={properties.loopAxis}
            showGuides={false}
          />
        )
    }

    // Wrap with Magnetic if enabled
    if (wrapWithMagnetic && selectedComponent !== "pixelLooping") {
      return (
        <Magnetic
          component={component}
          axis={magneticProperties.axis}
          attractSpeed={magneticProperties.attractSpeed}
          returnSpeed={magneticProperties.returnSpeed}
          smoothness={magneticProperties.smoothness}
          maxDistanceX={magneticProperties.maxDistanceX}
          maxDistanceY={magneticProperties.maxDistanceY}
          triggerDistanceX={magneticProperties.triggerDistanceX}
          triggerDistanceY={magneticProperties.triggerDistanceY}
          curveFollow={magneticProperties.curveFollow}
        />
      )
    }

    return component
  }

  return (
    <div className="flex flex-row h-full w-full gap-4">
      {/* Canvas area */}
      <div
        ref={canvasRef}
        className="relative w-[70%] border rounded-lg overflow-hidden"
        style={{ backgroundColor: isDarkMode ? "#000000" : "#ffffff" }}
      >
        {/* Static guides showing only top and bottom boundaries */}
        {properties.showGuides && guidePositions && selectedComponent === "pixelLooping" && (
          <>
            {/* Top guide */}
            <div
              className="absolute pointer-events-none z-10"
              style={{
                left: guidePositions.isVertical ? 0 : 0,
                top: guidePositions.isVertical
                  ? `${guidePositions.top}px`
                  : `calc(50% - ${guidePositions.squareSize / 2}px)`,
                width: guidePositions.isVertical ? "100%" : "100%",
                height: guidePositions.isVertical ? "1px" : `${guidePositions.squareSize}px`,
                borderTop: `1px dotted ${isDarkMode ? "white" : "black"}`,
              }}
            />

            {/* Bottom guide */}
            <div
              className="absolute pointer-events-none z-10"
              style={{
                left: guidePositions.isVertical ? 0 : 0,
                top: guidePositions.isVertical
                  ? `${guidePositions.bottom}px`
                  : `calc(50% - ${guidePositions.squareSize / 2}px)`,
                width: guidePositions.isVertical ? "100%" : "100%",
                height: guidePositions.isVertical ? "1px" : `${guidePositions.squareSize}px`,
                borderTop: `1px dotted ${isDarkMode ? "white" : "black"}`,
              }}
            />
          </>
        )}

        <div
          className="w-full h-full transition-transform duration-300 ease-in-out flex items-center justify-center"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "center center",
            backgroundColor: isDarkMode ? "#000000" : "#ffffff",
          }}
        >
          {renderComponent()}
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex gap-2 bg-black text-white dark:bg-gray-800 rounded-lg shadow-md p-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((prev) => Math.max(0.05, prev - 0.1))}
            disabled={zoom <= 0.05}
            className="border-gray-700 text-white hover:text-white hover:bg-gray-800"
          >
            <Minus className="h-4 w-4" />
          </Button>
          <div className="flex items-center px-2 min-w-[60px] justify-center text-white">
            {(zoom * 100).toFixed(0)}%
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setZoom((prev) => Math.min(2, prev + 0.1))}
            disabled={zoom >= 2}
            className="border-gray-700 text-white hover:text-white hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Theme toggle */}
        <div className="absolute bottom-4 left-4">
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="bg-black text-white dark:bg-gray-800 border-gray-700 hover:bg-gray-800 hover:text-white"
          >
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        {/* Play/Pause control with speed adjustment */}
        <div className="absolute top-4 right-4 flex flex-col items-end">
          <div className="flex items-center gap-2 bg-black text-white dark:bg-gray-800 rounded-lg shadow-md p-2">
            {/* Mode indicator */}
            {isManualMode && (
              <Badge variant="outline" className="mr-1 border-gray-700 text-white">
                Manual
              </Badge>
            )}

            {/* Speed control toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-white hover:text-white hover:bg-gray-800"
              onClick={() => setShowSpeedControl(!showSpeedControl)}
              disabled={isManualMode || selectedComponent !== "pixelLooping"}
            >
              Speed: {isPlaying ? properties.loopSpeed : `${previousSpeed} (P)`}
            </Button>

            {/* Play/Pause button */}
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlayPause}
              disabled={isManualMode || selectedComponent !== "pixelLooping"}
              className="border-gray-700 text-white hover:text-white hover:bg-gray-800"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
          </div>

          {/* Quick speed adjustment controls */}
          {showSpeedControl && !isManualMode && selectedComponent === "pixelLooping" && (
            <div className="mt-2 bg-black text-white dark:bg-gray-800 rounded-lg shadow-md p-2 flex flex-col items-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => adjustSpeed(10)}
                className="text-white hover:text-white hover:bg-gray-800"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>

              <Slider
                orientation="vertical"
                className="h-24 my-2"
                value={[isPlaying ? properties.loopSpeed : previousSpeed]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => {
                  const newSpeed = value[0]
                  if (isPlaying) {
                    updateProperty("loopSpeed", newSpeed)
                  }
                  setPreviousSpeed(newSpeed)
                  setIsPlaying(newSpeed > 0 && isPlaying)
                }}
              />

              <Button
                variant="ghost"
                size="sm"
                onClick={() => adjustSpeed(-10)}
                className="text-white hover:text-white hover:bg-gray-800"
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Controls panel */}
      <div className="w-[30%] bg-black text-white dark:bg-gray-800 rounded-lg p-4 shadow-md overflow-y-auto max-h-full">
        <Tabs defaultValue="component" className="w-full">
          <TabsList className="w-full bg-gray-900 mb-4">
            <TabsTrigger value="component" className="flex-1 data-[state=active]:bg-gray-800">
              Component
            </TabsTrigger>
            <TabsTrigger value="properties" className="flex-1 data-[state=active]:bg-gray-800">
              Properties
            </TabsTrigger>
            {wrapWithMagnetic && (
              <TabsTrigger value="magnetic" className="flex-1 data-[state=active]:bg-gray-800">
                Magnetic
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="component" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Select Component</Label>
                <Select value={selectedComponent} onValueChange={setSelectedComponent}>
                  <SelectTrigger className="bg-gray-900 border-gray-700">
                    <SelectValue placeholder="Select component" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-gray-700">
                    <SelectItem value="pixelLooping">PixelLooping</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="button">Button</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedComponent !== "pixelLooping" && (
                <div className="flex items-center space-x-2">
                  <Switch id="wrap-magnetic" checked={wrapWithMagnetic} onCheckedChange={setWrapWithMagnetic} />
                  <Label htmlFor="wrap-magnetic">Wrap with Magnetic</Label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={toggleTheme} />
                <Label htmlFor="dark-mode">Dark Mode</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="properties" className="space-y-6">
            {selectedComponent === "pixelLooping" && (
              <>
                {/* Manual Mode section - only for PixelLooping */}
                <div className="bg-gray-900 p-3 rounded-md border border-gray-700">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-medium">Manual Mode</h3>
                    <Switch id="manual-mode" checked={isManualMode} onCheckedChange={toggleManualMode} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Position: {manualPosition}%</Label>
                    </div>
                    <Slider
                      value={[manualPosition]}
                      min={0}
                      max={100}
                      step={1}
                      disabled={!isManualMode}
                      onValueChange={(value) => handleManualPositionChange(value[0])}
                      className="[&_[role=slider]]:bg-white"
                    />
                    <div className="flex justify-between text-xs text-gray-400">
                      <span>Start</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>End</span>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Appearance section */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Appearance</h3>
                  <div className="flex items-center space-x-2 mb-2">
                    <Switch
                      id="show-guides"
                      checked={properties.showGuides}
                      onCheckedChange={(checked) => updateProperty("showGuides", checked)}
                    />
                    <Label htmlFor="show-guides">Show Guides</Label>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Animation section */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Animation</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Loop Speed: {isPlaying ? properties.loopSpeed : `${previousSpeed} (Paused)`}</Label>
                      </div>
                      <Slider
                        value={[isPlaying ? properties.loopSpeed : previousSpeed]}
                        min={0}
                        max={100}
                        step={1}
                        disabled={isManualMode}
                        onValueChange={(value) => {
                          const newSpeed = value[0]
                          if (isPlaying) {
                            // If playing, update the actual speed
                            updateProperty("loopSpeed", newSpeed)
                            setPreviousSpeed(newSpeed)
                          } else {
                            // If paused, just update the previous speed
                            setPreviousSpeed(newSpeed)
                          }
                          setIsPlaying(newSpeed > 0 && isPlaying)
                        }}
                        className="[&_[role=slider]]:bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Loop Axis</Label>
                      <Select value={properties.loopAxis} onValueChange={(value) => updateProperty("loopAxis", value)}>
                        <SelectTrigger className="bg-gray-900 border-gray-700">
                          <SelectValue placeholder="Select axis" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="x">X (Horizontal)</SelectItem>
                          <SelectItem value="y">Y (Vertical)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Distances section */}
                <div>
                  <h3 className="text-lg font-medium mb-3">Distances</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Top Distance: {properties.loopDistanceTop}</Label>
                      </div>
                      <Slider
                        value={[properties.loopDistanceTop]}
                        min={0}
                        max={10}
                        step={0.25}
                        onValueChange={(value) => updateProperty("loopDistanceTop", value[0])}
                        className="[&_[role=slider]]:bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Bottom Distance: {properties.loopDistanceBottom}</Label>
                      </div>
                      <Slider
                        value={[properties.loopDistanceBottom]}
                        min={0}
                        max={10}
                        step={0.25}
                        onValueChange={(value) => updateProperty("loopDistanceBottom", value[0])}
                        className="[&_[role=slider]]:bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Start Position: {properties.startPosition}</Label>
                      </div>
                      <Slider
                        value={[properties.startPosition]}
                        min={-5}
                        max={5}
                        step={0.25}
                        onValueChange={(value) => updateProperty("startPosition", value[0])}
                        className="[&_[role=slider]]:bg-white"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="magnetic" className="space-y-6">
            {wrapWithMagnetic && (
              <>
                <div>
                  <h3 className="text-lg font-medium mb-3">Magnetic Properties</h3>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Axis</Label>
                      <Select
                        value={magneticProperties.axis}
                        onValueChange={(value) => updateMagneticProperty("axis", value)}
                      >
                        <SelectTrigger className="bg-gray-900 border-gray-700">
                          <SelectValue placeholder="Select axis" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-gray-700">
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="x">X Axis</SelectItem>
                          <SelectItem value="y">Y Axis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Attract Speed: {magneticProperties.attractSpeed}</Label>
                      </div>
                      <Slider
                        value={[magneticProperties.attractSpeed]}
                        min={0.01}
                        max={1}
                        step={0.01}
                        onValueChange={(value) => updateMagneticProperty("attractSpeed", value[0])}
                        className="[&_[role=slider]]:bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Return Speed: {magneticProperties.returnSpeed}</Label>
                      </div>
                      <Slider
                        value={[magneticProperties.returnSpeed]}
                        min={0.01}
                        max={1}
                        step={0.01}
                        onValueChange={(value) => updateMagneticProperty("returnSpeed", value[0])}
                        className="[&_[role=slider]]:bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Max Distance X: {magneticProperties.maxDistanceX}</Label>
                      </div>
                      <Slider
                        value={[magneticProperties.maxDistanceX]}
                        min={10}
                        max={500}
                        step={10}
                        onValueChange={(value) => updateMagneticProperty("maxDistanceX", value[0])}
                        className="[&_[role=slider]]:bg-white"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label>Max Distance Y: {magneticProperties.maxDistanceY}</Label>
                      </div>
                      <Slider
                        value={[magneticProperties.maxDistanceY]}
                        min={10}
                        max={500}
                        step={10}
                        onValueChange={(value) => updateMagneticProperty("maxDistanceY", value[0])}
                        className="[&_[role=slider]]:bg-white"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <Switch
                        id="curve-follow"
                        checked={magneticProperties.curveFollow}
                        onCheckedChange={(checked) => updateMagneticProperty("curveFollow", checked)}
                      />
                      <Label htmlFor="curve-follow">Curve Follow</Label>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
