import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Layout, Avatar, Typography, Badge, Drawer, Button } from 'antd';
import { 
  HomeOutlined, DollarOutlined, TeamOutlined, SolutionOutlined, 
  MoneyCollectOutlined, CarOutlined, CalendarOutlined, UserOutlined, 
  BarChartOutlined, FileTextOutlined, BellOutlined, SettingOutlined, 
  MenuFoldOutlined, MenuUnfoldOutlined, BookOutlined, UsergroupAddOutlined 
} from '@ant-design/icons';

const { Sider } = Layout;
const { Text } = Typography;

// Colors
const PRIMARY_COLOR = '#0F172A'; // Dark navy
const SECONDARY_COLOR = '#3B82F6'; // Blue highlight
const HOVER_COLOR = '#EF4444'; // Red hover
const SELECTED_COLOR = '#60A5FA'; // Light blue selected
const BADGE_COLOR = '#DC2626'; // Red badge
const TEXT_COLOR = '#F8FAFC'; // Light text

export default function Sidebar({ userType, onCollapse }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (mobile) setCollapsed(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const smeMenuItems = [
    { key: '/sme-dashboard', icon: <HomeOutlined />, label: 'Dashboard', path: '/sme-dashboard' },
    { key: '/sme-dashboard/cashflow', icon: <DollarOutlined />, label: 'Cash Flow', path: '/sme-dashboard/cashflow' },
    { key: '/sme-dashboard/analytics', icon: <BarChartOutlined />, label: 'Analytics', path: '/sme-dashboard/analytics' },
    { key: '/sme-dashboard/reports', icon: <FileTextOutlined />, label: 'Reports', path: '/sme-dashboard/reports' },
    { key: '/sme-dashboard/settings', icon: <SettingOutlined />, label: 'Settings', path: '/sme-dashboard/settings' },
  ];

  const schoolMenuItems = [
    { key: '/school-dashboard', icon: <HomeOutlined />, label: 'Dashboard', path: '/school-dashboard' },
    { key: '/school-dashboard/students', icon: <TeamOutlined />, label: 'Students', path: '/school-dashboard/students' },
    { key: '/school-dashboard/teachers', icon: <SolutionOutlined />, label: 'Teachers', path: '/school-dashboard/teachers' },
    { key: '/school-dashboard/classrooms', icon: <BookOutlined />, label: 'Classes', path: '/school-dashboard/classrooms' },
    { key: '/school-dashboard/fees', icon: <MoneyCollectOutlined />, label: 'Fee Management', path: '/school-dashboard/fees' },
    { key: '/school-dashboard/transport', icon: <CarOutlined />, label: 'Transport', path: '/school-dashboard/transport' },
    { key: '/school-dashboard/calendar', icon: <CalendarOutlined />, label: 'Academic Calendar', path: '/school-dashboard/calendar' },
    { key: '/school-dashboard/staff', icon: <UsergroupAddOutlined />, label: 'Staff Management', path: '/school-dashboard/staff' },
    { key: '/school-dashboard/templates', icon: <FileTextOutlined />, label: 'Document Templates', path: '/school-dashboard/templates' },
    { key: '/school-dashboard/analytics', icon: <BarChartOutlined />, label: 'Analytics', path: '/school-dashboard/analytics' },
    { key: '/school-dashboard/reports', icon: <FileTextOutlined />, label: 'Reports', path: '/school-dashboard/reports' },
    { key: '/school-dashboard/notifications', icon: <BellOutlined />, label: 'Notifications', path: '/school-dashboard/notifications' },
    { key: '/school-dashboard/settings', icon: <SettingOutlined />, label: 'Settings', path: '/school-dashboard/settings' },
  ];

  const menuItems = userType === 'SME' ? smeMenuItems : schoolMenuItems;
  const selectedKeys = [location.pathname];

  const handleMenuClick = ({ key }) => {
    if (isMobile) setMobileVisible(false);
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    if (onCollapse) onCollapse(!collapsed);
  };

  const showMobileDrawer = () => setMobileVisible(true);
  const hideMobileDrawer = () => setMobileVisible(false);

  const renderMenuItems = () =>
    menuItems.map((item) => (
      <NavLink
        key={item.key}
        to={item.path}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          margin: '6px 0',
          borderRadius: '8px',
          color: selectedKeys.includes(item.key) ? SELECTED_COLOR : TEXT_COLOR,
          backgroundColor: selectedKeys.includes(item.key) ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          textDecoration: 'none',
          borderLeft: selectedKeys.includes(item.key) ? `3px solid ${SELECTED_COLOR}` : '3px solid transparent',
          fontSize: collapsed ? '0' : '14px',
          width: collapsed ? '100%' : 'auto'
        }}
        onMouseEnter={(e) => {
          if (!selectedKeys.includes(item.key)) {
            e.currentTarget.style.color = HOVER_COLOR;
            e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
            e.currentTarget.style.transform = 'translateX(4px)';
          }
        }}
        onMouseLeave={(e) => {
          if (!selectedKeys.includes(item.key)) {
            e.currentTarget.style.color = TEXT_COLOR;
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.transform = 'translateX(0)';
          }
        }}
        onClick={handleMenuClick}
      >
        <span style={{ fontSize: '18px', minWidth: '20px', display: 'flex', alignItems: 'center' }}>
          {item.icon}
        </span>
        {!collapsed && <span>{item.label}</span>}
      </NavLink>
    ));

  const siderContent = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '24px 16px 20px 16px', borderBottom: `1px solid rgba(96, 165, 250, 0.2)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: collapsed ? 'center' : 'flex-start' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '8px',
            background: `linear-gradient(135deg, ${SECONDARY_COLOR}, ${HOVER_COLOR})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: TEXT_COLOR,
            fontSize: '20px',
            fontWeight: 'bold',
            boxShadow: `0 4px 12px rgba(239, 68, 68, 0.3)`
          }}>
            {userType === 'SME' ? 'S' : 'E'}
          </div>
          {!collapsed && (
            <div style={{ overflow: 'hidden' }}>
              <Text style={{ color: TEXT_COLOR, fontWeight: '600', fontSize: '14px', display: 'block' }}>
                {userType === 'SME' ? 'SME' : 'School'} Portal
              </Text>
              <Text style={{ color: SECONDARY_COLOR, fontSize: '12px', display: 'block' }}>
                Management System
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 8px' }}>
        {renderMenuItems()}
      </div>

      {/* User Profile */}
      {!collapsed && (
        <div style={{
          padding: '16px',
          borderTop: `1px solid rgba(96, 165, 250, 0.2)`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Badge
            count={3}
            style={{
              backgroundColor: BADGE_COLOR,
              boxShadow: `0 0 0 1px ${PRIMARY_COLOR}`
            }}
          >
            <Avatar style={{ backgroundColor: SECONDARY_COLOR }} icon={<UserOutlined />} />
          </Badge>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ color: TEXT_COLOR, fontWeight: '600', fontSize: '14px', display: 'block' }}>
              Administrator
            </Text>
            <Text style={{ color: 'rgba(248, 250, 252, 0.7)', fontSize: '12px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              admin@school.com
            </Text>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile Hamburger */}
      {isMobile && (
        <Button
          type="text"
          icon={<MenuUnfoldOutlined />}
          onClick={showMobileDrawer}
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 50,
            backgroundColor: PRIMARY_COLOR,
            color: TEXT_COLOR,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            border: 'none'
          }}
          size="large"
        />
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={250}
          collapsedWidth={80}
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 100,
            backgroundColor: PRIMARY_COLOR,
            boxShadow: '4px 0 16px rgba(0, 0, 0, 0.4)'
          }}
        >
          <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              height: '96%' 
          }}>
            {siderContent}

            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleCollapse}
              style={{
                width: '100%',
                color: SECONDARY_COLOR,
                border: 'none',
                borderTop: `1px solid rgba(96, 165, 250, 0.2)`,
                borderRadius: 0,
                padding: '12px',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = HOVER_COLOR;
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = SECONDARY_COLOR;
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            />
          </div>
        </Sider>

      )}

      {/* Mobile Drawer */}
      {isMobile && (
        <Drawer
          placement="left"
          onClose={hideMobileDrawer}
          open={mobileVisible}
          bodyStyle={{
            padding: 0,
            backgroundColor: PRIMARY_COLOR,
            height: '100vh',
            overflowY: 'auto',
          }}
          headerStyle={{
            backgroundColor: PRIMARY_COLOR,
            borderBottom: `1px solid rgba(96, 165, 250, 0.2)`
          }}
          title={<span style={{ color: TEXT_COLOR }}>{userType === 'SME' ? 'SME' : 'School'} Portal</span>}
        >
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
            {siderContent}
          </div>
        </Drawer>
      )}
    </>
  );
}
