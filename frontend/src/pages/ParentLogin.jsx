import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space } from 'antd';
import { LockOutlined, PhoneOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import parentApi from '../api/parentApi';
import showNotification from '../utils/notifications';

const { Title, Text } = Typography;

const ParentLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await parentApi.login(values.phone, values.password);
      const { data } = response;

      // Store parent data in localStorage
      localStorage.setItem('parentToken', JSON.stringify(data));
      localStorage.setItem('parentInfo', JSON.stringify(data.parent));
      localStorage.setItem('isParent', 'true');

      showNotification.success('Login successful', 'Welcome to the Parent Portal');
      navigate('/parent-dashboard');
    } catch (error) {
      console.error('Login error:', error);
      showNotification.error('Login failed', 'Please check your credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: 400,
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          border: 'none'
        }}
        bodyStyle={{ padding: '40px 32px' }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
              📱 Parent Portal
            </Title>
            <Text type="secondary">Access your child's information</Text>
          </div>

          <Form
            form={form}
            name="parent_login"
            onFinish={onFinish}
            size="large"
            layout="vertical"
          >
            <Form.Item
              name="phone"
              rules={[
                { required: true, message: 'Please enter your phone number!' },
                { pattern: /^\+?[\d\s\-\(\)]+$/, message: 'Please enter a valid phone number!' }
              ]}
            >
              <Input
                prefix={<PhoneOutlined />}
                placeholder="Phone number (e.g. +254700000000)"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter your password!' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Password"
                style={{ borderRadius: '8px' }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
                style={{ borderRadius: '8px', height: '48px' }}
              >
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </Form.Item>
          </Form>

          <div>
            <Text type="secondary">
              Need help? Contact the school administration
            </Text>
          </div>

          <div style={{ marginTop: '20px' }}>
            <Button
              type="link"
              onClick={() => navigate('/login')}
              style={{ padding: 0 }}
            >
              ← Back to School Login
            </Button>
          </div>
        </Space>
      </Card>

      <style jsx>{`
        @media (max-width: 768px) {
          .ant-card-body {
            padding: 24px 20px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ParentLogin;
