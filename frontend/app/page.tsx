"use client"

import type React from "react"

import { useRef } from "react"
import Link from "next/link"
import { ChevronDown, Users, AlertTriangle, Shield, Zap, Github, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function Home() {
  const faqRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const contactRef = useRef<HTMLDivElement>(null)

  const scrollToSection = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth" });
  };
  

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-gray-800">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              StreetSense
            </span>
          </div>

          <nav className="hidden md:flex space-x-8">
            <button
              onClick={() => scrollToSection(faqRef)}
              className="text-gray-300 hover:text-white transition-colors"
            >
              FAQ
            </button>
            <button
              onClick={() => scrollToSection(aboutRef)}
              className="text-gray-300 hover:text-white transition-colors"
            >
              About
            </button>
            <button
              onClick={() => scrollToSection(contactRef)}
              className="text-gray-300 hover:text-white transition-colors"
            >
              Contact Us
            </button>
          </nav>

          <div className="md:hidden">
            <Button variant="ghost" size="icon">
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-60 pb-20 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
            Next-Gen Pedestrian Detection for Autonomous Vehicles
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
            Advanced AI-powered detection with real-time risk assessment to make autonomous driving safer for everyone.
          </p>
          <Link href="/try-now">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg rounded-xl">
              Try Now
            </Button>
          </Link>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <div className="flex items-center justify-center w-12 h-12 bg-red-500/20 rounded-lg mb-4 mx-auto">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">High Risk</h3>
              <p className="text-gray-400">Pedestrians in immediate proximity to the vehicle</p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-500/20 rounded-lg mb-4 mx-auto">
                <Shield className="w-6 h-6 text-yellow-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Medium Risk</h3>
              <p className="text-gray-400">Pedestrians within cautionary distance</p>
            </div>

            <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
              <div className="flex items-center justify-center w-12 h-12 bg-green-500/20 rounded-lg mb-4 mx-auto">
                <Zap className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Low Risk</h3>
              <p className="text-gray-400">Pedestrians at a safe distance from the vehicle</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Advanced Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all">
              <CardHeader>
                <CardTitle>Real-time Detection</CardTitle>
                <CardDescription>Millisecond response time for critical situations</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Our system processes video feeds with advanced neural networks to ensure immediate detection
                  of pedestrians in any lighting condition.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all">
              <CardHeader>
                <CardTitle>Semantic Segmentation</CardTitle>
                <CardDescription>Precise identification of pedestrian boundaries</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Beyond simple bounding boxes, our system uses pixel-level segmentation to accurately determine
                  pedestrian positions relative to the vehicle.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all">
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
                <CardDescription>Intelligent categorization of pedestrian risk</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Automatically categorizes pedestrians into risk levels based on distance, movement trajectory, and
                  environmental factors.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all">
              <CardHeader>
                <CardTitle>All-Weather Performance</CardTitle>
                <CardDescription>Reliable in challenging conditions</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Advanced algorithms maintain high detection accuracy in rain, snow, fog, and low-light conditions
                  where traditional systems fail.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all">
              <CardHeader>
                <CardTitle>Session Recording</CardTitle>
                <CardDescription>Comprehensive data storage and analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  All detection sessions are recorded with metadata for later review, allowing for continuous
                  improvement of the system.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-all">
              <CardHeader>
                <CardTitle>Data Export</CardTitle>
                <CardDescription>Easy access to session information</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300">
                  Export detection data in multiple formats for integration with other systems or for compliance
                  reporting.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section ref={faqRef} className="py-20 px-4 bg-black">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">Frequently Asked Questions</h2>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>How accurate is the pedestrian detection system?</AccordionTrigger>
              <AccordionContent>
              Our system achieves a mean Intersection over Union (mIoU) of 87.3%, ensuring reliable semantic 
              segmentation of pedestrians in real-time. This performance is competitive with state-of-the-art 
              models and suitable for deployment in both ideal and challenging environments.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2">
              <AccordionTrigger>What hardware is required to run the detection system?</AccordionTrigger>
              <AccordionContent>
                The system is optimized to run on various hardware configurations. For optimal performance, we recommend
                a dedicated GPU with at least 6GB VRAM. However, we also offer a lightweight version that can run on
                CPU-only setups with minimal latency.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3">
              <AccordionTrigger>
                Can the system be integrated with existing autonomous vehicle platforms?
              </AccordionTrigger>
              <AccordionContent>
                Yes, we plan to provide APIs and SDKs for all major autonomous driving platforms including NVIDIA DRIVE,
                Mobileye, and custom solutions. Our system is designed with interoperability in mind.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4">
              <AccordionTrigger>How is pedestrian risk level determined?</AccordionTrigger>
              <AccordionContent>
                Risk levels are calculated using a combination of factors: distance from the vehicle, relative velocity,
                predicted trajectory, and environmental context.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5">
              <AccordionTrigger>Can I download the data from a detection session?</AccordionTrigger>
              <AccordionContent>
                Yes, after each detection session, you can download a CSV file containing detailed records including timestamp, 
                pedestrian coordinates, and their corresponding risk levels. This makes it easy to analyze, share, or integrate 
                with other systems.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* About Section */}
      <section ref={aboutRef} className="py-20 px-4 bg-gray-900">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">About Our Project</h2>

          <div className="prose prose-invert max-w-none">
            <p className="text-xl text-gray-300 mb-6">
              Our project focuses on enhancing pedestrian safety in autonomous systems using a robust AI-powered framework. Leveraging semantic segmentation and object detection, our model identifies pedestrians with high accuracy in real-time.
            </p>

            <p className="text-xl text-gray-300 mb-6">
              We utilize a pre-trained YOLOv8 segmentation model to classify each pixel and assess pedestrian risk levels based on proximity and movement. Individuals closer to the vehicle are marked as high risk, while those farther away are categorized as medium or low risk.
            </p>

            <p className="text-xl text-gray-300">
              This real-time risk classification helps improve decision-making in autonomous systems, enabling safer navigation in dynamic environments like urban streets and intersections.
            </p>
          </div>
        </div>
      </section>


      {/* Footer */}
      <footer ref={contactRef} className="py-12 px-4 bg-black border-t border-gray-800">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-6">Contact Us</h3>
              <div className="flex items-center mb-4">
                <Mail className="w-5 h-5 mr-3 text-blue-400" />
                <a href="mailto:info@pedessafe.ai" className="text-gray-300 hover:text-white">
                  info@streetsense.ai
                </a>
              </div>
              <div className="flex items-center">
                <Github className="w-5 h-5 mr-3 text-blue-400" />
                <a href="https://github.com/kuekuatsuuu/streetsense" className="text-gray-300 hover:text-white">
                  github.com/kuekuatsuuu/streetsense
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6">Location</h3>
              <p className="text-gray-300 mb-2">Model Engineering College</p>
              <p className="text-gray-300 mb-2">Thrikkakara</p>
              <p className="text-gray-300">India</p>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
            <p>© 2025 StreetSense. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}