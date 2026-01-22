import React, { useState, useContext, useEffect } from 'react';
import { Layout, Menu, Avatar, Typography, Dropdown, Button, Drawer } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  BookOutlined,
  BellOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const ParentSidebarLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, handleLogout } = useContext(AuthContext);
  const schoolName = localStorage.getItem('schoolName') || 'School';

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const menuItems = [
    {
      key: '/parent/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/parent/students',
      icon: <TeamOutlined />,
      label: 'My Children',
    },
    {
      key: '/parent/fees',
      icon: <DollarOutlined />,
      label: 'Fees & Payments',
    },
    {
      key: '/parent/results',
      icon: <BookOutlined />,
      label: 'Exam Results',
    },
    {
      key: '/parent/attendance',
      icon: <UserOutlined />,
      label: 'Attendance',
    },
    {
      key: '/parent/announcements',
      icon: <BellOutlined />,
      label: 'Announcements',
    },
  ];

  const handleMenuClick = ({ key }) => {
    navigate(key);
    if (isMobile) {
      setMobileDrawerVisible(false);
    }
  };

  const onLogout = () => {
    handleLogout();
    navigate('/parent/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={onLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  const mobileMenu = (
    <Menu
      mode="vertical"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{ borderRight: 0 }}
    />
  );

  const desktopSider = (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={setCollapsed}
      breakpoint="lg"
      collapsedWidth={isMobile ? 0 : 80}
      style={{
        background: '#fff',
        borderRight: '1px solid #f0f0f0'
      }}
    >
      <div style={{
        padding: '16px',
        textAlign: 'center',
        borderBottom: '1px solid #f0f0f0',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {!collapsed ? (
          <div>
            <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
              Parent Portal
            </div>
            <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>
              School Management
            </div>
          </div>
        ) : (
          <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
            PP
          </div>
        )}
      </div>

      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0 }}
      />
    </Sider>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile ? desktopSider : (
        <Drawer
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <HomeOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
              <span>Parent Portal</span>
            </div>
          }
          placement="left"
          onClose={() => setMobileDrawerVisible(false)}
          open={mobileDrawerVisible}
          width={280}
          bodyStyle={{ padding: 0 }}
        >
          {mobileMenu}
        </Drawer>
      )}

      <Layout>
        <Header style={{
          background: '#fff',
          padding: '0 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px',
          position: 'sticky',
          top: 0,
          zIndex: 999
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {isMobile ? (
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setMobileDrawerVisible(true)}
                style={{ marginRight: '8px' }}
              />
            ) : (
              <Button
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
                style={{ marginRight: '16px' }}
              />
            )}
            <Text 
              strong 
              style={{ 
                fontSize: isMobile ? '14px' : '16px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: isMobile ? '150px' : '300px'
              }}
            >
              {isMobile ? schoolName : `Welcome to ${schoolName}`}
            </Text>
          </div>

          <Dropdown overlay={userMenu} trigger={['click']}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              ':hover': { background: '#f5f5f5' }
            }}>
              <Avatar
                size={isMobile ? 'small' : 'default'}
                style={{ 
                  backgroundColor: '#1890ff',
                  marginRight: isMobile ? '4px' : '8px'
                }}
                icon={<UserOutlined />}
              />
              {/* {!isMobile && (
                <div>
                  <Text strong style={{ fontSize: '14px' }}>
                    {user?.first_name} {user?.last_name}
                  </Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    Parent
                  </Text>
                </div>
              )} */}
            </div>
          </Dropdown>
        </Header>

        <Content style={{
          margin: isMobile ? '12px 8px' : '24px 16px',
          padding: isMobile ? '16px' : '24px',
          background: '#fff',
          minHeight: 'calc(100vh - 112px)',
          borderRadius: '8px'
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default ParentSidebarLayout;