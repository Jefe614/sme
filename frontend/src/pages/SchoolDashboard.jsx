import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Card, Row, Col, Statistic, Button, Badge, Alert, Typography, Space, message, Progress } from 'antd';
import { 
  UserOutlined,
  TeamOutlined,
  MoneyCollectOutlined,
  ExclamationCircleOutlined,
  BellOutlined,
  CalendarOutlined,
  BookOutlined,
  FileTextOutlined,
  HomeOutlined,
  ApartmentOutlined,
  PlusOutlined,
  EyeOutlined,
  ApartmentOutlined as ClassOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';
import api from '../api/apiClient';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  LineElement, 
  PointElement, 
  Title as ChartTitle,
  Tooltip, 
  Legend, 
  ArcElement,
  BarElement
} from 'chart.js';
import { useNavigate } from 'react-router-dom';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, ChartTitle, Tooltip, Legend, ArcElement, BarElement);

const { Title: AntTitle, Text } = Typography;

export default function SchoolDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState({
    stats: {
      students: { total: 0, change: 0, boarding: 0, day: 0 },
      teachers: { total: 0, change: 0 },
      staff: { total: 0, change: 0 },
      classes: { total: 0, change: 0 },
      feesCollected: { total: 0, change: 0 },
      pendingFees: { total: 0, change: 0 },
      attendance: { rate: 0, change: 0 }
    },
    feeTrend: { labels: [], data: [] },
    feeBreakdown: { labels: [], data: [] },
    classDistribution: { labels: [], data: [] },
    recentActivities: [],
    alerts: []
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

  const formatNumber = (num) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAlertType = (type) => {
    const typeMap = {
      'warning': 'warning',
      'error': 'error',
      'info': 'info',
      'success': 'success'
    };
    return typeMap[type] || 'info';
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

  // Chart data configurations
  const feeTrendChart = {
    labels: dashboardData.feeTrend.labels || [],
    datasets: [
      {
        label: 'Fees Collected',
        data: dashboardData.feeTrend.data || [],
        backgroundColor: 'rgba(114, 46, 209, 0.1)',
        borderColor: 'rgba(114, 46, 209, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const feeBreakdownChart = {
    labels: dashboardData.feeBreakdown.labels || [],
    datasets: [
      {
        data: dashboardData.feeBreakdown.data || [],
        backgroundColor: [
          '#1677ff',
          '#52c41a',
          '#faad14',
          '#ff4d4f',
          '#722ed1',
          '#13c2c2',
          '#eb2f96'
        ],
        borderWidth: 0,
      },
    ],
  };

  const classDistributionChart = {
    labels: dashboardData.classDistribution.labels || [],
    datasets: [
      {
        label: 'Students per Class',
        data: dashboardData.classDistribution.data || [],
        backgroundColor: 'rgba(22, 119, 255, 0.8)',
        borderColor: 'rgba(22, 119, 255, 1)',
        borderWidth: 2,
        borderRadius: 4,
      },
    ],
  };

  const studentTypeChart = {
    labels: ['Boarding', 'Day Scholars'],
    datasets: [
      {
        data: [
          dashboardData.stats.students.boarding || 0,
          dashboardData.stats.students.day || 0
        ],
        backgroundColor: ['#1890ff', '#52c41a'],
        borderWidth: 0,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: 'rgba(0, 0, 0, 0.6)' },
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(0, 0, 0, 0.6)' },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 20, usePointStyle: true },
      },
    },
    cutout: '60%',
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: 'rgba(0, 0, 0, 0.6)' },
      },
      x: {
        grid: { display: false },
        ticks: { color: 'rgba(0, 0, 0, 0.6)' },
      },
    },
  };

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

  const { stats, recentActivities, alerts } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center">
        <div>
          <AntTitle level={2} className="!mb-1 text-gray-800">
            School Dashboard
          </AntTitle>
          <Text type="secondary">
            Welcome back, {user?.name || 'Administrator'}
          </Text>
        </div>
        <Space className="mt-4 lg:mt-0">
          <Badge count={alerts.length} size="small">
            <Button icon={<BellOutlined />} size="large" />
          </Badge>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/school-dashboard/students/add')}
            size="large"
          >
            Add Student
          </Button>
        </Space>
      </div>

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
          className="mb-6"
        />
      )}

      {alerts.map((alert, idx) => (
        <Alert
          key={idx}
          message={alert.message}
          type={getAlertType(alert.type)}
          showIcon
          closable
          className="mb-2"
        />
      ))}

      {/* Main Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card 
              className="text-center gradient-card-blue hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate('/school-dashboard/students')}
            >
              <Statistic
                title={<Text className="text-white/80">Total Students</Text>}
                value={stats.students.total}
                prefix={<UserOutlined className="text-white/80" />}
                valueStyle={{ color: 'white', fontSize: '28px' }}
                suffix={
                  stats.students.change !== 0 && (
                    <div className="text-white/80 text-sm flex items-center justify-center mt-1">
                      <span className={`ml-1 ${stats.students.change > 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {stats.students.change > 0 ? '+' : ''}{stats.students.change}%
                      </span>
                    </div>
                  )
                }
              />
              <div className="mt-2 text-white/70 text-sm">
                <ApartmentOutlined className="mr-1" /> {stats.students.boarding} Boarding
                <span className="mx-2">•</span>
                <HomeOutlined className="mr-1" /> {stats.students.day} Day
              </div>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card 
              className="text-center gradient-card-green hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate('/school-dashboard/teachers')}
            >
              <Statistic
                title={<Text className="text-white/80">Teachers</Text>}
                value={stats.teachers.total}
                prefix={<TeamOutlined className="text-white/80" />}
                valueStyle={{ color: 'white', fontSize: '28px' }}
                suffix={
                  stats.teachers.change !== 0 && (
                    <div className="text-white/80 text-sm flex items-center justify-center mt-1">
                      <span className={`ml-1 ${stats.teachers.change > 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {stats.teachers.change > 0 ? '+' : ''}{stats.teachers.change}%
                      </span>
                    </div>
                  )
                }
              />
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card 
              className="text-center gradient-card-purple hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate('/school-dashboard/staff')}
            >
              <Statistic
                title={<Text className="text-white/80">Total Staff</Text>}
                value={stats.staff.total}
                prefix={<UsergroupAddOutlined className="text-white/80" />}
                valueStyle={{ color: 'white', fontSize: '28px' }}
                suffix={
                  stats.staff.change !== 0 && (
                    <div className="text-white/80 text-sm flex items-center justify-center mt-1">
                      <span className={`ml-1 ${stats.staff.change > 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {stats.staff.change > 0 ? '+' : ''}{stats.staff.change}%
                      </span>
                    </div>
                  )
                }
              />
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card 
              className="text-center gradient-card-orange hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => navigate('/school-dashboard/classes')}
            >
              <Statistic
                title={<Text className="text-white/80">Classes</Text>}
                value={stats.classes.total}
                prefix={<ClassOutlined className="text-white/80" />}
                valueStyle={{ color: 'white', fontSize: '28px' }}
                suffix={
                  stats.classes.change !== 0 && (
                    <div className="text-white/80 text-sm flex items-center justify-center mt-1">
                      <span className={`ml-1 ${stats.classes.change > 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {stats.classes.change > 0 ? '+' : ''}{stats.classes.change}%
                      </span>
                    </div>
                  )
                }
              />
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Charts and Quick Actions */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Student Distribution" size="small">
                <div style={{ height: '250px' }}>
                  {stats.students.total > 0 ? (
                    <Doughnut data={studentTypeChart} options={doughnutOptions} />
                  ) : (
                    <div className="flex flex-col justify-center items-center h-full text-gray-400">
                      <UserOutlined className="text-4xl mb-4" />
                      <Text>No students yet</Text>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Class Distribution" size="small">
                <div style={{ height: '250px' }}>
                  {dashboardData.classDistribution.data.length > 0 ? (
                    <Bar data={classDistributionChart} options={barOptions} />
                  ) : (
                    <div className="flex flex-col justify-center items-center h-full text-gray-400">
                      <ClassOutlined className="text-4xl mb-4" />
                      <Text>No classes yet</Text>
                    </div>
                  )}
                </div>
              </Card>
            </Col>
            <Col xs={24}>
              <Card title="Fee Collection Trend" size="small">
                <div style={{ height: '200px' }}>
                  {dashboardData.feeTrend.data.length > 0 ? (
                    <Line data={feeTrendChart} options={chartOptions} />
                  ) : (
                    <div className="flex justify-center items-center h-full text-gray-400">
                      No fee data available
                    </div>
                  )}
                </div>
              </Card>
            </Col>
          </Row>
        </Col>

        <Col xs={24} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card title="Quick Actions">
              <div className="space-y-3">
                {quickActions.map((action, idx) => (
                  <Button
                    key={idx}
                    block
                    size="large"
                    icon={action.icon}
                    onClick={action.onClick}
                    className="text-left flex items-center justify-start hover:scale-105 transition-transform"
                    style={{ borderColor: action.color, color: action.color }}
                  >
                    {action.title}
                  </Button>
                ))}
              </div>
            </Card>

            <Card title="System Overview" className="mt-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <Text>Student Capacity</Text>
                    <Text strong>{stats.students.total}/500</Text>
                  </div>
                  <Progress 
                    percent={Math.min((stats.students.total / 500) * 100, 100)} 
                    size="small" 
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-1">
                    <Text>Teacher Ratio</Text>
                    <Text strong>
                      {stats.students.total > 0 && stats.teachers.total > 0 
                        ? `1:${Math.round(stats.students.total / stats.teachers.total)}`
                        : 'N/A'
                      }
                    </Text>
                  </div>
                  <Progress 
                    percent={Math.min((stats.teachers.total / 20) * 100, 100)} 
                    size="small" 
                    strokeColor="#52c41a"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Text strong className="block text-blue-600">{stats.attendance.rate}%</Text>
                    <Text type="secondary" className="text-xs">Attendance</Text>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <Text strong className="block text-green-600">
                      {stats.feesCollected.total > 0 ? 'Good' : 'N/A'}
                    </Text>
                    <Text type="secondary" className="text-xs">Fee Status</Text>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Recent Activities */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card 
            title="Recent Activities"
            extra={
              <Button type="link" size="small">
                View All
              </Button>
            }
          >
            <div className="space-y-4">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'student' ? 'bg-blue-600' : 'bg-green-600'
                    }`} />
                    <div className="flex-1">
                      <Text strong className="block">{activity.description}</Text>
                      <Text type="secondary" className="text-sm">{activity.time}</Text>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <FileTextOutlined className="text-3xl mb-2" />
                  <div>No recent activities</div>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}