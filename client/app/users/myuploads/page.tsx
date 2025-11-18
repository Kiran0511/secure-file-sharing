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
import { ChevronLeft, ChevronRight } from "lucide-react"
import { API_ENDPOINTS } from "@/lib/config"

export default function MyUploadsPage() {
    const router = useRouter()
    const [uploads, setUploads] = useState([])
    const [loading, setLoading] = useState(true)
    const [currentPage, setCurrentPage] = useState(1)
    const [itemsPerPage] = useState(15) // Changed from 30 to 15

    // Calculate pagination
    const totalPages = Math.ceil(uploads.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const currentUploads = uploads.slice(startIndex, endIndex)

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
            .get(API_ENDPOINTS.USER.MY_UPLOADS, {
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
                API_ENDPOINTS.USER.REVOKE_UPLOAD,
                { uploadId: id },
                { headers: { Authorization: `Bearer ${token}` } }
            )
            
            if (res.data.success) {
                // Remove the upload from state immediately after successful revoke
                setUploads((prev) => prev.filter((upload: any) => upload.id !== id))
                toast.success(res.data.message || "Upload revoked successfully!")
                
                // Adjust current page if necessary
                const newTotalPages = Math.ceil((uploads.length - 1) / itemsPerPage)
                if (currentPage > newTotalPages && newTotalPages > 0) {
                    setCurrentPage(newTotalPages)
                }
            } else {
                toast.error(res.data.message || "Failed to revoke upload.")
            }
        } catch (err: any) {
            toast.error(
                err?.response?.data?.message || "Failed to revoke upload."
            )
        }
    }

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1)
        }
    }

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1)
        }
    }

    const goToPage = (page: number) => {
        setCurrentPage(page)
    }

    return (
        <UserSidebarLayout>
            <Toaster position="top-right" />
            <Card className="bg-gray-800/90 border-gray-700 shadow-2xl animate-fade-in">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-gray-100">
                        My Uploads
                    </CardTitle>
                    {uploads.length > 0 && (
                        <div className="text-sm text-gray-400">
                            Showing {startIndex + 1}-{Math.min(endIndex, uploads.length)} of {uploads.length} uploads
                        </div>
                    )}
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center text-gray-400 py-8">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                            Loading uploads...
                        </div>
                    ) : uploads.length === 0 ? (
                        <div className="text-center text-gray-400 py-8">
                            <div className="text-6xl mb-4">📁</div>
                            <p className="text-lg mb-2">No uploads found</p>
                            <p className="text-sm">Start by uploading your first file!</p>
                        </div>
                    ) : (
                        <>
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
                                        {currentUploads.map((upload: any) => (
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
                                                <td className="p-2">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                        upload.status === 'Pending' 
                                                            ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-700' 
                                                            : upload.status === 'Downloaded'
                                                            ? 'bg-green-900/50 text-green-300 border border-green-700'
                                                            : upload.status === 'Revoked'
                                                            ? 'bg-red-900/50 text-red-300 border border-red-700'
                                                            : 'bg-gray-700 text-gray-300'
                                                    }`}>
                                                        {upload.status}
                                                    </span>
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

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-700">
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handlePrevPage}
                                            disabled={currentPage === 1}
                                            className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:opacity-50"
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            Previous
                                        </Button>
                                        
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={handleNextPage}
                                            disabled={currentPage === totalPages}
                                            className="bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 disabled:opacity-50"
                                        >
                                            Next
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-400">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                    </div>

                                    {/* Page number buttons for larger screens */}
                                    <div className="hidden md:flex items-center space-x-1">
                                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 5) {
                                                pageNum = i + 1;
                                            } else if (currentPage <= 3) {
                                                pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 2) {
                                                pageNum = totalPages - 4 + i;
                                            } else {
                                                pageNum = currentPage - 2 + i;
                                            }

                                            return (
                                                <Button
                                                    key={pageNum}
                                                    variant={currentPage === pageNum ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => goToPage(pageNum)}
                                                    className={
                                                        currentPage === pageNum
                                                            ? "bg-blue-600 text-white hover:bg-blue-700"
                                                            : "bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600"
                                                    }
                                                >
                                                    {pageNum}
                                                </Button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </UserSidebarLayout>
    )
}

