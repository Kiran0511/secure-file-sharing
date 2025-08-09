"use client"


import { ShieldCheck, UserPlus, LogIn } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#121212]">
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

      <div className="w-full max-w-xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="mx-auto mb-4 w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center animate-pulse-glow">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Secure File Sharing</h1>
          <p className="text-gray-400">Fast, Encrypted & Controlled Access for Everyone</p>
        </div>

        {/* Main Card */}
        <Card className="glass-effect shadow-2xl animate-fade-in bg-gray-800/80 border-gray-700">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-semibold text-gray-100">Welcome</CardTitle>
            <CardDescription className="text-gray-400">Login or Signup to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-center gap-6 mt-4">
              <Button
                variant="ghost"
                size="lg"
                className="text-blue-400 hover:text-blue-600"
                onClick={() => router.push("/users/signup")}
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Signup
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-blue-400 hover:text-blue-600"
                onClick={() => router.push("/users/login")}
              >
                <LogIn className="w-5 h-5 mr-2" />
                Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 animate-fade-in">
          <p className="text-xs text-gray-500">© 2024 Secure File Sharing Platform. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}


