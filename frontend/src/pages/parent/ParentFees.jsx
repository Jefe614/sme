import React, { useState, useEffect } from 'react';
import {
  Card, Row, Col, Typography, Table, Tag, Statistic,
  Skeleton, Alert, Divider, List, Grid
} from 'antd';
import {
  DollarOutlined, CreditCardOutlined, CalendarOutlined,
  CheckCircleOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { parentApi } from '../../api/parentApi';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ParentFees = () => {
  const [feesData, setFeesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const screens = useBreakpoint();

  useEffect(() => {
    fetchFeesData();
  }, []);

  const fetchFeesData = async () => {
    try {
      setLoading(true);
      const response = await parentApi.getFees();
      setFeesData(response.data);
    } catch (error) {
      setError('Failed to load fees data');
      console.error('Fees error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (balance) => {
    if (balance <= 0) return 'success';
    if (balance < 1000) return 'warning';
    return 'error';
  };

  const isMobile = !screens.md;

  // Mobile responsive columns
  const mobileColumns = [
    {
      title: 'Student',
      dataIndex: 'student_name',
      key: 'student_name',
      render: (text) => <Text strong style={{ fontSize: '12px' }}>{text}</Text>,
      width: 100,
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance) => (
        <Tag 
          color={getStatusColor(balance)} 
          style={{ fontSize: '11px', padding: '2px 6px' }}
        >
          KES {Math.abs(balance)?.toLocaleString() || 0}
        </Tag>
      ),
      width: 100,
    },
    {
      title: 'Paid',
      dataIndex: 'amount_paid',
      key: 'amount_paid',
      render: (amount) => (
        <Text style={{ fontSize: '11px' }}>
          KES {amount?.toLocaleString() || 0}
        </Text>
      ),
      width: 80,
    },
  ];

  const desktopColumns = [
    {
      title: 'Student',
      dataIndex: 'student_name',
      key: 'student_name',
      render: (text) => <Text strong>{text}</Text>,
      fixed: isMobile ? 'left' : false,
    },
    {
      title: 'Fee Type',
      dataIndex: 'fee_structure_name',
      key: 'fee_structure_name',
    },
    {
      title: 'Amount Paid',
      dataIndex: 'amount_paid',
      key: 'amount_paid',
      render: (amount) => `KES ${amount?.toLocaleString() || 0}`,
    },
    {
      title: 'Amount Due',
      dataIndex: 'amount_due',
      key: 'amount_due',
      render: (amount) => `KES ${amount?.toLocaleString() || 0}`,
    },
    {
      title: 'Balance',
      dataIndex: 'balance',
      key: 'balance',
      render: (balance) => (
        <Tag color={getStatusColor(balance)}>
          KES {Math.abs(balance)?.toLocaleString() || 0}
        </Tag>
      ),
    },
    {
      title: 'Payment Date',
      dataIndex: 'payment_date_display',
      key: 'payment_date_display',
    },
    {
      title: 'Method',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method) => (
        <Tag icon={<CreditCardOutlined />} style={{ fontSize: '11px' }}>
          {method?.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Receipt',
      dataIndex: 'receipt_number',
      key: 'receipt_number',
      render: (receipt) => receipt ? (
        <Text code style={{ fontSize: '11px' }}>{receipt}</Text>
      ) : (
        <Text type="secondary" style={{ fontSize: '11px' }}>-</Text>
      ),
    },
  ];

  // Calculate summary statistics
  const totalPaid = feesData.reduce((sum, item) => sum + (item.amount_paid || 0), 0);
  const totalDue = feesData.reduce((sum, item) => sum + (item.amount_due || 0), 0);
  const totalBalance = feesData.reduce((sum, item) => sum + (item.balance || 0), 0);

  // Group fees by student
  const feesByStudent = feesData.reduce((acc, fee) => {
    if (!acc[fee.student_name]) {
      acc[fee.student_name] = [];
    }
    acc[fee.student_name].push(fee);
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{ padding: isMobile ? '12px' : '20px' }}>
        <Skeleton active paragraph={{ rows: 2 }} />
        <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
          {[1, 2, 3].map(i => (
            <Col key={i} xs={24} sm={12} md={8}>
              <Card>
                <Skeleton active />
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
        <DollarOutlined style={{ marginRight: '8px' }} />
        Fees & Payments
      </Title>

      {/* Summary Statistics */}
      <Row gutter={[16, 16]} style={{ marginBottom: isMobile ? '20px' : '30px' }}>
        <Col xs={24} sm={12} md={8}>
          <Card size={isMobile ? "small" : "default"}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? '12px' : '14px' }}>Total Paid</span>}
              value={totalPaid}
              prefix="KES"
              valueStyle={{ 
                color: '#52c41a',
                fontSize: isMobile ? '16px' : '20px'
              }}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card size={isMobile ? "small" : "default"}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? '12px' : '14px' }}>Total Due</span>}
              value={totalDue}
              prefix="KES"
              valueStyle={{ 
                color: '#1890ff',
                fontSize: isMobile ? '16px' : '20px'
              }}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <Card size={isMobile ? "small" : "default"}>
            <Statistic
              title={<span style={{ fontSize: isMobile ? '12px' : '14px' }}>Outstanding Balance</span>}
              value={totalBalance}
              prefix="KES"
              valueStyle={{ 
                color: totalBalance > 0 ? '#ff4d4f' : '#52c41a',
                fontSize: isMobile ? '16px' : '20px'
              }}
              precision={2}
            />
          </Card>
        </Col>
      </Row>

      {/* Student-wise Fee Summary */}
      <Row gutter={[16, 16]} style={{ marginBottom: '20px' }}>
        {Object.entries(feesByStudent).map(([studentName, fees]) => {
          const studentTotalPaid = fees.reduce((sum, fee) => sum + (fee.amount_paid || 0), 0);
          const studentTotalDue = fees.reduce((sum, fee) => sum + (fee.amount_due || 0), 0);
          const studentBalance = fees.reduce((sum, fee) => sum + (fee.balance || 0), 0);

          return (
            <Col key={studentName} xs={24} sm={24} md={12} lg={12}>
              <Card
                size="small"
                title={
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <CheckCircleOutlined style={{ 
                      marginRight: '8px', 
                      color: '#52c41a',
                      fontSize: isMobile ? '12px' : '14px'
                    }} />
                    <Text strong style={{ fontSize: isMobile ? '14px' : '16px' }}>
                      {studentName}
                    </Text>
                  </div>
                }
              >
                <Row gutter={[8, 8]}>
                  <Col xs={8}>
                    <Statistic
                      title="Paid"
                      value={studentTotalPaid}
                      prefix="KES"
                      valueStyle={{ fontSize: isMobile ? '12px' : '14px' }}
                      precision={0}
                    />
                  </Col>
                  <Col xs={8}>
                    <Statistic
                      title="Due"
                      value={studentTotalDue}
                      prefix="KES"
                      valueStyle={{ fontSize: isMobile ? '12px' : '14px' }}
                      precision={0}
                    />
                  </Col>
                  <Col xs={8}>
                    <Statistic
                      title="Balance"
                      value={studentBalance}
                      prefix="KES"
                      valueStyle={{
                        fontSize: isMobile ? '12px' : '14px',
                        color: getStatusColor(studentBalance) === 'error' ? '#ff4d4f' : 
                               getStatusColor(studentBalance) === 'warning' ? '#faad14' : '#52c41a'
                      }}
                      precision={0}
                    />
                  </Col>
                </Row>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Divider />

      {/* Detailed Payment History */}
      <Card 
        title={<span style={{ fontSize: isMobile ? '16px' : '18px' }}>Payment History</span>} 
        style={{ marginTop: '16px' }}
        size={isMobile ? "small" : "default"}
      >
        <Table
          columns={isMobile ? mobileColumns : desktopColumns}
          dataSource={feesData}
          rowKey="id"
          pagination={{
            pageSize: isMobile ? 5 : 10,
            showSizeChanger: !isMobile,
            showQuickJumper: !isMobile,
            showTotal: !isMobile ? (total, range) =>
              `${range[0]}-${range[1]} of ${total} payments` : null,
            simple: isMobile,
            size: isMobile ? "small" : "default"
          }}
          scroll={{ x: isMobile ? 300 : 800 }}
          size={isMobile ? "small" : "middle"}
        />
      </Card>
    </div>
  );
};

export default ParentFees;