"use client"


import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, Download, ShieldCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import UserSidebarLayout from "@/components/layout/UserSidebarLayout"

export default function UserDashboard() {
  const router = useRouter()
  const [email, setEmail] = useState("")

  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    const role = localStorage.getItem("userRole")
    if (!token || role !== "user") {
      router.push("/users/login")
      return
    }
    const storedEmail = localStorage.getItem("userEmail")
    if (storedEmail) setEmail(storedEmail)
  }, [router])

  return (
    <UserSidebarLayout>
      {/* Main Content */}
      <div>
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse-glow">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">User Dashboard</h1>
          <p className="text-gray-400">Upload or Download your secure files</p>
        </div>

        {/* Main Card */}
        <Card className="glass-effect shadow-2xl animate-fade-in bg-gray-800/80 border-gray-700">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-100">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 mt-4">
              <Button
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium transition-all duration-200 hover:scale-105"
                onClick={() => router.push("/upload")}
              >
                <Upload className="w-5 h-5 mr-2" />
                Upload File
              </Button>
              <Button
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium transition-all duration-200 hover:scale-105"
                onClick={() => router.push("/download")}
              >
                <Download className="w-5 h-5 mr-2" />
                Download File
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 animate-fade-in">
          <p className="text-xs text-gray-500">© 2024 Secure File Sharing Platform. All rights reserved.</p>
        </div>
      </div>
    </UserSidebarLayout>
  )
}

