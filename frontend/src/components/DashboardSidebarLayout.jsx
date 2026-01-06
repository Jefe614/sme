import React, { useState, useEffect, useContext } from 'react';
import { Layout, Avatar, Badge, Typography } from 'antd';
import { BellOutlined, UserOutlined, ApartmentOutlined as ClassOutlined } from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';
import Sidebar from './Sidebar';

const { Content, Header } = Layout;
const { Text } = Typography;

const PRIMARY_COLOR = '#1E293B';      // Dark slate
const SECONDARY_COLOR = '#3B82F6';    // Blue highlights
const TEXT_COLOR = '#F8FAFC';         // Light text
const BADGE_COLOR = '#EF4444';        // Red for notifications

export default function DashboardSidebarLayout({ userType, children }) {
  const { user } = useContext(AuthContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setSidebarCollapsed(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSidebarCollapse = (collapsed) => {
    setSidebarCollapsed(collapsed);
  };

  return (
    <Layout className="min-h-screen">
      {/* Sidebar */}
      <Sidebar
        userType={userType}
        onCollapse={handleSidebarCollapse}
      />

      {/* Main Content */}
      <Layout
        className="transition-all duration-300"
        style={{
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 60 : 200),
          minHeight: '100vh',
          backgroundColor: PRIMARY_COLOR,
          color: TEXT_COLOR
        }}
      >
        <Header
          style={{
            backgroundColor: PRIMARY_COLOR,
            borderBottom: `1px solid ${SECONDARY_COLOR}`,
            paddingLeft: '20px',
            paddingRight: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: TEXT_COLOR,
            height: '60px',
            zIndex: 10
          }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <ClassOutlined className="text-white text-base" />
            </div>
            <div>
              <Text style={{ color: TEXT_COLOR, fontSize: '11px', opacity: 0.8 }}>
                Welcome back, <span style={{ fontWeight: 500 }}>{user?.username || 'Administrator'}</span>
              </Text>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge count={5} size="small" style={{ backgroundColor: BADGE_COLOR }}>
              <BellOutlined style={{ fontSize: '18px', color: TEXT_COLOR, cursor: 'pointer' }} />
            </Badge>

            <div className="flex items-center gap-2">
              <Avatar style={{ backgroundColor: SECONDARY_COLOR }} icon={<UserOutlined />} size="small" />
              <span style={{ color: TEXT_COLOR, fontSize: '13px', fontWeight: 500 }}>
                {user?.username || 'Admin'}
              </span>
            </div>
          </div>
        </Header>

        <Content
          style={{
            backgroundColor: '#F8FAFC',
            padding: isMobile ? '16px 16px 16px 16px' : '24px',
            minHeight: 'calc(100vh - 60px)'
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
