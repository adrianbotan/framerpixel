import PixelLoopingSimulator from "../../components/pixel-looping-simulator"

export default function SimulatorPage() {
  return (
    <div className="h-screen flex flex-col">
      <div className="p-4 border-b">
        <h1 className="text-3xl font-bold">PixelLooping Simulator</h1>
        <p className="text-gray-500 dark:text-gray-400">Adjust properties and see the animation in real-time</p>
      </div>

      <div className="flex-1 p-4">
        <PixelLoopingSimulator />
      </div>
    </div>
  )
}
