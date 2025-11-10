import { motion } from 'framer-motion';
import { Row, Col, Typography, Card } from 'antd';
import { 
  UserOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
  ApartmentOutlined as ClassOutlined,
  HomeOutlined,
  ApartmentOutlined,
  TrophyOutlined,
  BookOutlined
} from '@ant-design/icons';

const { Text } = Typography;

export default function DashboardStats({ stats, navigate }) {
  if (!stats) return <div>Loading...</div>;

  const statCards = [
    {
      key: 'students',
      title: 'Total Students',
      value: stats?.students?.total || 0,
      icon: <UserOutlined className="text-blue-600" />,
      bgColor: 'bg-blue-100',
      change: stats?.students?.change || 0,
      extra: (
        <div className="mt-2 text-gray-700 text-sm flex items-center justify-center gap-2">
          <ApartmentOutlined /> {stats?.students?.boarding || 0} Boarding
          <span className="opacity-70">•</span>
          <HomeOutlined /> {stats?.students?.day || 0} Day
        </div>
      ),
      onClick: () => navigate('/school-dashboard/students'),
      delay: 0.1
    },
    {
      key: 'teachers',
      title: 'Teaching Staff',
      value: stats?.teachers?.total || 0,
      icon: <TeamOutlined className="text-green-600" />,
      bgColor: 'bg-green-100',
      change: stats?.teachers?.change || 0,
      subtitle: `1:${stats?.students?.total && stats?.teachers?.total ? Math.round(stats.students.total / stats.teachers.total) : 0} ratio`,
      onClick: () => navigate('/school-dashboard/teachers'),
      delay: 0.2
    },
    {
      key: 'staff',
      title: 'Total Staff',
      value: stats?.staff?.total || 0,
      icon: <UsergroupAddOutlined className="text-purple-600" />,
      bgColor: 'bg-purple-100',
      change: stats?.staff?.change || 0,
      subtitle: `${stats?.staff?.by_type?.labels?.length || 0} departments`,
      onClick: () => navigate('/school-dashboard/staff'),
      delay: 0.3
    },
    {
      key: 'classes',
      title: 'Active Classes',
      value: stats?.classes?.total || 0,
      icon: <ClassOutlined className="text-orange-600" />,
      bgColor: 'bg-orange-100',
      change: stats?.classes?.change || 0,
      subtitle: stats?.classes?.total > 0 ? `Avg ${Math.round(stats.students.total / stats.classes.total)} students/class` : 'No classes yet',
      onClick: () => navigate('/school-dashboard/classes'),
      delay: 0.4
    }
  ];

  const formatCurrency = (amount) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
    return amount.toString();
  };

  const performanceCards = [
    {
      title: 'Fees Collected',
      value: `KSh ${formatCurrency(stats?.feesCollected?.total || 0)}`,
      icon: <BookOutlined />,
      color: '#10b981',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      change: stats?.feesCollected?.change || 0,
      subtitle: 'This term',
      delay: 0.5
    },
    {
      title: 'Pending Fees',
      value: `KSh ${formatCurrency(stats?.pendingFees?.total || 0)}`,
      icon: <TrophyOutlined />,
      color: stats?.pendingFees?.total > 500000 ? '#ef4444' : stats?.pendingFees?.total > 100000 ? '#f59e0b' : '#10b981',
      bgColor: stats?.pendingFees?.total > 500000 ? 'bg-red-50' : stats?.pendingFees?.total > 100000 ? 'bg-orange-50' : 'bg-green-50',
      borderColor: stats?.pendingFees?.total > 500000 ? 'border-red-200' : stats?.pendingFees?.total > 100000 ? 'border-orange-200' : 'border-green-200',
      change: stats?.pendingFees?.change || 0,
      subtitle: 'Outstanding',
      delay: 0.6
    }
  ];

  return (
    <>
      {/* Main Stats Grid - Tailwind only */}
      <Row gutter={[16, 16]}>
        {statCards.map((card) => (
          <Col xs={24} sm={12} lg={6} key={card.key}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: card.delay }}
              whileHover={{ scale: 1.02 }}
            >
              <div
                onClick={card.onClick}
                className={`${card.bgColor} cursor-pointer rounded-2xl p-6 flex flex-col items-center shadow-md hover:shadow-lg transition-all`}
              >
                <div className="text-4xl mb-2">{card.icon}</div>
                <div className="text-3xl font-bold">{card.value}</div>
                <div className="mt-2 text-gray-700 text-sm">{card.title}</div>
                {card.subtitle && <div className="mt-1 text-gray-600 text-xs">{card.subtitle}</div>}
                {card.extra && <div className="mt-2">{card.extra}</div>}
                {card.change !== 0 && (
                  <div className={`mt-2 text-sm font-medium ${card.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {card.change > 0 ? '↑' : '↓'} {Math.abs(card.change)}% from last month
                  </div>
                )}
              </div>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* Performance Cards - Ant Design */}
      <Row gutter={[16, 16]} className="mt-4">
        {performanceCards.map((card, index) => (
          <Col xs={24} sm={12} lg={12} key={index}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: card.delay }}
              whileHover={{ scale: 1.02, y: -4 }}
            >
              <Card 
                className={`${card.bgColor} border-2 ${card.borderColor} shadow-md hover:shadow-xl transition-all rounded-2xl h-full`}
                bodyStyle={{ padding: '24px' }}
              >
                <div className="flex items-center gap-4">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg transform transition-transform hover:scale-110"
                    style={{ backgroundColor: card.color + '20', color: card.color }}
                  >
                    {card.icon}
                  </div>
                  <div className="flex-1">
                    <Text className="text-sm text-gray-500 block mb-1 font-medium">{card.title}</Text>
                    <div className="text-3xl font-bold" style={{ color: card.color }}>{card.value}</div>
                    {card.subtitle && <Text className="text-xs text-gray-500 block mt-1">{card.subtitle}</Text>}
                  </div>
                  {card.change !== 0 && (
                    <div className={`text-center px-4 py-3 rounded-xl shadow-sm ${card.change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      <div className="text-2xl font-bold">{card.change > 0 ? '+' : ''}{card.change}%</div>
                      <div className="text-xs opacity-80 whitespace-nowrap">vs last month</div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>
    </>
  );
}
