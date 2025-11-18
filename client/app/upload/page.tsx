"use client"


import React, { useRef, useEffect } from "react"
import axios from "axios"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import toast, { Toaster } from "react-hot-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, CheckCircle, FileText, Mail, ArrowLeft, Phone, X } from "lucide-react"
import Link from "next/link"
import UserSidebarLayout from "@/components/layout/UserSidebarLayout"
import { useRouter } from "next/navigation"
import { API_ENDPOINTS } from "@/lib/config"

const allowedTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "audio/mp3",
  "audio/x-wav",
  "audio/webm",
  "text/plain",
]

const schema = z.object({
  receiverEmail: z.string().email("Invalid receiver email"),
  phoneNumber: z.string().regex(/^\d{10}$/, "Phone number must be 10 digits"),
  file: z
    .any()
    .refine(
      (file) =>
        file instanceof File &&
        file.size > 0 &&
        allowedTypes.includes(file.type),
      "File is required and must be a PDF, DOCX, image, video, audio, or txt"
    ),
}).refine((data) => true, { message: "", path: [] }) // Remove sender/receiver check

type FormData = z.infer<typeof schema>

export default function UploadPage() {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [accessToken, setAccessToken] = useState("")

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  })

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const file = watch("file")
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    const role = localStorage.getItem("userRole")
    if (!token || role !== "user") {
      router.replace("/users/login")
    }
  }, [router])

  // Add a function to remove the selected file
  const removeFile = () => {
    setValue("file", null, { shouldValidate: true })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsUploading(true)
    const formData = new FormData()
    formData.append("receiverEmail", data.receiverEmail)
    formData.append("phoneNumber", data.phoneNumber)
    formData.append("file", data.file)

    try {
      const token = localStorage.getItem("accessToken");

      const res = await axios.post(
        API_ENDPOINTS.UPLOAD.FILE, // Use config instead of hardcoded URL
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data"
          }
        }
      )
      setAccessToken(res.data.accessToken)
      setUploadSuccess(true)
      toast.success("File uploaded successfully!")
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error("Upload failed: " + (error?.response?.data || "Unknown error"))
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    setValue("file", file as any, { shouldValidate: true })
  }

  const resetForm = () => {
    setUploadSuccess(false)
    reset()
    setAccessToken("")
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  if (uploadSuccess) {
    return (
      <UserSidebarLayout>
        <div className="w-full max-w-md mx-auto py-12">
          <Toaster position="top-right" />
          <Card className="glass-effect shadow-2xl animate-fade-in bg-gray-800/80 border-gray-700">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center animate-pulse-glow">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <CardTitle className="text-green-500 text-xl">Upload Successful!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="token" className="flex items-center gap-2 text-gray-200">
                  <FileText className="w-4 h-4" />
                  Access Token
                </Label>
                <Input
                  id="token"
                  value={accessToken}
                  readOnly
                  className="font-mono text-center bg-gray-700 border-gray-600 text-blue-400 font-semibold text-lg tracking-wider"
                />
                <p className="text-xs text-gray-400 text-center">Share this token with the recipient</p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                <Mail className="w-5 h-5 text-green-500 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-green-400 font-medium">OTP Sent Successfully</p>
                  <p className="text-gray-400">Verification code sent to receiver's email</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button onClick={resetForm} className="w-full bg-blue-600 hover:bg-blue-700" size="lg">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Another File
                </Button>
                <Link href="/" className="block">
                  <Button
                    variant="outline"
                    className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                    size="lg"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </UserSidebarLayout>
    )
  }

  return (
    <UserSidebarLayout>
      <div className="w-full max-w-md mx-auto py-12">
        <Toaster position="top-right" />
        <div className="text-center mb-8 animate-fade-in">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse-glow">
            <Upload className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Secure File Sharing</h1>
          <p className="text-gray-400">Share files securely with OTP verification</p>
        </div>
        <Card className="glass-effect shadow-2xl animate-fade-in bg-gray-800/80 border-gray-700">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-100">Upload File</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="flex items-center gap-2 text-gray-200">
                  <Phone className="w-4 h-4" />
                  Receiver Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="1234567890"
                  {...register("phoneNumber")}
                  className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400"
                />
                {errors.phoneNumber && (
                  <p className="text-red-400 text-xs">{errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="receiverEmail" className="flex items-center gap-2 text-gray-200">
                  <Mail className="w-4 h-4" />
                  Receiver Email
                </Label>
                <Input
                  id="receiverEmail"
                  type="email"
                  placeholder="recipient@example.com"
                  {...register("receiverEmail")}
                  className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400"
                />
                {errors.receiverEmail && (
                  <p className="text-red-400 text-xs">{errors.receiverEmail.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="file" className="flex items-center gap-2 text-gray-200">
                  <FileText className="w-4 h-4" />
                  File Upload
                </Label>
                <div className="relative">
                  <input
                    id="file"
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.docx,.jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.mp3,.wav,.webm,.txt"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="flex items-center bg-gray-700 border border-gray-600 rounded px-4 py-2">
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-1 px-4 rounded mr-4"
                    >
                      Choose File
                    </Button>
                    <span className="text-gray-300 text-sm truncate">
                      {file ? file.name : "No file chosen"}
                    </span>
                  </div>
                </div>
                {errors.file && (
                  <p className="text-red-400 text-xs mt-1">{errors.file.message as string}</p>
                )}
                {file && (
                  <div className="flex items-center gap-2 p-3 mt-3 bg-blue-500/10 border border-blue-500/20 rounded-md text-sm animate-fade-in">
                    <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-100 font-medium truncate">{file.name}</p>
                      <p className="text-gray-400 text-xs">{formatFileSize(file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={removeFile}
                      className="ml-2 p-1 rounded hover:bg-red-600/30 transition-colors"
                      aria-label="Remove file"
                    >
                      <X className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 hover:scale-105 disabled:opacity-50"
                size="lg"
                disabled={isUploading}
              >
                {isUploading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </span>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        <div className="text-center mt-8 animate-fade-in">
          <p className="text-xs text-gray-500">© 2024 Secure File Sharing Platform. All rights reserved.</p>
        </div>
      </div>
    </UserSidebarLayout>
  )
}

