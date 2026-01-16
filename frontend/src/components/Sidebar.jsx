import React, { useState, useEffect, useContext } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Layout, Avatar, Typography, Badge, Drawer, Button, Collapse } from 'antd';
import {
  HomeOutlined, DollarOutlined, TeamOutlined, SolutionOutlined,
  MoneyCollectOutlined, CarOutlined, CalendarOutlined, UserOutlined,
  BarChartOutlined, FileTextOutlined, BellOutlined, SettingOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined, BookOutlined, UsergroupAddOutlined,
  DownOutlined, RightOutlined
} from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';


const { Sider } = Layout;
const { Text } = Typography;

// Colors
const PRIMARY_COLOR = '#0F172A'; // Dark navy
const SECONDARY_COLOR = '#3B82F6'; // Blue highlight
const HOVER_COLOR = '#FFFFFF'; // White hover
const SELECTED_COLOR = '#60A5FA'; // Light blue selected
const BADGE_COLOR = '#DC2626'; // Red badge
const TEXT_COLOR = '#F8FAFC'; // Light text

export default function Sidebar({ userType, onCollapse }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileVisible, setMobileVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [academicExpanded, setAcademicExpanded] = useState(false);
  const [examsExpanded, setExamsExpanded] = useState(false);
  const location = useLocation();
  const { user } = useContext(AuthContext);

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
    { key: '/school-dashboard/exams', icon: <FileTextOutlined />, label: 'Exams & Results', path: '/school-dashboard/exams' },
    { key: '/school-dashboard/fees', icon: <MoneyCollectOutlined />, label: 'Fee Management', path: '/school-dashboard/fees' },
    { key: '/school-dashboard/transport', icon: <CarOutlined />, label: 'Transport', path: '/school-dashboard/transport' },
    { key: '/school-dashboard/academic-years', icon: <CalendarOutlined />, label: 'Academic Calendar', path: '/school-dashboard/academic-years' },
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

  const toggleAcademicMenu = () => {
    setAcademicExpanded(!academicExpanded);
  };

  const toggleExamsMenu = () => {
    setExamsExpanded(!examsExpanded);
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
    if (onCollapse) onCollapse(!collapsed);
  };

  const showMobileDrawer = () => setMobileVisible(true);
  const hideMobileDrawer = () => setMobileVisible(false);

  const academicSubMenuItems = [
    { key: '/school-dashboard/academic-years', label: 'Academic Years', path: '/school-dashboard/academic-years' },
    { key: '/school-dashboard/terms', label: 'Terms', path: '/school-dashboard/terms' },
    { key: '/school-dashboard/subjects', label: 'Subjects', path: '/school-dashboard/subjects' },
    { key: '/school-dashboard/subject-assignments', label: 'Subject Assignments', path: '/school-dashboard/subject-assignments' },
  ];

  const examsSubMenuItems = [
    { key: '/school-dashboard/exam-management', label: 'Exam Setup', path: '/school-dashboard/exam-management' },
    { key: '/school-dashboard/marks-entry', label: 'Marks Entry', path: '/school-dashboard/marks-entry' },
    { key: '/school-dashboard/report-cards', label: 'Report Cards', path: '/school-dashboard/report-cards' },
    { key: '/school-dashboard/class-performance', label: 'Class Performance', path: '/school-dashboard/class-performance' },
    { key: '/school-dashboard/grading-systems', label: 'Grading Systems', path: '/school-dashboard/grading-systems' },
  ];

  const renderMenuItems = () =>
    menuItems.map((item) => {
      // Special handling for Academic Calendar dropdown
      if (item.key === '/school-dashboard/academic-years' && userType === 'School') {
        const isAcademicActive = selectedKeys.some(key =>
          key.startsWith('/school-dashboard/academic') ||
          key.startsWith('/school-dashboard/terms') ||
          key.startsWith('/school-dashboard/subjects') ||
          key.startsWith('/school-dashboard/subject-assignments')
        );

        return (
          <div key={item.key}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                margin: '6px 0',
                borderRadius: '8px',
                color: isAcademicActive ? SELECTED_COLOR : TEXT_COLOR,
                backgroundColor: isAcademicActive ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderLeft: isAcademicActive ? `3px solid ${SELECTED_COLOR}` : '3px solid transparent',
                fontSize: collapsed ? '0' : '12px',
                width: collapsed ? '100%' : 'auto'
              }}
              onClick={toggleAcademicMenu}
            >
              <span style={{ fontSize: '18px', minWidth: '20px', display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && (academicExpanded ? <RightOutlined style={{ marginLeft: 'auto', fontSize: '12px' }} /> : <DownOutlined style={{ marginLeft: 'auto', fontSize: '12px' }} />)}
            </div>

            {!collapsed && academicExpanded && (
              <div style={{ marginLeft: '20px' }}>
                {academicSubMenuItems.map((subItem) => (
                  <NavLink
                    key={subItem.key}
                    to={subItem.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 16px',
                      margin: '2px 0',
                      borderRadius: '6px',
                      color: selectedKeys.includes(subItem.key) ? SELECTED_COLOR : TEXT_COLOR,
                      backgroundColor: selectedKeys.includes(subItem.key) ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textDecoration: 'none',
                      borderLeft: selectedKeys.includes(subItem.key) ? `2px solid ${SELECTED_COLOR}` : '2px solid transparent',
                      fontSize: '11px',
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedKeys.includes(subItem.key)) {
                        e.currentTarget.style.color = HOVER_COLOR;
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedKeys.includes(subItem.key)) {
                        e.currentTarget.style.color = TEXT_COLOR;
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    onClick={handleMenuClick}
                  >
                    <span style={{ fontSize: '14px', minWidth: '16px', display: 'flex', alignItems: 'center' }}>
                      •
                    </span>
                    <span>{subItem.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      }

      // Special handling for Exams & Results dropdown
      if (item.key === '/school-dashboard/exams' && userType === 'School') {
        const isExamsActive = selectedKeys.some(key =>
          key.startsWith('/school-dashboard/exam') ||
          key.startsWith('/school-dashboard/marks') ||
          key.startsWith('/school-dashboard/report') ||
          key.startsWith('/school-dashboard/class-performance') ||
          key.startsWith('/school-dashboard/grading')
        );

        return (
          <div key={item.key}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                margin: '6px 0',
                borderRadius: '8px',
                color: isExamsActive ? SELECTED_COLOR : TEXT_COLOR,
                backgroundColor: isExamsActive ? 'rgba(96, 165, 250, 0.15)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                borderLeft: isExamsActive ? `3px solid ${SELECTED_COLOR}` : '3px solid transparent',
                fontSize: collapsed ? '0' : '12px',
                width: collapsed ? '100%' : 'auto'
              }}
              onClick={toggleExamsMenu}
            >
              <span style={{ fontSize: '18px', minWidth: '20px', display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && (examsExpanded ? <RightOutlined style={{ marginLeft: 'auto', fontSize: '12px' }} /> : <DownOutlined style={{ marginLeft: 'auto', fontSize: '12px' }} />)}
            </div>

            {!collapsed && examsExpanded && (
              <div style={{ marginLeft: '20px' }}>
                {examsSubMenuItems.map((subItem) => (
                  <NavLink
                    key={subItem.key}
                    to={subItem.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '8px 16px',
                      margin: '2px 0',
                      borderRadius: '6px',
                      color: selectedKeys.includes(subItem.key) ? SELECTED_COLOR : TEXT_COLOR,
                      backgroundColor: selectedKeys.includes(subItem.key) ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      textDecoration: 'none',
                      borderLeft: selectedKeys.includes(subItem.key) ? `2px solid ${SELECTED_COLOR}` : '2px solid transparent',
                      fontSize: '11px',
                    }}
                    onMouseEnter={(e) => {
                      if (!selectedKeys.includes(subItem.key)) {
                        e.currentTarget.style.color = HOVER_COLOR;
                        e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!selectedKeys.includes(subItem.key)) {
                        e.currentTarget.style.color = TEXT_COLOR;
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                    onClick={handleMenuClick}
                  >
                    <span style={{ fontSize: '14px', minWidth: '16px', display: 'flex', alignItems: 'center' }}>
                      •
                    </span>
                    <span>{subItem.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        );
      }

      // Regular menu items
      return (
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
            fontSize: collapsed ? '0' : '12px',
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
      );
    });

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
              <Text style={{ color: TEXT_COLOR, fontWeight: '600', fontSize: '12px', display: 'block' }}>
                {userType === 'SME' ? 'SME' : 'School'} Portal
              </Text>
              <Text style={{ color: SECONDARY_COLOR, fontSize: '10px', display: 'block' }}>
                Management System
              </Text>
            </div>
          )}
        </div>
      </div>

      {/* Menu */}
      <div style={{
        flex: 1,
        overflowY: 'scroll',
        scrollbarWidth: 'none', // Firefox
        msOverflowStyle: 'none', // IE and Edge
        padding: '8px 6px'
      }}
      className="scrollbar-hide" // Custom class for webkit browsers
      >
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
        `}</style>
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
              <span>{user.email || 'N/A'}</span>
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
          width={240}
          collapsedWidth={70}
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
