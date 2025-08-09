"use client"


import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import UserSidebarLayout from "@/components/layout/UserSidebarLayout"
import toast, { Toaster } from "react-hot-toast"
import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function MyUploadsPage() {
    const router = useRouter()
    const [uploads, setUploads] = useState([])
    const [loading, setLoading] = useState(true)

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

    useEffect(() => {
        const token = localStorage.getItem("accessToken")
        const role = localStorage.getItem("userRole")
        if (!token || role !== "user") {
            router.replace("/users/login")
            return
        }
        axios
            .get("http://192.168.73.1:3000/api/users/myuploads", {
                headers: { Authorization: `Bearer ${token}` },
            })
            .then((res) => {
                // Sort uploads by upload_time in descending order (latest first)
                const sortedUploads = res.data.sort((a: any, b: any) => {
                    const dateA = new Date(a.upload_time || 0).getTime()
                    const dateB = new Date(b.upload_time || 0).getTime()
                    return dateB - dateA
                })
                setUploads(sortedUploads)
            })
            .catch(() => setUploads([]))
            .finally(() => setLoading(false))
    }, [router])

    const handleRevoke = async (id: number) => {
        const token = localStorage.getItem("accessToken")
        try {
            const res = await axios.post(
                `http://192.168.73.1:3000/api/users/revoke-upload`,
                { uploadId: id },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            
            if (res.data.success) {
                // Remove the upload from state immediately after successful revoke
                setUploads((prev) => prev.filter((upload: any) => upload.id !== id))
                toast.success(res.data.message || "Upload revoked successfully!")
            } else {
                toast.error(res.data.message || "Failed to revoke upload.")
            }
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message || "Failed to revoke upload."
            )
        }
    }

    return (
        <UserSidebarLayout>
            <Toaster position="top-right" />
            <Card className="bg-gray-800/90 border-gray-700 shadow-2xl animate-fade-in">
                <CardHeader>
                    <CardTitle className="text-xl font-semibold text-gray-100">
                        My Uploads
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center text-gray-400 py-8">
                            Loading uploads...
                        </div>
                    ) : uploads.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                            No uploads found.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs sm:text-sm">
                                <thead>
                                    <tr className="border-b border-gray-700">
                                        <th className="text-left p-2 text-gray-300 min-w-[120px]">
                                            Receiver Email
                                        </th>
                                        <th className="text-left p-2 text-gray-300 min-w-[100px] hidden sm:table-cell">
                                            Upload Time
                                        </th>
                                        <th className="text-left p-2 text-gray-300 min-w-[80px]">
                                            Status
                                        </th>
                                        <th className="text-left p-2 text-gray-300 min-w-[100px] hidden md:table-cell">
                                            Download Time
                                        </th>
                                        <th className="text-left p-2 text-gray-300 min-w-[80px]">
                                            Action
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {uploads.map((upload: any) => (
                                        <tr
                                            key={upload.id}
                                            className="border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors"
                                        >
                                            <td className="p-2 text-gray-200 break-all">
                                                {upload.receiver_email}
                                            </td>
                                            <td className="p-2 text-gray-400 hidden sm:table-cell">
                                                {formatDateTime(upload.upload_time)}
                                            </td>
                                            <td className="p-2 text-gray-200">
                                                {upload.status}
                                            </td>
                                            <td className="p-2 text-gray-400 hidden md:table-cell">
                                                {formatDateTime(upload.download_time)}
                                            </td>
                                            <td className="p-2">
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <button
                                                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                                                            disabled={upload.status !== "Pending"}
                                                        >
                                                            Revoke
                                                        </button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="bg-gray-800 border-gray-700">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle className="text-gray-100">
                                                                Confirm Revoke Upload
                                                            </AlertDialogTitle>
                                                            <AlertDialogDescription className="text-gray-300">
                                                                Are you sure you want to revoke this upload to{" "}
                                                                <span className="font-semibold text-gray-200">
                                                                    {upload.receiver_email}
                                                                </span>
                                                                ? This action cannot be undone and the recipient will no longer be able to download the file.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel className="bg-gray-600 hover:bg-gray-500 text-gray-100 border-gray-600">
                                                                Cancel
                                                            </AlertDialogCancel>
                                                            <AlertDialogAction 
                                                                className="bg-red-600 hover:bg-red-700 text-white"
                                                                onClick={() => handleRevoke(upload.id)}
                                                            >
                                                                Revoke Upload
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </UserSidebarLayout>
    )
}

