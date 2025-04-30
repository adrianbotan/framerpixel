import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="container mx-auto py-16 px-4">
      <h1 className="text-4xl font-bold mb-8">PixelFramer</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold mb-4">PixelLooping Simulator</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            Test and adjust the PixelLooping component with interactive controls for animation properties and canvas
            zoom.
          </p>
          <Link href="/simulator">
            <Button>Open Simulator</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
