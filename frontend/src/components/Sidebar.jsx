import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Typography, Badge, Drawer, Button } from 'antd';
import { 
  HomeOutlined,
  DollarOutlined,
  TeamOutlined,
  SolutionOutlined,
  MoneyCollectOutlined,
  CarOutlined,
  CalendarOutlined,
  UserOutlined,
  BarChartOutlined,
  FileTextOutlined,
  BellOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BookOutlined,
  UsergroupAddOutlined
} from '@ant-design/icons';

const { Sider } = Layout;
const { Text } = Typography;

export default function Sidebar({ userType, onCollapse }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setCollapsed(true);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const smeMenuItems = [
    {
      key: '/sme-dashboard',
      icon: <HomeOutlined />,
      label: 'Dashboard',
      path: '/sme-dashboard'
    },
    {
      key: '/sme-dashboard/cashflow',
      icon: <DollarOutlined />,
      label: 'Cash Flow',
      path: '/sme-dashboard/cashflow'
    },
    {
      key: '/sme-dashboard/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
      path: '/sme-dashboard/analytics'
    },
    {
      key: '/sme-dashboard/reports',
      icon: <FileTextOutlined />,
      label: 'Reports',
      path: '/sme-dashboard/reports'
    },
    {
      key: '/sme-dashboard/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      path: '/sme-dashboard/settings'
    }
  ];

  const schoolMenuItems = [
    {
      key: '/school-dashboard',
      icon: <HomeOutlined />,
      label: 'Dashboard',
      path: '/school-dashboard'
    },
    {
      key: '/school-dashboard/students',
      icon: <TeamOutlined />,
      label: (
        <div className="flex items-center justify-between w-full">
          <span>Students</span>
          <Badge count={450} size="small" />
        </div>
      ),
      path: '/school-dashboard/students'
    },
    {
      key: '/school-dashboard/teachers',
      icon: <SolutionOutlined />,
      label: 'Teachers',
      path: '/school-dashboard/teachers'
    },
    {
      key: '/school-dashboard/classrooms',
      icon: <BookOutlined />,
      label: 'Classes',
      path: '/school-dashboard/classrooms'
    },
    {
      key: '/school-dashboard/fees',
      icon: <MoneyCollectOutlined />,
      label: (
        <div className="flex items-center justify-between w-full">
          <span>Fee Management</span>
          <Badge count={23} size="small" />
        </div>
      ),
      path: '/school-dashboard/fees'
    },
    {
      key: '/school-dashboard/transport',
      icon: <CarOutlined />,
      label: 'Transport',
      path: '/school-dashboard/transport'
    },
    {
      key: '/school-dashboard/calendar',
      icon: <CalendarOutlined />,
      label: 'Academic Calendar',
      path: '/school-dashboard/calendar'
    },
    {
      key: '/school-dashboard/staff',
      icon: <UsergroupAddOutlined />,
      label: 'Staff Management',
      path: '/school-dashboard/staff'
    },
    {
      key: '/school-dashboard/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
      path: '/school-dashboard/analytics'
    },
    {
      key: '/school-dashboard/reports',
      icon: <FileTextOutlined />,
      label: 'Reports',
      path: '/school-dashboard/reports'
    },
    {
      key: '/school-dashboard/notifications',
      icon: <BellOutlined />,
      label: (
        <div className="flex items-center justify-between w-full">
          <span>Notifications</span>
          <Badge count={5} size="small" />
        </div>
      ),
      path: '/school-dashboard/notifications'
    },
    {
      key: '/school-dashboard/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      path: '/school-dashboard/settings'
    }
  ];

  const menuItems = userType === 'SME' ? smeMenuItems : schoolMenuItems;
  const selectedKeys = [location.pathname];

  const handleMenuClick = ({ key }) => {
    if (isMobile) {
      setMobileVisible(false);
    }
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    if (onCollapse) {
      onCollapse(!collapsed);
    }
  };

  const showMobileDrawer = () => {
    setMobileVisible(true);
  };

  const hideMobileDrawer = () => {
    setMobileVisible(false);
  };

  const siderContent = (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <Avatar
            size="large"
            style={{
              backgroundColor: userType === 'SME' ? '#1677ff' : '#722ed1',
              fontSize: '18px'
            }}
            icon={userType === 'SME' ? <BookOutlined /> : <TeamOutlined />}
          />
          {!collapsed && (
            <div>
              <Text strong className="text-base">
                {userType === 'SME' ? 'SME Portal' : 'School Portal'}
              </Text>
              <br />
              <Text type="secondary" className="text-xs">
                Management System
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 overflow-auto">
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          style={{ border: 'none' }}
          onClick={handleMenuClick}
          inlineCollapsed={collapsed}
          theme="light"
        >
          {menuItems.map((item) => (
            <Menu.Item key={item.key} icon={item.icon}>
              <NavLink to={item.path} className="text-decoration-none">
                {item.label}
              </NavLink>
            </Menu.Item>
          ))}
        </Menu>
      </div>

      {/* User Profile */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <Avatar
              size="default"
              style={{ backgroundColor: '#87d068' }}
              icon={<UserOutlined />}
            />
            <div className="flex-1 min-w-0">
              <Text strong className="text-sm block truncate">
                Administrator
              </Text>
              <Text type="secondary" className="text-xs block truncate">
                admin@school.com
              </Text>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      {isMobile && (
        <Button
          type="text"
          icon={<MenuUnfoldOutlined />}
          onClick={showMobileDrawer}
          className="fixed top-4 left-4 z-50 bg-white shadow-md"
          size="large"
        />
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          theme="light"
          collapsible
          collapsed={collapsed}
          onCollapse={toggleCollapse}
          trigger={
            <div className="flex items-center justify-center h-12 border-t border-gray-200">
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
          }
          width={280}
          collapsedWidth={80}
          className="shadow-lg border-r border-gray-200"
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            backgroundColor: '#fff'
          }}
        >
          {siderContent}
        </Sider>
      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          title={null}
          placement="left"
          onClose={hideMobileDrawer}
          open={mobileVisible}
          width={280}
          bodyStyle={{ padding: 0 }}
          headerStyle={{ display: 'none' }}
          className="mobile-sidebar"
        >
          {siderContent}
        </Drawer>
      )}
    </>
  );
}
