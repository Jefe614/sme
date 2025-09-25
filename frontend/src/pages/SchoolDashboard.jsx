import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Card, Row, Col, Statistic, Button, Badge, Alert, Typography, Space, Spin } from 'antd';
import { 
  UserOutlined,
  TeamOutlined,
  MoneyCollectOutlined,
  ExclamationCircleOutlined,
  BellOutlined,
  CalendarOutlined,
  BookOutlined,
  CarOutlined,
  FileTextOutlined,
  HomeOutlined,
  ApartmentOutlined,
} from '@ant-design/icons';
import axios from 'axios';
import { Line, Doughnut } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  LineElement, 
  PointElement, 
  Title as ChartTitle,
  Tooltip, 
  Legend, 
  ArcElement 
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, ChartTitle, Tooltip, Legend, ArcElement);

const { Title: AntTitle, Text } = Typography;

const BASE_API = import.meta.env.VITE_BASE_API || 'http://localhost:8000';

export default function SchoolDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState({
    students: { total: 0, change: 0, boarding: 0, day: 0 },
    teachers: { total: 0, change: 0 },
    feesCollected: { total: 0, change: 0 },
    pendingFees: { total: 0, change: 0 },
    attendance: { rate: 0, change: 0 }
  });
  const [feeTrend, setFeeTrend] = useState({ 
    labels: [],
    data: []
  });
  const [feeBreakdown, setFeeBreakdown] = useState({ 
    labels: [],
    data: []
  });
  const [studentTypeBreakdown, setStudentTypeBreakdown] = useState({
    labels: ['Boarding', 'Day Scholars'],
    data: [0, 0]
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        setError(null);
        
        const res = await axios.get(`${BASE_API}/api/school-dashboard-summary/`, {
          headers: { Authorization: `Token ${user.token}` },
        });
        
        // Set all data from API response
        if (res.data.stats) {
          setStats(res.data.stats);
          
          // Update student type breakdown if data is available
          if (res.data.stats.students) {
            setStudentTypeBreakdown({
              labels: ['Boarding', 'Day Scholars'],
              data: [
                res.data.stats.students.boarding || 0,
                res.data.stats.students.day || 0
              ]
            });
          }
        }
        if (res.data.feeTrend) setFeeTrend(res.data.feeTrend);
        if (res.data.feeBreakdown) setFeeBreakdown(res.data.feeBreakdown);
        if (res.data.recentActivities) setRecentActivities(res.data.recentActivities);
        if (res.data.alerts) setAlerts(res.data.alerts);
        
      } catch (err) {
        console.error('Dashboard API error:', err);
        // setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    
    if (user?.token) {
      fetchDashboard();
    }
  }, [user?.token]);

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

  const chartData = {
    labels: feeTrend.labels || [],
    datasets: [
      {
        label: 'Fees Collected',
        data: feeTrend.data || [],
        backgroundColor: 'rgba(114, 46, 209, 0.1)',
        borderColor: 'rgba(114, 46, 209, 1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const feeBreakdownChart = {
    labels: feeBreakdown.labels || [],
    datasets: [
      {
        data: feeBreakdown.data || [],
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

  const studentTypeChart = {
    labels: studentTypeBreakdown.labels,
    datasets: [
      {
        data: studentTypeBreakdown.data,
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
        callbacks: {
          label: function(context) {
            return `KSh ${context.parsed.y.toLocaleString()}`;
          }
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { 
          color: 'rgba(0, 0, 0, 0.6)',
          callback: function(value) {
            return `KSh ${value.toLocaleString()}`;
          }
        },
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
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: KSh ${value.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
  };

  const studentTypeOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { padding: 20, usePointStyle: true },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a, b) => a + b, 0);
            const percentage = Math.round((value / total) * 100);
            return `${label}: ${value} students (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%',
  };

  const quickActions = [
    { title: 'Add New Student', icon: <UserOutlined />, color: '#1677ff' },
    { title: 'Record Fee Payment', icon: <MoneyCollectOutlined />, color: '#52c41a' },
    { title: 'Send Fee Reminder', icon: <BellOutlined />, color: '#722ed1' },
    { title: 'Generate Report', icon: <FileTextOutlined />, color: '#faad14' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Error"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => window.location.reload()}>
            Retry
          </Button>
        }
      />
    );
  }

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
            danger 
            onClick={logout}
            size="large"
          >
            Logout
          </Button>
        </Space>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Alert
          message="Attention Required"
          description={
            <ul className="list-disc list-inside space-y-1 mt-2">
              {alerts.map((alert, idx) => (
                <li key={idx}>{alert.message}</li>
              ))}
            </ul>
          }
          type="warning"
          icon={<ExclamationCircleOutlined />}
          closable
          className="mb-6"
        />
      )}

      {/* Main Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="text-center gradient-card-blue">
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
            <Card className="text-center gradient-card-green">
              <Statistic
                title={<Text className="text-white/80">Active Teachers</Text>}
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
            <Card className="text-center gradient-card-purple">
              <Statistic
                title={<Text className="text-white/80">Fees Collected</Text>}
                value={stats.feesCollected.total}
                prefix="KSh "
                formatter={(value) => formatNumber(value)}
                valueStyle={{ color: 'white', fontSize: '28px' }}
                suffix={
                  stats.feesCollected.change !== 0 && (
                    <div className="text-white/80 text-sm flex items-center justify-center mt-1">
                      <span className={`ml-1 ${stats.feesCollected.change > 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {stats.feesCollected.change > 0 ? '+' : ''}{stats.feesCollected.change}%
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
            <Card className="text-center gradient-card-orange">
              <Statistic
                title={<Text className="text-white/80">Pending Fees</Text>}
                value={stats.pendingFees.total}
                prefix="KSh "
                formatter={(value) => formatNumber(value)}
                valueStyle={{ color: 'white', fontSize: '28px' }}
                suffix={
                  stats.pendingFees.change !== 0 && (
                    <div className="text-white/80 text-sm flex items-center justify-center mt-1">
                      <span className={`ml-1 ${stats.pendingFees.change > 0 ? 'text-green-300' : 'text-red-300'}`}>
                        {stats.pendingFees.change > 0 ? '+' : ''}{stats.pendingFees.change}%
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card 
              title="Fee Collection Trend"
              extra={
                <Space>
                  <Button size="small" type="primary">6M</Button>
                  <Button size="small">1Y</Button>
                </Space>
              }
            >
              <div style={{ height: '300px' }}>
                {feeTrend.data && feeTrend.data.length > 0 ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <div className="flex justify-center items-center h-full text-gray-400">
                    No fee data available
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
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
                    className="text-left flex items-center justify-start"
                    style={{ borderColor: action.color, color: action.color }}
                  >
                    {action.title}
                  </Button>
                ))}
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Additional Stats and Activities */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card title="Student Type Breakdown">
              <div style={{ height: '250px' }}>
                <Doughnut data={studentTypeChart} options={studentTypeOptions} />
              </div>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card title="Fee Breakdown">
              <div style={{ height: '250px' }}>
                {feeBreakdown.data && feeBreakdown.data.length > 0 ? (
                  <Doughnut data={feeBreakdownChart} options={doughnutOptions} />
                ) : (
                  <div className="flex justify-center items-center h-full text-gray-400">
                    No fee breakdown data
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </Col>

        <Col xs={24} lg={8}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card 
              title="Recent Activities"
              extra={<Button type="link" size="small">View All</Button>}
            >
              <div className="space-y-4">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, idx) => (
                    <div key={idx} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mt-2" />
                      <div className="flex-1">
                        <Text strong className="block">{activity.description}</Text>
                        <Text type="secondary" className="text-sm">{activity.time}</Text>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    No recent activities
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </Col>
      </Row>

      {/* Quick Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card className="text-center">
            <CalendarOutlined className="text-2xl text-blue-600 mb-2" />
            <Text type="secondary" className="block text-sm">Academic Year</Text>
            <Text strong>2024/2025</Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center">
            <BookOutlined className="text-2xl text-green-600 mb-2" />
            <Text type="secondary" className="block text-sm">Current Term</Text>
            <Text strong>Term 3</Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center">
            <CarOutlined className="text-2xl text-orange-600 mb-2" />
            <Text type="secondary" className="block text-sm">Transport Routes</Text>
            <Text strong>12 Active</Text>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card className="text-center">
            <div className="w-6 h-6 bg-purple-600 rounded-full mx-auto mb-2 flex items-center justify-center">
              <span className="text-white text-xs font-bold">%</span>
            </div>
            <Text type="secondary" className="block text-sm">Attendance Rate</Text>
            <Text strong className="text-green-600">{stats.attendance?.rate || 0}%</Text>
          </Card>
        </Col>
      </Row>
    </div>
  );
}