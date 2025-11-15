import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Card, Row, Col, Button, Badge, Alert, Typography, Space, message } from 'antd';
import { 
  UserOutlined,
  TeamOutlined,
  BellOutlined,
  PlusOutlined,
  EyeOutlined,
  ApartmentOutlined as ClassOutlined,
  UsergroupAddOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import api from '../api/apiClient';
import { useNavigate } from 'react-router-dom';
import DashboardStats from './DashboardStats';
import DashboardCharts from './DashboardCharts';

const { Title: AntTitle, Text } = Typography;

export default function SchoolDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      students: { total: 0, change: 0, boarding: 0, day: 0, male: 0, female: 0 },
      teachers: { total: 0, change: 0 },
      staff: { total: 0, change: 0, by_type: { labels: [], data: [] } },
      classes: { total: 0, change: 0 },
      feesCollected: { total: 0, change: 0 },
      pendingFees: { total: 0, change: 0 },
      attendance: { rate: 0, change: 0 }
    },
    feeTrend: { labels: [], data: [] },
    feeBreakdown: { labels: [], data: [] },
    classDistribution: { labels: [], data: [] },
    genderDistribution: { labels: [], data: [] },
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/school-dashboard-summary/');
      setDashboardData(response.data);
      
    } catch (err) {
      console.error('Dashboard API error:', err);
      setError('Failed to load dashboard data. Please try again.');
      message.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { 
      title: 'Add New Student', 
      icon: <UserOutlined />, 
      color: '#1677ff',
      onClick: () => navigate('/school-dashboard/students/add')
    },
    { 
      title: 'Add New Teacher', 
      icon: <TeamOutlined />, 
      color: '#52c41a',
      onClick: () => navigate('/school-dashboard/staff/add', { state: { isTeacher: true } })
    },
    { 
      title: 'Create Class', 
      icon: <ClassOutlined />, 
      color: '#722ed1',
      onClick: () => navigate('/school-dashboard/classes/add')
    },
    { 
      title: 'View Students', 
      icon: <EyeOutlined />, 
      color: '#faad14',
      onClick: () => navigate('/school-dashboard/students')
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <Text className="mt-4 text-gray-600">Loading dashboard...</Text>
        </div>
      </div>
    );
  }

  const { stats, recentActivities } = dashboardData;

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200"
      >
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
          <div>
            <AntTitle level={2} className="!mb-1 text-slate-800 flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <ClassOutlined className="text-white text-2xl" />
              </div>
              School Dashboard
            </AntTitle>
            <Text type="secondary" className="text-base">
              Welcome back, <span className="font-semibold text-slate-700">{user?.name || 'Administrator'}</span>
            </Text>
          </div>
          <Space className="mt-4 lg:mt-0" size="middle">
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchDashboard}
              className="hover:scale-105 transition-transform"
            >
              Refresh
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/school-dashboard/students/add')}
              size="large"
              className="bg-gradient-to-r from-blue-500 to-purple-600 border-none shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              Add Student
            </Button>
          </Space>
        </div>
      </motion.div>

      {/* Alerts */}
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" onClick={fetchDashboard}>
              Retry
            </Button>
          }
          className="rounded-xl"
        />
      )}

      {/* Stats Component */}
      <DashboardStats stats={stats} navigate={navigate} />

      {/* Charts and Activities */}
      <DashboardCharts 
        dashboardData={dashboardData}
        quickActions={quickActions}
        recentActivities={recentActivities}
        stats={stats}
      />
    </div>
  );
}