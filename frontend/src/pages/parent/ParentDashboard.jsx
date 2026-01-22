import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Typography, Avatar, Badge,
  Skeleton, Alert, Divider, Grid, Collapse
} from 'antd';
import {
  DollarOutlined, UserOutlined, BookOutlined,
  BellOutlined, TrophyOutlined, TeamOutlined
} from '@ant-design/icons';
import { parentApi } from '../../api/parentApi';
import StudentCharts from '../../components/StudentCharts';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ParentDashboard = () => {
  const [dashboardData, setDashboardData] = useState([]);
  const [schoolName, setSchoolName] = useState('School');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const screens = useBreakpoint();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await parentApi.getDashboard();
      setDashboardData(response.data.students || []);
      setSchoolName(response.data.school_name || 'School');
    } catch (error) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 90) return '#52c41a';
    if (percentage >= 75) return '#faad14';
    return '#ff4d4f';
  };

  const getFeeStatusColor = (balance) => {
    if (balance <= 0) return '#52c41a';
    if (balance < 1000) return '#faad14';
    return '#ff4d4f';
  };

  const isMobile = !screens.md;

  if (loading) {
    return (
      <div style={{ padding: isMobile ? '12px' : '20px' }}>
        <Skeleton active paragraph={{ rows: 2 }} />
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          {[1, 2, 3].map(i => (
            <Col key={i} xs={24} sm={12} md={8}>
              <Card>
                <Skeleton active paragraph={{ rows: 2 }} />
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: isMobile ? '12px' : '20px' }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
        />
      </div>
    );
  }

  return (
    <div style={{ padding: isMobile ? '8px' : '20px' }}>
      <Title 
        level={isMobile ? 4 : 2} 
        style={{ 
          marginBottom: isMobile ? '16px' : '30px',
          fontSize: isMobile ? '18px' : '24px'
        }}
      >
        <TeamOutlined style={{ marginRight: '8px' }} />
        {isMobile ? 'Parent Portal' : `Welcome to ${schoolName} Parent Portal`}
      </Title>

      {dashboardData.length === 0 ? (
        <Card style={{ borderRadius: '8px' }}>
          <Text type="secondary">No student data available</Text>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {dashboardData.map((student, index) => (
            <Col key={index} xs={24} sm={24} md={12} lg={8} xl={8}>
              <Card
                size={isMobile ? "small" : "default"}
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      size={isMobile ? "small" : "default"}
                      style={{ backgroundColor: '#1890ff', marginRight: '8px' }}
                      icon={<UserOutlined />}
                    />
                    <div style={{ overflow: 'hidden' }}>
                      <Text 
                        strong 
                        style={{ 
                          fontSize: isMobile ? '14px' : '16px',
                          display: 'block'
                        }}
                      >
                        {student.student_name}
                      </Text>
                      <Text 
                        type="secondary" 
                        style={{ 
                          fontSize: isMobile ? '11px' : '12px',
                          display: 'block'
                        }}
                      >
                        {student.class_name} • {student.admission_number}
                      </Text>
                    </div>
                  </div>
                }
                style={{ 
                  height: '100%',
                  borderRadius: '8px'
                }}
              >
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title={<span style={{ fontSize: isMobile ? '12px' : '14px' }}>Fee Balance</span>}
                      value={student.fee_balance}
                      prefix="KES"
                      valueStyle={{ 
                        color: getFeeStatusColor(student.fee_balance),
                        fontSize: isMobile ? '14px' : '16px'
                      }}
                      precision={2}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={<span style={{ fontSize: isMobile ? '12px' : '14px' }}>Attendance</span>}
                      value={student.attendance_percentage}
                      suffix="%"
                      valueStyle={{ 
                        color: getAttendanceColor(student.attendance_percentage),
                        fontSize: isMobile ? '14px' : '16px'
                      }}
                      precision={1}
                    />
                  </Col>
                </Row>

                <Divider style={{ margin: isMobile ? '8px 0' : '16px 0' }} />

                {student.latest_exam_result && (
                  <div style={{ marginBottom: '12px' }}>
                    <Text 
                      strong 
                      style={{ 
                        fontSize: isMobile ? '12px' : '14px', 
                        color: '#1890ff',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <TrophyOutlined style={{ marginRight: '4px', fontSize: isMobile ? '12px' : '14px' }} />
                      Latest Result
                    </Text>
                    <div style={{ marginTop: '4px' }}>
                      <Text style={{ fontSize: isMobile ? '11px' : '13px' }}>
                        {student.latest_exam_result.exam_name}
                      </Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: isMobile ? '10px' : '12px' }}>
                        {student.latest_exam_result.subject}
                      </Text>
                      <br />
                      <Badge
                        size={isMobile ? "small" : "default"}
                        status={student.latest_exam_result.grade === 'A' ? 'success' : 'default'}
                        text={
                          <span style={{ fontSize: isMobile ? '11px' : '13px' }}>
                            {student.latest_exam_result.marks} marks - Grade {student.latest_exam_result.grade}
                          </span>
                        }
                      />
                    </div>
                  </div>
                )}

                {student.latest_announcement && (
                  <div>
                    <Text 
                      strong 
                      style={{ 
                        fontSize: isMobile ? '12px' : '14px', 
                        color: '#faad14',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <BellOutlined style={{ marginRight: '4px', fontSize: isMobile ? '12px' : '14px' }} />
                      Latest Announcement
                    </Text>
                    <div style={{ marginTop: '4px' }}>
                      <Text style={{ 
                        fontSize: isMobile ? '11px' : '12px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {student.latest_announcement}
                      </Text>
                    </div>
                  </div>
                )}
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Divider />

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card size={isMobile ? "small" : "default"}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? '12px' : '14px' }}>Total Students</span>}
              value={dashboardData.length}
              prefix={<TeamOutlined style={{ fontSize: isMobile ? '14px' : '16px' }} />}
              valueStyle={{
                color: '#1890ff',
                fontSize: isMobile ? '16px' : '20px'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size={isMobile ? "small" : "default"}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? '12px' : '14px' }}>Average Attendance</span>}
              value={
                dashboardData.length > 0
                  ? (dashboardData.reduce((sum, student) => sum + student.attendance_percentage, 0) / dashboardData.length).toFixed(1)
                  : 0
              }
              suffix="%"
              prefix={<BookOutlined style={{ fontSize: isMobile ? '14px' : '16px' }} />}
              valueStyle={{
                color: '#52c41a',
                fontSize: isMobile ? '16px' : '20px'
              }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size={isMobile ? "small" : "default"}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? '12px' : '14px' }}>Total Fee Balance</span>}
              value={dashboardData.reduce((sum, student) => sum + student.fee_balance, 0)}
              prefix={<DollarOutlined style={{ fontSize: isMobile ? '14px' : '16px' }} />}
              valueStyle={{
                color: dashboardData.reduce((sum, student) => sum + student.fee_balance, 0) > 0 ? '#ff4d4f' : '#52c41a',
                fontSize: isMobile ? '16px' : '20px'
              }}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* Detailed Charts Section */}
      {dashboardData.length > 0 && (
        <Collapse
          style={{ marginTop: '24px' }}
          size="large"
          items={dashboardData.map((student, index) => ({
            key: index,
            label: (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  size="small"
                  style={{ backgroundColor: '#1890ff', marginRight: '8px' }}
                  icon={<UserOutlined />}
                />
                <Text strong>{student.student_name} - Performance & Attendance Charts</Text>
              </div>
            ),
            children: (
              <StudentCharts
                performanceData={student.performance_data || []}
                attendanceData={student.attendance_data || []}
                studentName={student.student_name}
              />
            )
          }))}
        />
      )}
    </div>
  );
};

export default ParentDashboard;
