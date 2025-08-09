"use client"


import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import AdminSidebarLayout from "@/components/layout/AdminSidebarLayout"
import axios from "axios"
import { Toaster } from "@/components/ui/toaster"
import { toast } from "@/components/ui/use-toast"

export default function UserListPage() {
    const router = useRouter()
    const [users, setUsers] = useState<any[]>([])
    const [roleUpdates, setRoleUpdates] = useState<{ [key: number]: string }>({})

    // Helper function to format datetime
    const formatDateTime = (dateString: string) => {
        if (!dateString) return "—"
        try {
            const date = new Date(dateString)
            return date.toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })
        } catch (error) {
            return "—"
        }
    }

    // Redirect to login if not logged in
    useEffect(() => {
        const token = localStorage.getItem("accessToken")
        const role = localStorage.getItem("userRole")
        if (!token || role !== "admin") {
            router.replace("/users/login")
            return
        }
        axios.get("http://192.168.73.1:3000/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => setUsers(res.data))
            .catch(() => setUsers([]))
    }, [router])

    const handleRoleChange = (id: number, newRole: string) => {
        setRoleUpdates((prev) => ({ ...prev, [id]: newRole }))
    }

    const handleUpdateRole = async (id: number) => {
        const updatedRole = roleUpdates[id]
        const token = localStorage.getItem("accessToken")
        try {
            const res = await axios.post(
                "http://192.168.73.1:3000/api/admin/update-user-role",
                { userId: id, newRole: updatedRole },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            setUsers((prev) =>
                prev.map((user) => (user.id === id ? { ...user, role: updatedRole } : user))
            )
            toast({
                    title: "Success",
                    description: res.data.message || "Role updated successfully!",
                })
            
        } catch (err) {
            toast({
                    title: "Error",
                    description: "Failed to update role",
                    variant: "destructive",
                })
        }
    }

    const handleRevokeUpload = async (uploadId: number) => {
        const token = localStorage.getItem("accessToken")
        try {
            const res = await axios.post(
                "http://192.168.73.1:3000/api/users/revoke",
                { uploadId },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            )
            if (res.data.success) {
                toast({
                    title: "Success",
                    description: res.data.message || "Upload revoked and file deleted successfully!",
                })
            } else {
                toast({
                    title: "Error",
                    description: res.data.message || "Failed to revoke upload",
                    variant: "destructive",
                })
            }
        } catch (err) {
            toast({
                title: "Error",
                description: "Failed to revoke upload",
                variant: "destructive",
            })
        }
    }

    return (
        <AdminSidebarLayout>
            <Toaster />
            <div className="max-w-3xl w-full mx-auto">
                <Card className="bg-gray-800/90 border-gray-700 shadow-2xl animate-fade-in">
                    <CardHeader>
                        <CardTitle className="text-xl font-semibold text-gray-100">
                            User List
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {users.length === 0 ? (
                            <div className="text-center text-gray-400 py-8">No users found.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-xs sm:text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            <th className="text-left p-2 text-gray-300 min-w-[120px]">Email</th>
                                            <th className="text-left p-2 text-gray-300 min-w-[80px]">Role</th>
                                            <th className="text-left p-2 text-gray-300 min-w-[120px] hidden sm:table-cell">Created Time</th>
                                            <th className="text-left p-2 text-gray-300 min-w-[80px]">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user) => (
                                            <tr
                                                key={user.id}
                                                className="border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors"
                                            >
                                                <td className="p-2 text-gray-200 break-all">{user.email}</td>
                                                <td className="p-2">
                                                    <select
                                                        value={roleUpdates[user.id] ?? user.role}
                                                        onChange={(e) =>
                                                            handleRoleChange(user.id, e.target.value)
                                                        }
                                                        className="bg-gray-700 border-gray-600 text-gray-100 rounded px-2 py-1"
                                                    >
                                                        <option value="user">User</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                </td>
                                                <td className="p-2 text-gray-400 hidden sm:table-cell">
                                                    {formatDateTime(user.created_at)}
                                                </td>
                                                <td className="p-2">
                                                    <Button
                                                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1 rounded transition"
                                                        onClick={() => handleUpdateRole(user.id)}
                                                        disabled={
                                                            roleUpdates[user.id] === undefined ||
                                                            roleUpdates[user.id] === user.role
                                                        }
                                                    >
                                                        Update
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminSidebarLayout>
    )
}

