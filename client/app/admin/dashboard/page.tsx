"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Remove the Select imports since we're using native HTML select
import { Download, Upload, Clock, FileText, CheckCircle, XCircle, Hourglass, BarChart3, Shield, AlertTriangle, Users, Activity } from "lucide-react"
import { Bar, Doughnut, Pie } from "react-chartjs-2"
import { Chart, BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement } from "chart.js"
Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, ArcElement)

import AdminSidebarLayout from "@/components/layout/AdminSidebarLayout"
import { API_ENDPOINTS } from "@/lib/config"

// Add custom styles for datetime inputs in dark mode
const dateTimeInputStyles = `
  input[type="datetime-local"]::-webkit-calendar-picker-indicator {
    filter: invert(1);
    cursor: pointer;
  }
  input[type="datetime-local"]::-webkit-datetime-edit {
    color: rgb(229, 231, 235);
  }
  input[type="datetime-local"]::-webkit-datetime-edit-text {
    color: rgb(156, 163, 175);
  }
  input[type="datetime-local"]::-webkit-datetime-edit-month-field {
    color: rgb(229, 231, 235);
  }
  input[type="datetime-local"]::-webkit-datetime-edit-day-field {
    color: rgb(229, 231, 235);
  }
  input[type="datetime-local"]::-webkit-datetime-edit-year-field {
    color: rgb(229, 231, 235);
  }
  input[type="datetime-local"]::-webkit-datetime-edit-hour-field {
    color: rgb(229, 231, 235);
  }
  input[type="datetime-local"]::-webkit-datetime-edit-minute-field {
    color: rgb(229, 231, 235);
  }
`

export default function AdminDashboard() {
  const router = useRouter()

  // Redirect to login if not logged in
  useEffect(() => {
    const token = localStorage.getItem("accessToken")
    const role = localStorage.getItem("userRole")
    if (!token || role !== "admin") {
      router.replace("/users/login")
    }
  }, [router])

  const [isExporting, setIsExporting] = useState(false)
  const [activeTab, setActiveTab] = useState("overview") // New state for tabs
  
  // Existing states
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalDownloads: 0,
    expiredTokens: 0,
    totalRevoked: 0,
  })
  const [fileData, setFileData] = useState([])
  const [statusCounts, setStatusCounts] = useState({
    Downloaded: 0,
    Revoked: 0,
    Expired: 0,
  })
  const [currentPage, setCurrentPage] = useState(1)
  const rowsPerPage = 15

  // New audit states
  const [auditStats, setAuditStats] = useState({
    total_events: 0,
    successful_events: 0,
    failed_events: 0,
    security_alerts: 0,
    action_breakdown: {}
  })
  const [auditLogs, setAuditLogs] = useState([])
  const [auditFilters, setAuditFilters] = useState({
    userEmail: '',
    actionType: '',
    status: '',
    startDate: '',
    endDate: ''
  })
  const [currentAuditFilters, setCurrentAuditFilters] = useState({}) // Track applied filters
  const [auditPage, setAuditPage] = useState(0)
  const auditPageSize = 50
  const [isLoadingAuditLogs, setIsLoadingAuditLogs] = useState(false)

  // Add health check state - Fix the type structure to include error property
  const [healthData, setHealthData] = useState({
    status: 'unknown',
    timestamp: new Date().toISOString(),
    services: {
      backend: { 
        status: 'unknown', 
        uptime: 0, 
        responseTime: null,
        memory: { used: 0, total: 0 }, 
        version: 'Unknown' 
      },
      database: { 
        status: 'unknown', 
        responseTime: null, 
        lastChecked: null,
        error: undefined as string | undefined // Add error property
      },
      storage: { 
        status: 'unknown', 
        responseTime: null, 
        lastChecked: null,
        error: undefined as string | undefined // Add error property
      }
    },
    summary: { healthy: 0, unhealthy: 0, unknown: 3 }
  });
  const [lastHealthCheck, setLastHealthCheck] = useState<string | null>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(false);

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
    const fetchData = async () => {
      try {
        // Fetch dashboard stats
        const statsResponse = await axios.get(API_ENDPOINTS.ADMIN.DASHBOARD.STATS, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
        });
        console.log('📊 Stats response:', statsResponse.data);
        setStats(statsResponse.data);

        // Fetch file transfer data
        const filesResponse = await axios.get(API_ENDPOINTS.ADMIN.DASHBOARD.FILES, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
        });
        console.log('📁 Files response:', filesResponse.data);
        setFileData(filesResponse.data);

        // Fetch status counts
        const statusResponse = await axios.get(API_ENDPOINTS.ADMIN.DASHBOARD.STATUS_COUNTS, {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
        });
        console.log('📈 Status counts response:', statusResponse.data);
        setStatusCounts(statusResponse.data);

      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        // Set fallback data
        setStats({ totalUploads: 0, totalDownloads: 0, expiredTokens: 0, totalRevoked: 0 });
        setFileData([]);
        setStatusCounts({ Downloaded: 0, Revoked: 0, Expired: 0 });
      }

      // Fetch audit stats
      loadAuditStats();
      loadAuditLogs({}, 0); // Start with no filters and page 0

      // Fetch health data
      loadHealthCheck();
    };

    fetchData();
  }, [])

  // New audit functions
  const loadAuditStats = async () => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.ADMIN.AUDIT_STATS}?timeRange=24h`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      })
      if (response.data.success) {
        setAuditStats(response.data.data)
      }
    } catch (error) {
      console.error('Error loading audit stats:', error)
    }
  }

  const loadAuditLogs = async (filters = {}, page = auditPage) => {
    setIsLoadingAuditLogs(true);
    try {
      const params = new URLSearchParams({
        limit: auditPageSize.toString(),
        offset: (page * auditPageSize).toString(),
        ...filters
      })

      console.log('🔍 Loading audit logs with filters:', filters, 'page:', page)
      console.log('🔗 API URL:', `${API_ENDPOINTS.ADMIN.AUDIT_LOGS}?${params.toString()}`)
      
      const response = await axios.get(`${API_ENDPOINTS.ADMIN.AUDIT_LOGS}?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      })
      
      console.log('📋 Audit logs API response:', response.data)
      
      if (response.data.success) {
        console.log('📋 Audit logs loaded:', response.data.data.length, 'records')
        setAuditLogs(response.data.data)
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
      if (axios.isAxiosError(error)) {
        console.error('❌ Error details:', error.response?.data)
      }
    } finally {
      setIsLoadingAuditLogs(false);
    }
  }

  const applyAuditFilters = () => {
    // Validate date range
    if (auditFilters.startDate && auditFilters.endDate && auditFilters.startDate > auditFilters.endDate) {
      alert('Start date cannot be later than end date')
      return
    }

    const filters = Object.fromEntries(
      Object.entries(auditFilters).filter(([_, value]) => value !== '')
    )
    console.log('🔍 Applying audit filters:', filters)
    console.log('🔍 Current auditFilters state:', auditFilters)
    setCurrentAuditFilters(filters)
    setAuditPage(0)
    loadAuditLogs(filters, 0)
  }

  const clearAuditFilters = () => {
    setAuditFilters({
      userEmail: '',
      actionType: '',
      status: '',
      startDate: '',
      endDate: ''
    })
    setCurrentAuditFilters({})
    setAuditPage(0)
    loadAuditLogs({}, 0)
  }

  // Helper function to set quick date ranges
  const setQuickDateRange = (range: string) => {
    const now = new Date()
    const endDate = now.toISOString().slice(0, 16) // Format for datetime-local
    let startDate = ''

    switch (range) {
      case 'today':
        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)
        startDate = todayStart.toISOString().slice(0, 16)
        break
      case 'yesterday':
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)
        yesterday.setHours(0, 0, 0, 0)
        startDate = yesterday.toISOString().slice(0, 16)
        const yesterdayEnd = new Date(yesterday)
        yesterdayEnd.setHours(23, 59, 59, 999)
        const endYesterday = yesterdayEnd.toISOString().slice(0, 16)
        setAuditFilters(prev => ({...prev, startDate, endDate: endYesterday}))
        return
      case 'week':
        const weekAgo = new Date(now)
        weekAgo.setDate(now.getDate() - 7)
        startDate = weekAgo.toISOString().slice(0, 16)
        break
      case 'month':
        const monthAgo = new Date(now)
        monthAgo.setMonth(now.getMonth() - 1)
        startDate = monthAgo.toISOString().slice(0, 16)
        break
    }

    setAuditFilters(prev => ({...prev, startDate, endDate}))
  }

  const exportAuditLogs = async () => {
    try {
      // Get all audit logs with current filters (not just the current page)
      const params = new URLSearchParams({
        limit: '1000', // Get more records for export
        offset: '0',
        ...currentAuditFilters
      })

      console.log('📤 Exporting audit logs with filters:', currentAuditFilters)
      
      const response = await axios.get(`${API_ENDPOINTS.ADMIN.AUDIT_LOGS}?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      })
      
      if (response.data.success) {
        const csv = convertToCSV(response.data.data)
        downloadCSV(csv, `audit-logs-${new Date().toISOString().split('T')[0]}.csv`)
      }
    } catch (error) {
      console.error('Error exporting audit logs:', error)
      alert('Export failed. Please try again.')
    }
  }

  const convertToCSV = (logs: any[]) => {
    const headers = ['Timestamp', 'Action Type', 'User Email', 'Status', 'IP Address', 'Details']
    const rows = logs.map(log => [
      log.timestamp,
      log.action_type,
      log.user_email,
      log.status,
      log.ip_address || '',
      JSON.stringify(log.details)
    ])

    return [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.setAttribute('hidden', '')
    a.setAttribute('href', url)
    a.setAttribute('download', filename)
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem("accessToken");
      
      if (!token) {
        console.error("No access token found");
        alert("Authentication required. Please log in again.");
        router.push("/users/login");
        return;
      }

      console.log('🔄 Starting CSV export...');
      
      const response = await axios.get(API_ENDPOINTS.ADMIN.DASHBOARD.EXPORT_CSV, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: "blob"
      });

      console.log('✅ CSV export successful');

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `file-transfers-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      console.log('📁 CSV file downloaded successfully');
    } catch (error) {
      console.error('❌ CSV export failed:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          alert("Session expired. Please log in again.");
          localStorage.removeItem("accessToken");
          localStorage.removeItem("userRole");
          router.push("/users/login");
        } else {
          alert(`Export failed: ${error.response?.data?.error || error.message}`);
        }
      } else {
        alert("Export failed. Please try again.");
      }
    } finally {
      setIsExporting(false);
    }
  }

  // Health check functions
  const loadHealthCheck = async () => {
    setIsLoadingHealth(true);
    try {
      console.log('🏥 Starting health check...');
      
      const response = await axios.get(API_ENDPOINTS.ADMIN.HEALTH, {
        headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` }
      });
      
      console.log('🏥 Health check response:', response.data);
      
      if (response.data.success) {
        setHealthData(response.data.data);
        setLastHealthCheck(new Date().toLocaleString());
        console.log('✅ Health data updated successfully');
      } else {
        console.error('❌ Health check returned unsuccessful response:', response.data);
        throw new Error('Health check unsuccessful');
      }
    } catch (error) {
      console.error('❌ Health check failed:', error);
      // Fix: Type guard to check if error is an AxiosError
      if (axios.isAxiosError(error)) {
        console.error('❌ Error details:', error.response?.data);
      } else {
        console.error('❌ Unknown error:', error);
      }
      
      // Set fallback health data - now matches the initial state structure
      setHealthData({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          backend: { 
            status: 'unhealthy', 
            uptime: 0, 
            responseTime: null,
            memory: { used: 0, total: 0 }, 
            version: 'Unknown' 
          },
          database: { 
            status: 'unknown', 
            responseTime: null, 
            lastChecked: null,
            error: 'Health check failed' // Add error property
          },
          storage: { 
            status: 'unknown', 
            responseTime: null, 
            lastChecked: null,
            error: 'Health check failed' // Add error property
          }
        },
        summary: { healthy: 0, unhealthy: 1, unknown: 2 }
      });
      setLastHealthCheck(new Date().toLocaleString());
    } finally {
      setIsLoadingHealth(false);
    }
  };

  // Auto-refresh health check every 30 seconds
  useEffect(() => {
    loadHealthCheck();
    const interval = setInterval(loadHealthCheck, 30000);
    return () => clearInterval(interval);
  }, []);

  // Inject custom styles for datetime inputs
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = dateTimeInputStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'Downloaded': 
      case 'healthy': 
      case 'SUCCESS': 
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'Expired': 
      case 'unhealthy': 
      case 'FAILED': 
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      case 'Revoked': 
      case 'degraded': 
      case 'PENDING': 
        return 'bg-orange-500/20 text-orange-400 border border-orange-500/30';
      default: 
        console.log('🎨 Unknown status color for:', status)
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'unhealthy': return 'text-red-500';
      case 'degraded': return 'text-yellow-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'Downloaded':
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'unhealthy':
      case 'Expired':
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'degraded':
      case 'Revoked':
      case 'PENDING':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default: 
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy': return 'System is healthy';
      case 'unhealthy': return 'System is unhealthy';
      case 'degraded': return 'System is experiencing issues';
      default: return 'Status unknown';
    }
  };

  const statusBarData = {
    labels: ["Downloaded", "Revoked", "Expired"],
    datasets: [
      {
        label: "File Status",
        data: [statusCounts.Downloaded, statusCounts.Revoked, statusCounts.Expired],
        backgroundColor: ["#22c55e", "#f97316", "#ef4444"],
        borderRadius: 6,
      },
    ],
  }

  const statusBarOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: "#d1d5db" } },
      y: { grid: { color: "#374151" }, ticks: { color: "#d1d5db", stepSize: 1, beginAtZero: true } },
    },
  }

  // Chart data for audit logs
  const eventTypesChart = {
    labels: Object.keys(auditStats.action_breakdown),
    datasets: [{
      data: Object.values(auditStats.action_breakdown),
      backgroundColor: [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
        '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'
      ]
    }]
  }

  const successFailureChart = {
    labels: ['Success', 'Failed'],
    datasets: [{
      data: [auditStats.successful_events, auditStats.failed_events],
      backgroundColor: ['#10B981', '#EF4444']
    }]
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const
      }
    }
  }

  // Pagination logic
  const paginatedFiles = fileData.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const totalPages = Math.ceil(fileData.length / rowsPerPage)

  return (
    <AdminSidebarLayout>
      {/* Header */}
      <div className="w-full py-6 sm:py-8 text-center animate-fade-in">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 text-gray-100">Admin Dashboard</h1>
        
        {/* Tab Navigation */}
        <div className="flex justify-center mt-4">
          <div className="bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "overview"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("health")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "health"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              <Activity className="w-4 h-4 inline mr-2" />
              System Health
            </button>
            <button
              onClick={() => setActiveTab("audit")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === "audit"
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-700"
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Security Audit
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-2 sm:p-4 space-y-6 max-w-7xl mx-auto">
        {activeTab === "overview" ? (
          <>
            {/* Existing Overview Content */}
            {/* Stats Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
              <Card className="bg-gray-800/90 border-gray-700 hover:scale-105 transition-transform duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-200">Total Uploads</CardTitle>
                  <Upload className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-gray-100">{stats.totalUploads.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/90 border-gray-700 hover:scale-105 transition-transform duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-200">Total Downloads</CardTitle>
                  <Download className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-gray-100">{stats.totalDownloads.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/90 border-gray-700 hover:scale-105 transition-transform duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-200">Total Expired Tokens</CardTitle>
                  <Clock className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-gray-100">{stats.expiredTokens.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/90 border-gray-700 hover:scale-105 transition-transform duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-200">Total Revoked</CardTitle>
                  <XCircle className="h-4 w-4 text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-gray-100">{statusCounts.Revoked?.toLocaleString?.() ?? "0"}</div>
                </CardContent>
              </Card>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
              <Card className="bg-gray-800/90 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-100 flex items-center gap-2 text-base sm:text-lg">
                    <BarChart3 className="w-5 h-5" />
                    File Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(["Downloaded", "Revoked", "Expired"] as const).map((status) => (
                      <div key={status} className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(status)}
                          <span className="text-xs sm:text-sm font-medium text-gray-200">{status}</span>
                        </div>
                        <div className="flex items-center gap-4 w-full xs:w-auto">
                          <div className="w-full xs:w-32 bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                status === "Downloaded"
                                  ? "bg-green-500"
                                  : status === "Revoked"
                                    ? "bg-orange-500"
                                    : "bg-red-500"
                              }`}
                              style={{ width: `${(stats.totalUploads ? (statusCounts[status as keyof typeof statusCounts] / stats.totalUploads) * 100 : 0)}%` }}
                            />
                          </div>
                          <span className="text-xs sm:text-sm font-bold w-12 xs:w-16 text-right text-gray-200">
                            {statusCounts[status as keyof typeof statusCounts]?.toLocaleString?.() ?? "0"}
                            <span className="text-[10px] sm:text-xs text-gray-400 block">
                              {stats.totalUploads ? ((statusCounts[status as keyof typeof statusCounts] / stats.totalUploads) * 100).toFixed(1) : "0.0"}%
                            </span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/90 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-100 text-base sm:text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={handleExportCSV}
                    disabled={isExporting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    {isExporting ? "Exporting..." : "Export CSV"}
                  </Button>
                  <Button
                    onClick={() => setActiveTab("audit")}
                    variant="outline"
                    className="w-full bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Shield className="w-4 h-4 mr-2" />
                    View Security Audit
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Files Table */}
            <Card className="bg-gray-800/90 border-gray-700 animate-fade-in">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <CardTitle className="text-gray-100 text-base sm:text-lg">Recent File Transfers</CardTitle>
                <Button
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export CSV"}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-2 text-gray-300 min-w-[120px]">Sender Email</th>
                        <th className="text-left p-2 text-gray-300 min-w-[120px]">Receiver Email</th>
                        <th className="text-left p-2 text-gray-300 min-w-[80px]">Status</th>
                        <th className="text-left p-2 hidden md:table-cell text-gray-300 min-w-[120px]">Upload Time</th>
                        <th className="text-left p-2 hidden md:table-cell text-gray-300 min-w-[120px]">Download Time</th>
                        <th className="text-left p-2 hidden lg:table-cell text-gray-300 min-w-[120px]">Expiry Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedFiles.map((file: any) => (
                        <tr
                          key={file.id}
                          className="border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="p-2 text-gray-200 break-all">{file.senderEmail}</td>
                          <td className="p-2 text-gray-200 break-all">{file.receiverEmail}</td>
                          <td className="p-2">
                            <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${getStatusBgColor(file.status)}`}>
                              {getStatusIcon(file.status)}
                              <span className="text-xs font-medium">{file.status}</span>
                            </div>
                          </td>
                          <td className="p-2 text-[10px] sm:text-xs text-gray-400 hidden md:table-cell">{formatDateTime(file.uploadTime)}</td>
                          <td className="p-2 text-[10px] sm:text-xs text-gray-400 hidden md:table-cell">{formatDateTime(file.downloadTime)}</td>
                          <td className="p-2 text-[10px] sm:text-xs text-gray-400 hidden lg:table-cell">{formatDateTime(file.expiryTime)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row justify-end items-center mt-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-gray-400 text-xs sm:text-sm">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : activeTab === "health" ? (
          <>
            {/* System Health Tab Content */}
            
            {/* Overall Status Header */}
            <Card className="bg-gray-800/90 border-gray-700 animate-fade-in">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(healthData.status)}
                    <div>
                      <CardTitle className="text-gray-100 text-xl">
                        System Status: <span className={getStatusColor(healthData.status)}>
                          {healthData.status.charAt(0).toUpperCase() + healthData.status.slice(1)}
                        </span>
                      </CardTitle>
                      <p className="text-gray-400 text-sm">
                        Last checked: {lastHealthCheck || 'Never'}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={loadHealthCheck}
                    disabled={isLoadingHealth}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    {isLoadingHealth ? 'Checking...' : 'Refresh'}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Service Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              {/* Backend Service */}
              <Card className="bg-gray-800/90 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-100 flex items-center gap-2">
                    {getStatusIcon(healthData.services.backend.status)}
                    Backend Service
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={getStatusColor(healthData.services.backend.status)}>
                      {healthData.services.backend.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Uptime:</span>
                    <span className="text-gray-200">
                      {formatUptime(healthData.services.backend.uptime || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory Usage:</span>
                    <span className="text-gray-200">
                      {healthData.services.backend.memory?.used ? 
                        `${Math.round(healthData.services.backend.memory.used / 1024 / 1024)}MB` : 
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Memory Total:</span>
                    <span className="text-gray-200">
                      {healthData.services.backend.memory?.total ? 
                        `${Math.round(healthData.services.backend.memory.total / 1024 / 1024)}MB` : 
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Node Version:</span>
                    <span className="text-gray-200">
                      {healthData.services.backend.version || 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Database Service */}
              <Card className="bg-gray-800/90 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-100 flex items-center gap-2">
                    {getStatusIcon(healthData.services.database.status)}
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={getStatusColor(healthData.services.database.status)}>
                      {healthData.services.database.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Response Time:</span>
                    <span className="text-gray-200">
                      {healthData.services.database.responseTime ? 
                        `${healthData.services.database.responseTime}ms` : 
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Checked:</span>
                    <span className="text-gray-200 text-xs">
                      {healthData.services.database.lastChecked ? 
                        new Date(healthData.services.database.lastChecked).toLocaleTimeString() : 
                        'N/A'}
                    </span>
                  </div>
                  {healthData.services.database.error && (
                    <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-700">
                      <span className="text-red-400 text-xs">{healthData.services.database.error}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Storage Service */}
              <Card className="bg-gray-800/90 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-100 flex items-center gap-2">
                    {getStatusIcon(healthData.services.storage.status)}
                    S3 Storage
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={getStatusColor(healthData.services.storage.status)}>
                      {healthData.services.storage.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Response Time:</span>
                    <span className="text-gray-200">
                      {healthData.services.storage.responseTime ? 
                        `${healthData.services.storage.responseTime}ms` : 
                        'N/A'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Last Checked:</span>
                    <span className="text-gray-200 text-xs">
                      {healthData.services.storage.lastChecked ? 
                        new Date(healthData.services.storage.lastChecked).toLocaleTimeString() : 
                        'N/A'}
                    </span>
                  </div>
                  {healthData.services.storage.error && (
                    <div className="mt-2 p-2 bg-red-900/20 rounded border border-red-700">
                      <span className="text-red-400 text-xs">{healthData.services.storage.error}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Health Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <Card className="bg-gray-800/90 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-100">Health Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-gray-300">Healthy Services</span>
                      </div>
                      <span className="text-green-500 font-bold">{healthData.summary.healthy}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span className="text-gray-300">Unhealthy Services</span>
                      </div>
                      <span className="text-red-500 font-bold">{healthData.summary.unhealthy}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-300">Unknown Services</span>
                      </div>
                      <span className="text-gray-400 font-bold">{healthData.summary.unknown}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/90 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-100">System Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Environment:</span>
                      <span className="text-gray-200">{process.env.NODE_ENV || 'development'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Auto-refresh:</span>
                      <span className="text-green-500">Every 30 seconds</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Monitoring:</span>
                      <span className="text-blue-500">Real-time</span>
                    </div>
                    <div className="mt-4 p-3 bg-blue-900/20 rounded border border-blue-700">
                      <p className="text-blue-400 text-sm">
                        💡 Health checks run automatically every 30 seconds. Use the refresh button for manual checks.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        ) : (
          <>
            {/* Security Audit Tab Content */}
            {/* Audit Statistics Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
              <Card className="bg-gray-800/90 border-gray-700 hover:scale-105 transition-transform duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-200">Total Events (24h)</CardTitle>
                  <Activity className="h-4 w-4 text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-gray-100">{auditStats.total_events.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/90 border-gray-700 hover:scale-105 transition-transform duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-200">Successful Events</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-gray-100">{auditStats.successful_events.toLocaleString()}</div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/90 border-gray-700 hover:scale-105 transition-transform duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-200">Failed Events</CardTitle>
                  <XCircle className="h-4 w-4 text-red-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-gray-100">
                    {auditStats.failed_events.toLocaleString()}
                  </div>
                  {auditStats.failed_events > 0 && (
                    <p className="text-xs text-red-400 mt-1">
                      ⚠️ Review failed operations
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gray-800/90 border-gray-700 hover:scale-105 transition-transform duration-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-xs sm:text-sm font-medium text-gray-200">Security Alerts</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-xl sm:text-2xl font-bold text-gray-100">
                    {auditStats.security_alerts?.toLocaleString() || '0'}
                  </div>
                  {auditStats.security_alerts > 0 && (
                    <p className="text-xs text-yellow-400 mt-1">
                      ⚠️ Security issues detected
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
              <Card className="bg-gray-800/90 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-100 text-base sm:text-lg">Event Types Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Doughnut data={eventTypesChart} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/90 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-100 text-base sm:text-lg">Success vs Failure Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <Pie data={successFailureChart} options={chartOptions} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-gray-800/90 border-gray-700 animate-fade-in">
              <CardHeader>
                <CardTitle className="text-gray-100 text-base sm:text-lg">🔍 Filter Audit Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">User Email</label>
                    <Input
                      type="email"
                      value={auditFilters.userEmail}
                      onChange={(e) => setAuditFilters({...auditFilters, userEmail: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-gray-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Action Type</label>
                    <select
                      value={auditFilters.actionType}
                      onChange={(e) => setAuditFilters({...auditFilters, actionType: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md px-3 py-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                    >
                      <option value="">All Actions</option>
                      <option value="FILE_UPLOAD">File Upload</option>
                      <option value="FILE_DOWNLOAD">File Download</option>
                      <option value="FILE_REVOKE">File Revoke</option>
                      <option value="TOKEN_GENERATION">Token Generation</option>
                      <option value="OTP_GENERATION">OTP Generation</option>
                      <option value="OTP_VERIFICATION">OTP Verification</option>
                      <option value="ADMIN_ACTION">Admin Action</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
                    <select
                      value={auditFilters.status}
                      onChange={(e) => setAuditFilters({...auditFilters, status: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 text-gray-200 rounded-md px-3 py-2 focus:ring-gray-500 focus:border-gray-500 text-sm"
                    >
                      <option value="">All Status</option>
                      <option value="SUCCESS">Success</option>
                      <option value="FAILED">Failed</option>
                      <option value="PENDING">Pending</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Start Date 
                      {auditFilters.startDate && <span className="text-blue-400 ml-1">✓</span>}
                    </label>
                    <input
                      type="datetime-local"
                      value={auditFilters.startDate}
                      onChange={(e) => setAuditFilters({...auditFilters, startDate: e.target.value})}
                      className={`w-full bg-gray-700 border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm hover:border-gray-500 transition-colors ${
                        auditFilters.startDate ? 'border-blue-500 text-gray-100' : 'border-gray-600 text-gray-200'
                      }`}
                      title="Select start date and time for filtering"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      End Date 
                      {auditFilters.endDate && <span className="text-blue-400 ml-1">✓</span>}
                    </label>
                    <input
                      type="datetime-local"
                      value={auditFilters.endDate}
                      onChange={(e) => setAuditFilters({...auditFilters, endDate: e.target.value})}
                      className={`w-full bg-gray-700 border rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm hover:border-gray-500 transition-colors ${
                        auditFilters.endDate ? 'border-blue-500 text-gray-100' : 'border-gray-600 text-gray-200'
                      }`}
                      title="Select end date and time for filtering"
                      min={auditFilters.startDate || undefined}
                    />
                  </div>
                </div>

                {/* Quick Date Range Buttons */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="text-sm text-gray-400 mr-2">Quick ranges:</span>
                  <button
                    type="button"
                    onClick={() => setQuickDateRange('today')}
                    className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 rounded"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDateRange('yesterday')}
                    className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 rounded"
                  >
                    Yesterday
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDateRange('week')}
                    className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 rounded"
                  >
                    Last 7 days
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDateRange('month')}
                    className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-500 text-gray-200 rounded"
                  >
                    Last 30 days
                  </button>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button 
                    onClick={applyAuditFilters} 
                    disabled={isLoadingAuditLogs}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoadingAuditLogs ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      'Apply Filters'
                    )}
                  </Button>
                  <Button 
                    onClick={clearAuditFilters} 
                    variant="outline" 
                    disabled={isLoadingAuditLogs}
                    className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Clear Filters
                  </Button>
                  <Button 
                    onClick={exportAuditLogs} 
                    disabled={isLoadingAuditLogs}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export CSV
                  </Button>
                  {Object.keys(currentAuditFilters).length > 0 && (
                    <div className="text-xs text-gray-400 flex items-center">
                      <span>Active filters: {Object.entries(currentAuditFilters).map(([key, value]) => `${key}=${value}`).join(', ')}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Audit Logs Table */}
            <Card className="bg-gray-800/90 border-gray-700 animate-fade-in">
              <CardHeader>
                <CardTitle className="text-gray-100 text-base sm:text-lg flex items-center justify-between">
                  📋 Recent Audit Logs
                  {Object.keys(currentAuditFilters).length > 0 && (
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                      Filtered ({Object.keys(currentAuditFilters).length} active)
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingAuditLogs && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-400">Loading audit logs...</span>
                  </div>
                )}
                
                {!isLoadingAuditLogs && auditLogs.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-400">
                      {Object.keys(currentAuditFilters).length > 0 
                        ? "No audit logs found matching the selected filters" 
                        : "No audit logs available"
                      }
                    </p>
                  </div>
                )}
                
                {!isLoadingAuditLogs && auditLogs.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left p-2 text-gray-300">Timestamp</th>
                          <th className="text-left p-2 text-gray-300">Action</th>
                          <th className="text-left p-2 text-gray-300">User</th>
                          <th className="text-left p-2 text-gray-300">Status</th>
                          <th className="text-left p-2 text-gray-300">IP Address</th>
                          <th className="text-left p-2 text-gray-300">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {auditLogs.map((log: any) => (
                          <tr key={log.id} className="border-b border-gray-700/50 hover:bg-gray-700/50 transition-colors">
                            <td className="p-2 text-gray-200">
                              {formatDateTime(log.timestamp)}
                            </td>
                            <td className="p-2">
                              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                {log.action_type}
                              </span>
                            </td>
                            <td className="p-2 text-gray-200">{log.user_email}</td>
                            <td className="p-2">
                              <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-md ${getStatusBgColor(log.status)}`}>
                                {getStatusIcon(log.status)}
                                <span className="text-xs font-medium">{log.status}</span>
                              </div>
                            </td>
                            <td className="p-2 text-gray-200">{log.ip_address || '—'}</td>
                            <td className="p-2 text-gray-200">
                              <pre className="whitespace-pre-wrap break-all text-xs">{JSON.stringify(log.details, null, 2)}</pre>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Pagination Controls */}
                <div className="flex flex-col sm:flex-row justify-end items-center mt-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                    disabled={auditPage === 0 || isLoadingAuditLogs}
                    onClick={() => {
                      const newPage = auditPage - 1;
                      setAuditPage(newPage);
                      loadAuditLogs(currentAuditFilters, newPage);
                    }}
                  >
                    Previous
                  </Button>
                  <span className="text-gray-400 text-xs sm:text-sm">
                    Page {auditPage + 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
                    disabled={auditLogs.length < auditPageSize || isLoadingAuditLogs}
                    onClick={() => {
                      const newPage = auditPage + 1;
                      setAuditPage(newPage);
                      loadAuditLogs(currentAuditFilters, newPage);
                    }}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="w-full py-4 sm:py-6 text-center border-t border-gray-800 mt-8">
        <p className="text-xs sm:text-sm text-gray-500">© 2024 Secure File Sharing Platform. All rights reserved.</p>
      </div>
    </AdminSidebarLayout>
  )
}


