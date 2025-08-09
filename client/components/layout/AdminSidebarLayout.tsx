"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LayoutDashboard, Users, Key, Download } from "lucide-react"

export default function AdminSidebarLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [email, setEmail] = useState("")

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail")
    if (storedEmail) setEmail(storedEmail)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("userEmail")
    localStorage.removeItem("userRole")
    router.push("/users/login")
  }

  return (
    <div className="min-h-screen flex flex-col sm:flex-row items-stretch justify-center p-2 sm:p-4 relative overflow-hidden bg-[#121212]">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 25% 25%, #4A90E2 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, #4A90E2 0%, transparent 50%)`,
          }}
        />
      </div>
      {/* Floating Elements */}
      <div className="absolute top-4 left-2 w-16 h-16 sm:top-20 sm:left-20 sm:w-32 sm:h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-4 right-2 w-20 h-20 sm:bottom-20 sm:right-20 sm:w-40 sm:h-40 bg-blue-500/5 rounded-full blur-2xl animate-pulse" />

      <div className="w-full max-w-7xl flex flex-col sm:flex-row relative z-10 mx-auto">
        {/* Sidebar */}
        <aside className="w-full sm:w-64 bg-gray-800/90 border-b sm:border-b-0 sm:border-r border-gray-700 rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none p-4 sm:p-6 flex flex-row sm:flex-col gap-4 sm:gap-4 shadow-xl">
          <div className="flex flex-row sm:flex-col items-center gap-2 sm:gap-2 mb-0 sm:mb-2">
            <LayoutDashboard className="w-8 h-8 sm:w-10 sm:h-10 text-blue-400" />
            <span className="text-base sm:text-lg font-semibold text-gray-100 truncate">{email || "Admin"}</span>
          </div>
          <nav className="flex flex-row sm:flex-col gap-2 sm:gap-2 flex-1 justify-end sm:justify-start">
            <Button
              variant="ghost"
              className="justify-start text-blue-400 font-bold w-full"
              onClick={() => router.push("/admin/dashboard")}
            >
              <LayoutDashboard className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Dashboard</span>
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-gray-300 hover:text-green-400 w-full"
              onClick={() => router.push("/admin/userlist")}
            >
              <Users className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">User List</span>
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-gray-300 hover:text-yellow-400 w-full"
              onClick={() => router.push("/admin/changepassword")}
            >
              <Key className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Change Password</span>
            </Button>
            <Button
              variant="ghost"
              className="justify-start text-gray-300 hover:text-red-400 w-full"
              onClick={handleLogout}
            >
              <Download className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </nav>
        </aside>
        {/* Main Content */}
        <div className="flex-1 bg-transparent p-2 sm:p-8">{children}</div>
      </div>
    </div>
  )
}