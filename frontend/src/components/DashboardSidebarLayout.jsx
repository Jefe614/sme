import React, { useState, useEffect } from 'react';
import { Layout, Avatar, Badge } from 'antd';
import { BellOutlined, UserOutlined } from '@ant-design/icons';
import Sidebar from './Sidebar';

const { Content, Header } = Layout;

const PRIMARY_COLOR = '#0F172A';      // Dark navy
const SECONDARY_COLOR = '#3B82F6';    // Blue highlights
const TEXT_COLOR = '#F8FAFC';         // Light text
const BADGE_COLOR = '#EF4444';        // Red for notifications

export default function DashboardSidebarLayout({ userType, children }) { 
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
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 80 : 280),
          minHeight: '100vh',
          backgroundColor: PRIMARY_COLOR,
          color: TEXT_COLOR
        }}
      >
        {/* Header */}
        <Header
          style={{
            backgroundColor: PRIMARY_COLOR,
            borderBottom: `1px solid ${SECONDARY_COLOR}`,
            paddingLeft: '24px',
            paddingRight: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: TEXT_COLOR,
            height: '84px',
            zIndex: 10
          }}
        >
          {/* Left side: Dashboard title */}
          <h1 style={{ color: TEXT_COLOR, fontWeight: 600, fontSize: '18px' }}>
            {/* {userType === 'SME' ? 'SME Dashboard' : 'School Dashboard'} */}
          </h1>

          {/* Right side: Notifications & Profile */}
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <Badge count={5} size="small" style={{ backgroundColor: BADGE_COLOR }}>
              <BellOutlined style={{ fontSize: '20px', color: TEXT_COLOR, cursor: 'pointer' }} />
            </Badge>

            {/* Profile */}
            <div className="flex items-center gap-2">
              <Avatar style={{ backgroundColor: SECONDARY_COLOR }} icon={<UserOutlined />} size="small" />
              <span style={{ color: TEXT_COLOR, fontSize: '14px', fontWeight: 500 }}>
                Admin
              </span>
            </div>
          </div>
        </Header>

        {/* Content */}
        <Content
          style={{
            backgroundColor: '#F8FAFC',
            padding: isMobile ? '16px 16px 16px 16px' : '24px',
            minHeight: 'calc(100vh - 64px)'
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
