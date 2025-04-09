"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowLeft, Download, Users, AlertTriangle, Shield, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@supabase/supabase-js"
import { useToast } from "@/hooks/use-toast"

// Initialize Supabase client only if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseAvailable = !!supabaseUrl && !!supabaseKey
const supabase = supabaseAvailable ? createClient(supabaseUrl!, supabaseKey!) : null

interface PedestrianData {
  id: string
  timestamp: string
  risk_level: "high" | "medium" | "low"
  confidence: number
  position_x: number
  position_y: number
  session_id: string
}

interface SessionData {
  totalPedestrians: number
  highRisk: number
  mediumRisk: number
  lowRisk: number
  pedestrians?: PedestrianData[]
}

// For time series data
interface TimePoint {
  time: string
  total: number
  high: number
  medium: number
  low: number
}

export default function TryNowPage() {
  const [webcamActive, setWebcamActive] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")
  const [sessionData, setSessionData] = useState<SessionData>({
    totalPedestrians: 0,
    highRisk: 0,
    mediumRisk: 0,
    lowRisk: 0,
  })
  const [pedestrianHistory, setPedestrianHistory] = useState<PedestrianData[]>([])
  const [timeSeriesData, setTimeSeriesData] = useState<TimePoint[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const dataFetchInterval = useRef<NodeJS.Timeout | null>(null)
  const { toast } = useToast()

  // Generate a unique session ID when the component mounts
  useEffect(() => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    setSessionId(newSessionId)
  }, [])

  // Fetch session data from the backend
  useEffect(() => {
    if (webcamActive) {
      // Initial fetch
      fetchSessionData()
  
      // Set up interval for fetching data
      dataFetchInterval.current = setInterval(fetchSessionData, 1000)
  
      // Clean up interval on unmount or when webcam is stopped
      return () => {
        if (dataFetchInterval.current) {
          clearInterval(dataFetchInterval.current)
          dataFetchInterval.current = null
        }
      }
    } else if (dataFetchInterval.current) {
      clearInterval(dataFetchInterval.current)
      dataFetchInterval.current = null
    }
  }, [webcamActive])
  
  const fetchSessionData = async () => {
    try {
      setConnectionError(false)
      const response = await fetch("https://streetsense-5lt6.onrender.com/session_data")
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }
  
      const data = await response.json()
  
      // Update session data
      const updatedSessionData = {
        totalPedestrians: data.totalPedestrians || 0,
        highRisk: data.highRisk || 0,
        mediumRisk: data.mediumRisk || 0,
        lowRisk: data.lowRisk || 0,
      }
  
      setSessionData(updatedSessionData)
  
      // Update time series data
      const now = new Date().toLocaleTimeString()
      setTimeSeriesData((prev) => {
        const newPoint: TimePoint = {
          time: now,
          total: updatedSessionData.totalPedestrians,
          high: updatedSessionData.highRisk,
          medium: updatedSessionData.mediumRisk,
          low: updatedSessionData.lowRisk,
        }
  
        const updatedData = [...prev, newPoint]
        return updatedData.length > 20 ? updatedData.slice(-20) : updatedData
      })
  
      // Process pedestrian data if available
      if (Array.isArray(data.pedestrians)) {
        const newPedestrians: PedestrianData[] = data.pedestrians.map((ped: any): PedestrianData => {
          const timestamp =
            typeof ped.timestamp === "string" && !isNaN(Date.parse(ped.timestamp))
              ? ped.timestamp
              : new Date().toISOString()
  
          return {
            id: typeof ped.id === "string" ? ped.id : `ped_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            timestamp,
            risk_level: ped.risk_level === "high" || ped.risk_level === "medium" ? ped.risk_level : "low",
            confidence: typeof ped.confidence === "number" ? ped.confidence : 0.8,
            position_x: typeof ped.position_x === "number" ? ped.position_x : 0,
            position_y: typeof ped.position_y === "number" ? ped.position_y : 0,
            session_id: sessionId,
          }
        })
  
        // Add to history (remove duplicates)
        setPedestrianHistory((prev) => {
          const existingIds = new Set(prev.map((ped) => ped.id))
          const uniqueNew = newPedestrians.filter((ped) => !existingIds.has(ped.id))
          return [...prev, ...uniqueNew]
        })
  
        // Store in Supabase
        if (supabase) {
          for (const pedestrian of newPedestrians) {
            try {
              await supabase.from("pedestrians").insert([pedestrian])
            } catch (error) {
              console.error("Error storing pedestrian data:", error)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching session data:", error)
      setConnectionError(true)
    }
  }
  

  const handleWebcamToggle = async () => {
    try {
      setIsLoading(true)

      if (webcamActive) {
        await fetch("https://streetsense-5lt6.onrender.com/stop_webcam", { method: "POST" })
        toast({
          title: "Webcam stopped",
          description: "Detection session has ended.",
        })

        // Clear interval if it exists
        if (dataFetchInterval.current) {
          clearInterval(dataFetchInterval.current)
          dataFetchInterval.current = null
        }
      } else {
        await fetch("https://streetsense-5lt6.onrender.com/start_webcam", { method: "POST" })
        toast({
          title: "Webcam started",
          description: "Detection session is now active.",
        })

        // Reset session data when starting a new session
        setPedestrianHistory([])
        setTimeSeriesData([])
        setSessionData({
          totalPedestrians: 0,
          highRisk: 0,
          mediumRisk: 0,
          lowRisk: 0,
        })
      }

      setWebcamActive(!webcamActive)
    } catch (error) {
      console.error("Error:", error)
      toast({
        title: "Connection Error",
        description: "Could not connect to the detection server. Is it running?",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const downloadSessionData = () => {
    if (pedestrianHistory.length === 0) {
      toast({
        title: "No data to download",
        description: "Start a detection session first to collect data.",
        variant: "destructive",
      })
      return
    }

    // Create CSV content
    const headers = "id,timestamp,risk_level,confidence,position_x,position_y,session_id\n"
    const csvContent = pedestrianHistory
      .map(
        (ped) =>
          `${ped.id},${ped.timestamp},${ped.risk_level},${ped.confidence},${ped.position_x},${ped.position_y},${ped.session_id}`,
      )
      .join("\n")

    const blob = new Blob([headers + csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `pedestrian-data-${sessionId}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Download started",
      description: "Your session data is being downloaded.",
    })
  }

  // Calculate the maximum value for the time series chart
  const maxTimeSeriesValue = Math.max(
    5, // Minimum value to show some height
    ...timeSeriesData.map((point) => Math.max(point.total, point.high, point.medium, point.low)),
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-gray-800 p-4">
        <div className="container mx-auto">
          <div className="flex items-center">
            <Link href="/" className="flex items-center text-gray-300 hover:text-white">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
          Pedestrian Detection Demo
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column - Webcam and controls */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Live Detection</h2>
                <Button
                  onClick={handleWebcamToggle}
                  disabled={isLoading}
                  className={`px-6 py-2 rounded-lg font-semibold text-white transition 
                    ${
                      webcamActive
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    }`}
                >
                  {isLoading ? "Connecting..." : webcamActive ? "Stop Detection" : "Start Detection"}
                </Button>
              </div>

              <div className="bg-gray-800 rounded-lg overflow-hidden aspect-video flex items-center justify-center relative">
                {webcamActive ? (
                  <img
                    src="https://streetsense-5lt6.onrender.com/video_feed"
                    alt="Webcam Feed"
                    className="w-full h-full object-contain"
                    onError={() => setConnectionError(true)}
                  />
                ) : (
                  <div className="text-center p-8">
                    <p className="text-gray-400 mb-4">Webcam feed will appear here</p>
                    <p className="text-sm text-gray-500">
                      Make sure your detection server is running at https://streetsense-5lt6.onrender.com
                    </p>
                  </div>
                )}

                {connectionError && webcamActive && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <div className="text-center p-8">
                      <p className="text-red-400 text-xl mb-2">Connection Error</p>
                      <p className="text-gray-300 mb-4">Could not connect to the detection server</p>
                      <Button onClick={handleWebcamToggle} variant="destructive">
                        Stop Detection
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-400">
                  {webcamActive ? (
                    <span>Session ID: {sessionId}</span>
                  ) : (
                    <span>Start detection to begin a new session</span>
                  )}
                </div>

                <Button
                  onClick={downloadSessionData}
                  variant="outline"
                  className="border-gray-700 text-gray-300 hover:text-white hover:border-blue-500"
                  disabled={pedestrianHistory.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Data
                </Button>
              </div>
            </div>

            {/* Detection History */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-semibold mb-4">Detection History</h2>

              <div className="overflow-auto max-h-[300px]">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="py-2 px-4 text-left text-gray-400">Time</th>
                      <th className="py-2 px-4 text-left text-gray-400">Risk Level</th>
                      <th className="py-2 px-4 text-left text-gray-400">Confidence</th>
                      <th className="py-2 px-4 text-left text-gray-400">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pedestrianHistory.length > 0 ? (
                      [...pedestrianHistory]
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .slice(0, 50)
                        .map((pedestrian) => (
                          <tr key={pedestrian.id} className="border-b border-gray-800">
                            <td className="py-2 px-4 text-sm">{new Date(pedestrian.timestamp).toLocaleTimeString()}</td>
                            <td className="py-2 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                                ${
                                  pedestrian.risk_level === "high"
                                    ? "bg-red-900/30 text-red-400"
                                    : pedestrian.risk_level === "medium"
                                      ? "bg-yellow-900/30 text-yellow-400"
                                      : "bg-green-900/30 text-green-400"
                                }`}
                              >
                                {pedestrian.risk_level.charAt(0).toUpperCase() + pedestrian.risk_level.slice(1)}
                              </span>
                            </td>
                            <td className="py-2 px-4 text-sm">{Math.round(pedestrian.confidence * 100)}%</td>
                            <td className="py-2 px-4 text-sm text-gray-400">
                              x: {Math.round(pedestrian.position_x)}, y: {Math.round(pedestrian.position_y)}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-gray-500">
                          No detection data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right column - Session data */}
          <div>
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Session Data</h2>

              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Total Pedestrians</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-blue-400 mr-2" />
                      <span className="text-2xl font-bold">{sessionData.totalPedestrians}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">High Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                      <span className="text-2xl font-bold">{sessionData.highRisk}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Medium Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Shield className="h-5 w-5 text-yellow-500 mr-2" />
                      <span className="text-2xl font-bold">{sessionData.mediumRisk}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-400">Low Risk</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Zap className="h-5 w-5 text-green-500 mr-2" />
                      <span className="text-2xl font-bold">{sessionData.lowRisk}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-xl font-semibold mb-4">Analytics</h2>

              <Tabs defaultValue="time" className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-gray-800">
                  <TabsTrigger value="risk">Risk Distribution</TabsTrigger>
                  <TabsTrigger value="time">Time Series</TabsTrigger>
                </TabsList>
                <TabsContent value="risk" className="pt-4">
                  <div className="h-64 flex items-center justify-center">
                    {sessionData.totalPedestrians > 0 ? (
                      <div className="w-full h-full flex items-end justify-around">
                        <div className="flex flex-col items-center">
                          <div
                            className="w-16 bg-red-500/70 rounded-t-md"
                            style={{
                              height: `${Math.min(100, (sessionData.highRisk / Math.max(1, sessionData.totalPedestrians)) * 200)}%`,
                            }}
                          ></div>
                          <span className="mt-2 text-sm text-gray-400">High</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div
                            className="w-16 bg-yellow-500/70 rounded-t-md"
                            style={{
                              height: `${Math.min(100, (sessionData.mediumRisk / Math.max(1, sessionData.totalPedestrians)) * 200)}%`,
                            }}
                          ></div>
                          <span className="mt-2 text-sm text-gray-400">Medium</span>
                        </div>
                        <div className="flex flex-col items-center">
                          <div
                            className="w-16 bg-green-500/70 rounded-t-md"
                            style={{
                              height: `${Math.min(100, (sessionData.lowRisk / Math.max(1, sessionData.totalPedestrians)) * 200)}%`,
                            }}
                          ></div>
                          <span className="mt-2 text-sm text-gray-400">Low</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No data available</p>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="time" className="pt-4">
                  <div className="h-64 flex items-center justify-center">
                    {timeSeriesData.length > 0 ? (
                      <div className="w-full h-full relative">
                        {/* Grid lines */}
                        <div className="absolute bottom-0 left-0 w-full border-t border-gray-700 text-xs text-gray-500">
                          0
                        </div>
                        <div className="absolute bottom-1/4 left-0 w-full border-t border-gray-800 text-xs text-gray-500">
                          {Math.round(maxTimeSeriesValue * 0.25)}
                        </div>
                        <div className="absolute bottom-1/2 left-0 w-full border-t border-gray-800 text-xs text-gray-500">
                          {Math.round(maxTimeSeriesValue * 0.5)}
                        </div>
                        <div className="absolute bottom-3/4 left-0 w-full border-t border-gray-800 text-xs text-gray-500">
                          {Math.round(maxTimeSeriesValue * 0.75)}
                        </div>
                        <div className="absolute top-0 left-0 w-full border-t border-gray-700 text-xs text-gray-500">
                          {maxTimeSeriesValue}
                        </div>

                        {/* Time series visualization */}
                        <div className="absolute inset-0 flex items-end">
                          <svg
                            className="w-full h-full"
                            viewBox={`0 0 ${timeSeriesData.length * 20} 100`}
                            preserveAspectRatio="none"
                          >
                            {/* Total line */}
                            <polyline
                              points={timeSeriesData
                                .map((point, i) => `${i * 20 + 10},${100 - (point.total / maxTimeSeriesValue) * 100}`)
                                .join(" ")}
                              fill="none"
                              stroke="#3b82f6"
                              strokeWidth="2"
                            />

                            {/* High risk line */}
                            <polyline
                              points={timeSeriesData
                                .map((point, i) => `${i * 20 + 10},${100 - (point.high / maxTimeSeriesValue) * 100}`)
                                .join(" ")}
                              fill="none"
                              stroke="#ef4444"
                              strokeWidth="2"
                              strokeDasharray="4"
                            />

                            {/* Medium risk line */}
                            <polyline
                              points={timeSeriesData
                                .map((point, i) => `${i * 20 + 10},${100 - (point.medium / maxTimeSeriesValue) * 100}`)
                                .join(" ")}
                              fill="none"
                              stroke="#eab308"
                              strokeWidth="2"
                              strokeDasharray="4"
                            />

                            {/* Low risk line */}
                            <polyline
                              points={timeSeriesData
                                .map((point, i) => `${i * 20 + 10},${100 - (point.low / maxTimeSeriesValue) * 100}`)
                                .join(" ")}
                              fill="none"
                              stroke="#22c55e"
                              strokeWidth="2"
                              strokeDasharray="4"
                            />

                            {/* Data points for total */}
                            {timeSeriesData.map((point, i) => (
                              <circle
                                key={`total-${i}`}
                                cx={i * 20 + 10}
                                cy={100 - (point.total / maxTimeSeriesValue) * 100}
                                r="2"
                                fill="#3b82f6"
                              />
                            ))}
                          </svg>
                        </div>

                        {/* Legend */}
                        <div className="absolute bottom-0 right-0 bg-gray-800/70 p-2 rounded text-xs">
                          <div className="flex items-center mb-1">
                            <div className="w-3 h-1 bg-blue-500 mr-1"></div>
                            <span className="text-blue-400">Total</span>
                          </div>
                          <div className="flex items-center mb-1">
                            <div className="w-3 h-1 bg-red-500 mr-1"></div>
                            <span className="text-red-400">High</span>
                          </div>
                          <div className="flex items-center mb-1">
                            <div className="w-3 h-1 bg-yellow-500 mr-1"></div>
                            <span className="text-yellow-400">Medium</span>
                          </div>
                          <div className="flex items-center">
                            <div className="w-3 h-1 bg-green-500 mr-1"></div>
                            <span className="text-green-400">Low</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No data available</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}