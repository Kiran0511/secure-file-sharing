"use client"


import type React from "react"
import axios from "axios"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Download, AlertCircle, CheckCircle, FileText, Key, ArrowLeft, Lock } from "lucide-react"
import Link from "next/link"

// Zod schema for validation
const schema = z.object({
  token: z.string().min(1, "Token is required"),
  otp: z.string().regex(/^\d{6}$/, "OTP must be exactly 6 digits"),
})

type FormData = z.infer<typeof schema>

export default function DownloadPage() {
  const searchParams = useSearchParams()
  const [isDownloading, setIsDownloading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [hasValidAccess, setHasValidAccess] = useState(false)
  const [showTokenForm, setShowTokenForm] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  })

  useEffect(() => {
    // Check if there's a token in URL params
    const tokenFromUrl = searchParams.get('token')
    if (tokenFromUrl) {
      setHasValidAccess(true)
      // Don't auto-fill the token, just validate access
    }
  }, [searchParams])

  const validateToken = async (token: string) => {
    try {
      // You can add a simple token validation endpoint or just check JWT structure
      if (token && token.length > 50) { // Basic validation - adjust as needed
        setHasValidAccess(true)
        setMessage({ type: "success", text: "Access token validated. Please enter your OTP." })
      } else {
        setMessage({ type: "error", text: "Invalid access token format." })
      }
    } catch (err) {
      setMessage({ type: "error", text: "Invalid access token." })
    }
  }

  const handleTokenSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const token = formData.get('accessToken') as string
    if (token) {
      validateToken(token)
    }
  }

  const onSubmit = async (formData: FormData) => {
    setIsDownloading(true)
    setMessage(null)
    try {
      const res = await axios.post(
        "http://192.168.73.1:3000/api/verify-otp",
        { token: formData.token, otp: formData.otp },
        { responseType: "blob" }
      )

      // Extract filename from content-disposition header
      const disposition = res.headers["content-disposition"]
      const fileNameMatch = disposition && disposition.match(/filename="?([^"]+)"?/)
      const filename = fileNameMatch?.[1] || "downloaded-file"
      const contentType = res.headers["content-type"] || "application/octet-stream"

      // Create download link
      const url = window.URL.createObjectURL(new Blob([res.data], { type: contentType }))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)

      setMessage({ type: "success", text: "File downloaded successfully!" })
      reset()
    } catch (err: any) {
      // Extract error message from server response
      let errorMessage = "Download failed. Invalid OTP or Token."
      
      if (err.response) {
        // Handle blob error responses (when responseType is 'blob')
        if (err.response.data instanceof Blob) {
          try {
            const text = await err.response.data.text()
            const parsed = JSON.parse(text)
            if (parsed.message) {
              errorMessage = parsed.message
            } else {
              errorMessage = text.replace('❌ ', '')
            }
          } catch (blobError) {
            // If blob parsing fails, try to read as text
            try {
              errorMessage = await err.response.data.text()
              errorMessage = errorMessage.replace('❌ ', '')
            } catch (textError) {
              console.error("Failed to parse blob error:", textError)
            }
          }
        } else if (err.response.data) {
          // Handle regular JSON error responses
          if (typeof err.response.data === 'string') {
            errorMessage = err.response.data.replace('❌ ', '')
          } else if (err.response.data.message) {
            errorMessage = err.response.data.message
          }
        }
        
        // Log for debugging
        console.log("Error status:", err.response.status)
        console.log("Error data:", err.response.data)
        console.log("Error data type:", typeof err.response.data)
      }
      
      setMessage({ type: "error", text: errorMessage })
      console.error("❌ Download failed:", err)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="w-full py-8 text-center animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-100">Secure File Download</h1>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, #4A90E2 0%, transparent 50%),
                             radial-gradient(circle at 75% 75%, #4A90E2 0%, transparent 50%)`,
            }}
          />
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-500/5 rounded-full blur-2xl animate-pulse" />

        <div className="w-full max-w-md relative z-10">
          {!hasValidAccess ? (
            // Access Token Required Screen
            <Card className="bg-gray-800/90 border-gray-700 shadow-2xl animate-fade-in backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center animate-pulse">
                  <Lock className="w-8 h-8 text-red-400" />
                </div>
                <CardTitle className="text-center text-gray-100">Access Restricted</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-gray-300 text-sm">
                  This download page requires a valid access token. Please check your email for the download link with access token.
                </p>
                
                <div className="space-y-4">
                  <Button
                    onClick={() => setShowTokenForm(!showTokenForm)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    I have an access token
                  </Button>

                  {showTokenForm && (
                    <form onSubmit={handleTokenSubmit} className="space-y-3">
                      <div className="space-y-2">
                        <Label htmlFor="accessToken" className="text-gray-200">Access Token</Label>
                        <Input
                          id="accessToken"
                          name="accessToken"
                          type="text"
                          placeholder="Paste your access token here"
                          className="font-mono bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
                        />
                      </div>
                      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                        Validate Token
                      </Button>
                    </form>
                  )}
                  
                  <Link href="/" className="inline-block">
                    <Button variant="outline" className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Go to Home
                    </Button>
                  </Link>
                </div>

                {message && (
                  <div
                    className={`flex items-center gap-2 p-3 rounded-md text-sm animate-fade-in ${
                      message.type === "success"
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    {message.type === "success" ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    {message.text}
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            // Download Form (shown only with valid access)
            <Card className="bg-gray-800/90 border-gray-700 shadow-2xl animate-fade-in backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse-glow">
                  <Download className="w-8 h-8 text-blue-400" />
                </div>
                <CardTitle className="text-center text-gray-100">Download File</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="token" className="flex items-center gap-2 text-gray-200">
                      <FileText className="w-4 h-4" />
                      Access Token
                    </Label>
                    <Input
                      id="token"
                      type="text"
                      placeholder="Enter your access token"
                      {...register("token")}
                      className="font-mono bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400 transition-all duration-200 focus:scale-[1.02]"
                    />
                    {errors.token && (
                      <p className="text-red-400 text-xs">{errors.token.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="otp" className="flex items-center gap-2 text-gray-200">
                      <Key className="w-4 h-4" />
                      OTP
                    </Label>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter OTP from email"
                      maxLength={6}
                      {...register("otp")}
                      className="font-mono text-center bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400 transition-all duration-200 focus:scale-[1.02]"
                    />
                    {errors.otp && (
                      <p className="text-red-400 text-xs">{errors.otp.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 hover:scale-105 disabled:opacity-50"
                    disabled={isDownloading}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isDownloading ? "Downloading..." : "Download File"}
                  </Button>

                  {message && (
                    <div
                      className={`flex items-center gap-2 p-3 rounded-md text-sm animate-fade-in ${
                        message.type === "success"
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {message.type === "success" ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {message.text}
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full py-6 text-center border-t border-gray-800 mt-auto">
        <p className="text-sm text-gray-500">© 2024 Secure File Sharing Platform. All rights reserved.</p>
      </div>
    </div>
  )
}

