import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Space,
  Button,
  message,
  Spin,
  Tabs,
  Statistic,
  Progress,
} from 'antd';
import {
  DollarOutlined,
  UserOutlined,
  FileTextOutlined,
  PlusOutlined,
  EyeOutlined,
  SettingOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getFeeReports, getFeeStructures, getFeePayments } from '../../api/auth';

const { Title } = Typography;
const { TabPane } = Tabs;

export default function FeeManagement() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [feeReports, setFeeReports] = useState(null);
  const [recentStructures, setRecentStructures] = useState([]);
  const [recentPayments, setRecentPayments] = useState([]);

  useEffect(() => {
    fetchFeeOverview();
  }, []);

  const fetchFeeOverview = async () => {
    setLoading(true);
    try {
      // Fetch fee reports
      const reportsResponse = await getFeeReports();
      setFeeReports(reportsResponse.data);

      // Fetch recent fee structures
      const structuresResponse = await getFeeStructures({
        pageSize: 5,
        current: 1
      });
      setRecentStructures(structuresResponse.data.data || []);

      // Fetch recent payments
      const paymentsResponse = await getFeePayments({
        pageSize: 5,
        current: 1
      });
      setRecentPayments(paymentsResponse.data.data || []);

    } catch (error) {
      message.error('Failed to load fee overview data');
    } finally {
      setLoading(false);
    }
  };

  const quickStats = feeReports?.summary || {};

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <Title level={2} className="!mb-1 !text-2xl sm:!text-3xl text-gray-900 dark:text-gray-100">
            Fee Management
          </Title>
          <p className="text-gray-600 dark:text-gray-400">Comprehensive fee structure and payment management system</p>
        </div>
      </div>

      <Spin spinning={loading}>
        {/* Quick Action Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              className="text-center cursor-pointer bg-white dark:bg-gray-800"
              onClick={() => navigate('/school-dashboard/fees/structures')}
            >
              <DollarOutlined style={{ fontSize: '32px', color: '#1890ff', marginBottom: '12px' }} />
              <Title level={4} className="!mb-1 text-gray-900 dark:text-gray-100">Fee Structures</Title>
              <p className="text-gray-600 dark:text-gray-400">Create and manage fee categories</p>
              <Button type="link" icon={<EyeOutlined />}>View Structures</Button>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              className="text-center cursor-pointer bg-white dark:bg-gray-800"
              onClick={() => navigate('/school-dashboard/fees/payments')}
            >
              <FileTextOutlined style={{ fontSize: '32px', color: '#52c41a', marginBottom: '12px' }} />
              <Title level={4} className="!mb-1 text-gray-900 dark:text-gray-100">Record Payments</Title>
              <p className="text-gray-600 dark:text-gray-400">Process student fee payments</p>
              <Button type="link" icon={<PlusOutlined />}>Record Payment</Button>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              className="text-center cursor-pointer bg-white dark:bg-gray-800"
              onClick={() => navigate('/school-dashboard/fees/discounts')}
            >
              <UserOutlined style={{ fontSize: '32px', color: '#faad14', marginBottom: '12px' }} />
              <Title level={4} className="!mb-1 text-gray-900 dark:text-gray-100">Fee Discounts</Title>
              <p className="text-gray-600 dark:text-gray-400">Manage bursaries and discounts</p>
              <Button type="link" icon={<SettingOutlined />}>Manage Discounts</Button>
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card
              hoverable
              className="text-center cursor-pointer bg-white dark:bg-gray-800"
              onClick={() => navigate('/school-dashboard/fees/reports')}
            >
              <BarChartOutlined style={{ fontSize: '32px', color: '#722ed1', marginBottom: '12px' }} />
              <Title level={4} className="!mb-1 text-gray-900 dark:text-gray-100">Fee Reports</Title>
              <p className="text-gray-600 dark:text-gray-400">View payment histories and analytics</p>
              <Button type="link" icon={<BarChartOutlined />}>View Reports</Button>
            </Card>
          </Col>
        </Row>

        {/* Statistics Row */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Collected"
                value={quickStats.total_collected || 0}
                precision={0}
                valueStyle={{ color: '#3f8600' }}
                prefix="KES"
                suffix=""
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Total Payments"
                value={quickStats.total_payments || 0}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Outstanding Balance"
                value={quickStats.outstanding_balance || 0}
                precision={0}
                valueStyle={{ color: '#cf1322' }}
                prefix="KES"
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Fee Structures"
                value={recentStructures.filter(s => s.is_active).length}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Recent Activity Tabs */}
        <Card>
          <Tabs defaultActiveKey="structures" size="large">
            <TabPane tab="Recent Fee Structures" key="structures">
              <div className="space-y-3">
                {recentStructures.length > 0 ? (
                  recentStructures.map((structure) => (
                    <Card key={structure.id} size="small" className="hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                      <Row align="middle" justify="space-between">
                        <Col>
                          <Space direction="vertical" size={2}>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{structure.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              {structure.fee_type} - {structure.academic_year} {structure.term}
                            </div>
                          </Space>
                        </Col>
                        <Col>
                          <Space>
                            <div className="text-right">
                              <div className="font-bold text-green-600 dark:text-green-400">
                                KES {structure.amount?.toLocaleString() || '0'}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                                {structure.fee_type.replace('_', ' ')}
                              </div>
                            </div>
                          </Space>
                        </Col>
                      </Row>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No fee structures found. <Button type="link" onClick={() => navigate('/school-dashboard/fees/structures')}>Create your first fee structure</Button>
                  </div>
                )}
                {recentStructures.length > 0 && (
                  <div className="text-center mt-4">
                    <Button onClick={() => navigate('/school-dashboard/fees/structures')}>
                      View All Structures
                    </Button>
                  </div>
                )}
              </div>
            </TabPane>

            <TabPane tab="Recent Payments" key="payments">
              <div className="space-y-3">
                {recentPayments.length > 0 ? (
                  recentPayments.map((payment) => (
                    <Card key={payment.id} size="small" className="hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
                      <Row align="middle" justify="space-between">
                        <Col>
                          <Space direction="vertical" size={2}>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{payment.student_name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">
                              Receipt: {payment.receipt_number} • {payment.payment_date}
                            </div>
                          </Space>
                        </Col>
                        <Col>
                          <Space direction="vertical" align="end" size={2}>
                            <div className="font-bold text-green-600 dark:text-green-400">
                              KES {payment.amount_paid?.toLocaleString() || '0'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                              {payment.payment_method.replace('_', ' ')}
                            </div>
                          </Space>
                        </Col>
                      </Row>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No payment records found. <Button type="link" onClick={() => navigate('/school-dashboard/fees/payments')}>Record a payment</Button>
                  </div>
                )}
                {recentPayments.length > 0 && (
                  <div className="text-center mt-4">
                    <Button onClick={() => navigate('/school-dashboard/fees/payments')}>
                      View All Payments
                    </Button>
                  </div>
                )}
              </div>
            </TabPane>
          </Tabs>
        </Card>
      </Spin>
    </div>
  );
}
