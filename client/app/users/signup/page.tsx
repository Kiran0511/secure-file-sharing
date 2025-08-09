"use client"


import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus, AlertCircle, Eye, EyeOff, Shield, Lock, User } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import toast, { Toaster } from "react-hot-toast"

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Confirm Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
})

type FormData = z.infer<typeof schema>

export default function UserSignupPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onTouched",
  })

  const onSubmit = async (formData: FormData) => {
    setSuccess("")
    setIsLoading(true)
    try {
      const res = await axios.post("http://192.168.73.1:3000/api/auth/signup", {
        email: formData.email,
        password: formData.password,
      })

      if (res.data && res.data.success) {
        setSuccess("Signup successful! You can now log in.")
        toast.success("Signup successful! Redirecting to login...")
        setTimeout(() => {
          router.push("/users/login")
        }, 1500)
        reset()
      } else {
        toast.error(res.data?.message || "Signup failed")
      }
    } catch (err: any) {
      toast.error(
        err.response?.data?.message ||
        "Signup failed. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Toaster position="top-center" />
      {/* Header */}
      <div className="w-full py-8 text-center animate-fade-in">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-100">User Signup</h1>
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
          <Card className="bg-gray-800/90 border-gray-700 shadow-2xl animate-fade-in backdrop-blur-sm">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse-glow">
                <UserPlus className="w-8 h-8 text-blue-400" />
              </div>
              <CardTitle className="text-gray-100">Create User Account</CardTitle>
              <CardDescription className="text-gray-400">
                Enter your details to sign up as a user
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2 text-gray-200">
                    <User className="w-4 h-4" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    {...register("email")}
                    className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-xs">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2 text-gray-200">
                    <Lock className="w-4 h-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      {...register("password")}
                      className="pr-10 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-400 text-xs">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2 text-gray-200">
                    <Lock className="w-4 h-4" />
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    {...register("confirmPassword")}
                    className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-400 text-xs">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {success && (
                  <div className="flex items-center gap-2 p-3 rounded-md text-sm bg-green-500/20 text-green-400 border border-green-500/30 animate-fade-in">
                    <Shield className="w-4 h-4" />
                    {success}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 hover:scale-105 disabled:opacity-50"
                  disabled={isLoading}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  {isLoading ? "Signing up..." : "Sign Up"}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm text-gray-400">
                Already have an account?{" "}
                <a
                  href="/users/login"
                  className="text-blue-400 hover:underline"
                >
                  Login here
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full py-6 text-center border-t border-gray-800 mt-auto">
        <p className="text-sm text-gray-500">© 2024 Secure File Sharing Platform. All rights reserved.</p>
      </div>
    </div>
  )
}

