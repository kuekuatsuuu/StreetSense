"use client"
import { useState } from "react"

export default function WebcamPage() {
  const [webcamActive, setWebcamActive] = useState(false)

  const handleWebcamToggle = async () => {
    try {
      if (webcamActive) {
        await fetch("http://127.0.0.1:5000/stop_webcam", { method: "POST" })
      } else {
        await fetch("http://127.0.0.1:5000/start_webcam", { method: "POST" })
      }
      setWebcamActive(!webcamActive)
    } catch (error) {
      console.error("Error:", error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-4">Pedestrian Detection</h1>
      <button
        className={`px-6 py-3 rounded-lg font-semibold text-white transition 
                           ${webcamActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
        onClick={handleWebcamToggle}
      >
        {webcamActive ? "Stop Webcam" : "Start Webcam"}
      </button>
      {webcamActive && (
        <div className="mt-6 border-2 border-gray-400 rounded-lg overflow-hidden">
          <img src="http://127.0.0.1:5000/video_feed" alt="Webcam Feed" className="w-[640px] h-[480px]" />
        </div>
      )}
    </div>
  )
}
