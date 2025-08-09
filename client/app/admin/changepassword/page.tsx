"use client"


import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Key, Eye, EyeOff, ShieldCheck, AlertCircle } from "lucide-react"
import axios from "axios"
import AdminSidebarLayout from "@/components/layout/AdminSidebarLayout"

export default function AdminChangePasswordPage() {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Redirect to login if not logged in
  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    const role = localStorage.getItem("userRole")
    if (!token || role !== "admin") {
      router.replace("/users/login")
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    if (!currentPassword || !newPassword) {
      setError("Please fill in all fields")
      return
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters")
      return
    }

    setIsLoading(true)
    try {
      const token = localStorage.getItem("accessToken")
      const res = await axios.post("http://192.168.73.1:3000/api/changepassword", {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (res.data && res.data.success) {
        setSuccess("Password changed successfully!")
        setTimeout(() => {
          router.push("/admin/dashboard")
        }, 1500)
      } else {
        setError(res.data?.message || "Failed to change password")
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
        "Failed to change password. Please try again."
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AdminSidebarLayout>
      <div className="min-h-screen flex items-center justify-center px-2 sm:px-4 py-8 bg-gray-900">
        <div className="w-full max-w-md sm:max-w-lg md:max-w-md mx-auto">
          <Card className="bg-gray-800/90 border-gray-700 shadow-2xl animate-fade-in backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-lg sm:text-xl font-semibold text-gray-100">
                Change Password
              </CardTitle>
              <CardDescription className="text-gray-400 text-sm sm:text-base">
                Update your admin account password
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="flex items-center gap-2 text-gray-200">
                    <Key className="w-4 h-4" />
                    Current Password
                  </Label>
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400 text-sm sm:text-base"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="flex items-center gap-2 text-gray-200">
                    <ShieldCheck className="w-4 h-4" />
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pr-10 bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:border-blue-400 focus:ring-blue-400 text-sm sm:text-base"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-md text-sm bg-red-500/20 text-red-400 border border-red-500/30 animate-fade-in break-words">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 p-3 rounded-md text-sm bg-green-500/20 text-green-400 border border-green-500/30 animate-fade-in break-words">
                    <ShieldCheck className="w-4 h-4" />
                    {success}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 hover:scale-105 disabled:opacity-50 text-base"
                  disabled={isLoading}
                >
                  {isLoading ? "Changing..." : "Change Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminSidebarLayout>
  )
}

