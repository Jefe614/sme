import { motion } from 'framer-motion';
import { Card, Row, Col, Button, Typography, Progress, Empty } from 'antd';
import { 
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  ApartmentOutlined as ClassOutlined,
  ManOutlined,
  WomanOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
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

ChartJS.register(CategoryScale, LinearScale, LineElement, PointElement, ChartTitle, Tooltip, Legend, ArcElement, BarElement);

const { Text, Title } = Typography;

export default function DashboardCharts({ dashboardData, quickActions, recentActivities, stats }) {

  // Chart configurations
  const feeTrendChart = {
    labels: dashboardData.feeTrend.labels || [],
    datasets: [
      {
        label: 'Fees Collected (KSh)',
        data: dashboardData.feeTrend.data || [],
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgb(99, 102, 241)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointHoverRadius: 6,
      },
    ],
  };

  const classDistributionChart = {
    labels: dashboardData.classDistribution.labels || [],
    datasets: [
      {
        label: 'Students per Class',
        data: dashboardData.classDistribution.data || [],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: 'rgba(59, 130, 246, 1)',
      },
    ],
  };

  const genderDistributionChart = {
    labels: dashboardData.genderDistribution.labels || ['Male', 'Female', 'Other'],
    datasets: [
      {
        data: dashboardData.genderDistribution.data || [0, 0, 0],
        backgroundColor: ['#3b82f6', '#ec4899', '#a855f7'],
        borderWidth: 4,
        borderColor: '#fff',
        hoverOffset: 10,
      },
    ],
  };

  const feeBreakdownChart = {
    labels: dashboardData.feeBreakdown.labels || [],
    datasets: [
      {
        data: dashboardData.feeBreakdown.data || [],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#06b6d4',
          '#ec4899'
        ],
        borderWidth: 4,
        borderColor: '#fff',
        hoverOffset: 10,
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
        padding: 12,
        titleColor: 'white',
        bodyColor: 'white',
        cornerRadius: 8,
        displayColors: false,
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
        labels: { 
          padding: 15, 
          usePointStyle: true,
          font: { size: 12 }
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
      },
    },
    cutout: '65%',
  };

  const getActivityIcon = (type) => {
    switch(type) {
      case 'student': return <UserOutlined className="text-blue-600" />;
      case 'teacher': return <TeamOutlined className="text-green-600" />;
      case 'payment': return <DollarOutlined className="text-purple-600" />;
      default: return <FileTextOutlined className="text-gray-600" />;
    }
  };

  const getActivityColor = (type) => {
    switch(type) {
      case 'student': return 'border-l-blue-500 bg-blue-50';
      case 'teacher': return 'border-l-green-500 bg-green-50';
      case 'payment': return 'border-l-purple-500 bg-purple-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  return (
    <Row gutter={[16, 16]}>
      {/* Left Column - Charts */}
      <Col xs={24} lg={16}>
        <div className="space-y-4">
          {/* Fee Collection Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <RiseOutlined className="text-purple-600" />
                  <span>Fee Collection Trend</span>
                </div>
              }
              className="rounded-2xl shadow-md border-slate-200"
            >
              <div style={{ height: '250px' }}>
                {dashboardData.feeTrend.data.length > 0 ? (
                  <Line data={feeTrendChart} options={chartOptions} />
                ) : (
                  <Empty 
                    description="No fee collection data yet"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </div>
            </Card>
          </motion.div>

          {/* Class Distribution & Gender Distribution */}
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Card 
                  title={
                    <div className="flex items-center gap-2">
                      <ClassOutlined className="text-orange-600" />
                      <span>Class Distribution</span>
                    </div>
                  }
                  className="rounded-2xl shadow-md border-slate-200"
                >
                  <div style={{ height: '250px' }}>
                    {dashboardData.classDistribution.data.length > 0 ? (
                      <Bar data={classDistributionChart} options={chartOptions} />
                    ) : (
                      <Empty 
                        description="No classes created yet"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </div>
                </Card>
              </motion.div>
            </Col>

            <Col xs={24} lg={12}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <Card 
                  title={
                    <div className="flex items-center gap-2">
                      <UserOutlined className="text-blue-600" />
                      <span>Gender Distribution</span>
                    </div>
                  }
                  className="rounded-2xl shadow-md border-slate-200"
                >
                  <div style={{ height: '250px' }}>
                    {stats.students.total > 0 ? (
                      <Doughnut data={genderDistributionChart} options={doughnutOptions} />
                    ) : (
                      <Empty 
                        description="No student data yet"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                      />
                    )}
                  </div>
                </Card>
              </motion.div>
            </Col>
          </Row>

          {/* Fee Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <DollarOutlined className="text-green-600" />
                  <span>Fee Structure Breakdown</span>
                </div>
              }
              className="rounded-2xl shadow-md border-slate-200"
            >
              <div style={{ height: '280px' }}>
                {dashboardData.feeBreakdown.data.length > 0 ? (
                  <Doughnut data={feeBreakdownChart} options={doughnutOptions} />
                ) : (
                  <Empty 
                    description="No fee structure data"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </Col>

      {/* Right Column - Quick Actions & Activities */}
      <Col xs={24} lg={8}>
        <div className="space-y-4">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">⚡ Quick Actions</span>
                </div>
              }
              className="rounded-2xl shadow-md border-slate-200"
            >
              <div className="space-y-3">
                {quickActions.map((action, idx) => (
                  <Button
                    key={idx}
                    block
                    size="large"
                    icon={action.icon}
                    onClick={action.onClick}
                    className="text-left flex items-center justify-start hover:scale-105 hover:shadow-md transition-all rounded-xl"
                    style={{ 
                      borderColor: action.color, 
                      color: action.color,
                      borderWidth: '2px'
                    }}
                  >
                    <span className="font-medium">{action.title}</span>
                  </Button>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* School Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold">📊 School Overview</span>
                </div>
              }
              className="rounded-2xl shadow-md border-slate-200"
            >
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <Text className="text-sm font-medium">Student Capacity</Text>
                    <Text strong className="text-blue-600">{stats.students.total}/500</Text>
                  </div>
                  <Progress 
                    percent={Math.min((stats.students.total / 500) * 100, 100)} 
                    strokeColor={{
                      '0%': '#3b82f6',
                      '100%': '#8b5cf6',
                    }}
                    strokeWidth={10}
                    className="custom-progress"
                  />
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <Text className="text-sm font-medium">Student-Teacher Ratio</Text>
                    <Text strong className="text-green-600">
                      {stats.students.total > 0 && stats.teachers.total > 0 
                        ? `1:${Math.round(stats.students.total / stats.teachers.total)}`
                        : 'N/A'
                      }
                    </Text>
                  </div>
                  <Progress 
                    percent={Math.min((stats.teachers.total / 20) * 100, 100)} 
                    strokeColor="#10b981"
                    strokeWidth={10}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <ManOutlined className="text-2xl text-blue-600 mb-1" />
                    <Text strong className="block text-blue-700 text-lg">{stats.students.male}</Text>
                    <Text type="secondary" className="text-xs">Male Students</Text>
                  </div>
                  <div className="text-center p-3 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl border border-pink-200">
                    <WomanOutlined className="text-2xl text-pink-600 mb-1" />
                    <Text strong className="block text-pink-700 text-lg">{stats.students.female}</Text>
                    <Text type="secondary" className="text-xs">Female Students</Text>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <Card 
              title={
                <div className="flex items-center gap-2">
                  <ClockCircleOutlined className="text-purple-600" />
                  <span>Recent Activities</span>
                </div>
              }
              className="rounded-2xl shadow-md border-slate-200"
              extra={
                <Button type="link" size="small" className="text-purple-600">
                  View All
                </Button>
              }
            >
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {recentActivities.length > 0 ? (
                  recentActivities.map((activity, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.0 + (idx * 0.1) }}
                      className={`flex items-start space-x-3 p-3 rounded-xl border-l-4 ${getActivityColor(activity.type)} hover:shadow-md transition-all cursor-pointer`}
                    >
                      <div className="text-2xl mt-1">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Text className="block text-sm font-medium text-gray-800 truncate">
                          {activity.description}
                        </Text>
                        <Text type="secondary" className="text-xs flex items-center gap-1 mt-1">
                          <ClockCircleOutlined className="text-xs" />
                          {activity.time}
                        </Text>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <Empty 
                    description="No recent activities"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                )}
              </div>
            </Card>
          </motion.div>
        </div>
      </Col>
    </Row>
  );
}

// Add custom scrollbar styling
const style = document.createElement('style');
style.textContent = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;
document.head.appendChild(style);