import React, { useState, useEffect } from 'react';
import { Layout } from 'antd';
import Sidebar from './Sidebar';

const { Content } = Layout;

export default function DashboardSidebarLayout({ userType, children }) { 
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
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
      <Sidebar 
        userType={userType} 
        onCollapse={handleSidebarCollapse} 
      />
      
      <Layout
        className="transition-all duration-300 bg-gray-50"
        style={{
          marginLeft: isMobile ? 0 : (sidebarCollapsed ? 80 : 280),
          minHeight: '100vh'
        }}
      >
        <Content>
          <div className={`p-6 ${isMobile ? 'pt-20' : ''}`}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}