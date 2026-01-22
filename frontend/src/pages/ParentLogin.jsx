import React, { useState } from 'react';
import { 
  Form, Input, Button, Card, Typography, message, Space, Steps, Divider, Alert, Grid 
} from 'antd';
import { PhoneOutlined, LockOutlined, CheckCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { parentApi } from '../api/parentApi';

const { Title, Text } = Typography;
const { Step } = Steps;
const { useBreakpoint } = Grid;

const ParentLogin = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [schema, setSchema] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const screens = useBreakpoint();

  const isMobile = !screens.md;

  const handleSendOTP = async () => {
    if (!phoneNumber || !schema) {
      setErrorMessage('Please enter phone number and school code');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    try {
      await parentApi.sendOTP(phoneNumber, schema);
      message.success('OTP sent successfully to your phone!');
      setCurrentStep(1);
      setErrorMessage('');
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to send OTP';
      setErrorMessage(errorMsg);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode) {
      message.error('Please enter OTP code');
      return;
    }

    setLoading(true);
    try {
      const response = await parentApi.verifyOTP(phoneNumber, otpCode, schema);
      message.success('Login successful!');

      const { token, parent, school_name } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify({ ...parent, userType: 'parent' }));
      localStorage.setItem('tenantSchema', schema);
      localStorage.setItem('schoolName', school_name || 'School');

      window.location.href = '/parent/dashboard';
    } catch (error) {
      message.error(error.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: 'Details',
      content: (
        <Form layout="vertical">
          <Form.Item label="School Code" required>
            <Input
              placeholder="Enter school code"
              value={schema}
              onChange={(e) => setSchema(e.target.value)}
              size={isMobile ? "middle" : "large"}
            />
          </Form.Item>
          <Form.Item label="Phone Number" required>
            <Input
              prefix={<PhoneOutlined />}
              placeholder="Enter your phone number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              size={isMobile ? "middle" : "large"}
            />
          </Form.Item>
          <Button
            type="primary"
            size={isMobile ? "middle" : "large"}
            block
            loading={loading}
            onClick={handleSendOTP}
          >
            Send OTP
          </Button>
        </Form>
      ),
    },
    {
      title: 'Verify',
      content: (
        <Form layout="vertical">
          <Form.Item label="Enter 6-digit OTP" required>
            <Input
              prefix={<LockOutlined />}
              placeholder="Enter OTP code"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              size={isMobile ? "middle" : "large"}
              maxLength={6}
            />
          </Form.Item>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button
              type="primary"
              size={isMobile ? "middle" : "large"}
              block
              loading={loading}
              onClick={handleVerifyOTP}
            >
              Verify & Login
            </Button>
            <Button
              type="link"
              block
              onClick={() => setCurrentStep(0)}
              style={{ fontSize: isMobile ? '12px' : '14px' }}
            >
              Change Phone Number
            </Button>
          </Space>
        </Form>
      ),
    },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: isMobile ? '16px' : '20px'
    }}>
      <Card
        style={{
          width: '100%',
          maxWidth: isMobile ? '100%' : '400px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
          borderRadius: '8px'
        }}
        bodyStyle={{ padding: isMobile ? '20px' : '24px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title 
            level={isMobile ? 3 : 2} 
            style={{ 
              margin: 0, 
              color: '#1890ff',
              fontSize: isMobile ? '20px' : '24px'
            }}
          >
            Parent Portal
          </Title>
          <Text type="secondary" style={{ fontSize: isMobile ? '12px' : '14px' }}>
            Access your child's school information
          </Text>
        </div>

        <Steps 
          current={currentStep} 
          size={isMobile ? "small" : "small"}
          style={{ marginBottom: '20px' }}
        >
          {steps.map((step, index) => (
            <Step 
              key={index} 
              title={isMobile ? '' : step.title}
              icon={isMobile && index === currentStep ? <CheckCircleOutlined /> : null}
            />
          ))}
        </Steps>

        {errorMessage && (
          <Alert
            message="Authentication Error"
            description={errorMessage}
            type="error"
            showIcon
            icon={<ExclamationCircleOutlined />}
            style={{ marginBottom: '16px' }}
            closable
            onClose={() => setErrorMessage('')}
            size="small"
          />
        )}

        <div style={{ marginBottom: '20px' }}>
          {steps[currentStep].content}
        </div>

        <Divider />

        <div style={{ textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: isMobile ? '11px' : '13px' }}>
            Enter your registered phone number to receive a one-time password
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default ParentLogin;