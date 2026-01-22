import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Row,
  Col,
  Button,
  Space,
  Alert,
  Spin,
  Table,
  Select,
  DatePicker,
  Statistic,
  Tag
} from 'antd';
import {
  BarChartOutlined,
  DownloadOutlined,
  ReloadOutlined,
  BankOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { adminAttendanceApi } from '../../api/attendanceApi';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const AdminAttendanceDashboard = () => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedTerm, setSelectedTerm] = useState('');
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [error, setError] = useState('');

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    loadFilterData();
  }, []);

  // Reload dashboard when filters change
  useEffect(() => {
    if (dashboardData) {
      loadDashboardData();
    }
  }, [dateRange, selectedClass, selectedAcademicYear, selectedTerm]);

  const loadFilterData = async () => {
    try {
      // Load classes, academic years, terms for filters
      // In real app, these would come from dedicated API endpoints
      setClasses([
        { id: '1', name: 'Grade 1 A' },
        { id: '2', name: 'Grade 1 B' },
        { id: '3', name: 'Grade 2 A' }
      ]);

      setAcademicYears([
        { id: '1', name: '2024-2025' },
        { id: '2', name: '2023-2024' }
      ]);

      setTerms([
        { id: '1', name: 'Term 1' },
        { id: '2', name: 'Term 2' },
        { id: '3', name: 'Term 3' }
      ]);
    } catch (err) {
      console.error('Error loading filter data:', err);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};

      if (dateRange && dateRange.length === 2) {
        params.startDate = dateRange[0].format('YYYY-MM-DD');
        params.endDate = dateRange[1].format('YYYY-MM-DD');
      }

      if (selectedClass) params.classId = selectedClass;
      if (selectedAcademicYear) params.academicYearId = selectedAcademicYear;
      if (selectedTerm) params.termId = selectedTerm;

      const response = await adminAttendanceApi.getAttendanceDashboard(params);
      setDashboardData(response.data);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      // Use mock data for development/demo purposes
      setDashboardData(getMockDashboardData());
      setError('');
    } finally {
      setLoading(false);
    }
  };

  // Mock data for development/demo
  const getMockDashboardData = () => {
    return {
      date_range: {
        start_date: dateRange && dateRange.length === 2
          ? dateRange[0].format('YYYY-MM-DD')
          : '2024-01-15',
        end_date: dateRange && dateRange.length === 2
          ? dateRange[1].format('YYYY-MM-DD')
          : '2024-01-21'
      },
      summary: {
        total_records: 245,
        present: 198,
        absent: 32,
        late: 12,
        excused: 3,
        attendance_rate: 81
      },
      class_breakdown: [
        {
          student_class__id: 1,
          student_class__name: 'Grade 1 A',
          student_class__grade_level: 'Grade 1',
          student_class__section: 'A',
          total: 45,
          present: 38,
          absent: 5,
          late: 2,
          excused: 0
        },
        {
          student_class__id: 2,
          student_class__name: 'Grade 1 B',
          student_class__grade_level: 'Grade 1',
          student_class__section: 'B',
          total: 42,
          present: 35,
          absent: 4,
          late: 2,
          excused: 1
        },
        {
          student_class__id: 3,
          student_class__name: 'Grade 2 A',
          student_class__grade_level: 'Grade 2',
          student_class__section: 'A',
          total: 38,
          present: 30,
          absent: 6,
          late: 1,
          excused: 1
        },
        {
          student_class__id: 4,
          student_class__name: 'Grade 2 B',
          student_class__grade_level: 'Grade 2',
          student_class__section: 'B',
          total: 40,
          present: 32,
          absent: 5,
          late: 2,
          excused: 1
        },
        {
          student_class__id: 5,
          student_class__name: 'Grade 3 A',
          student_class__grade_level: 'Grade 3',
          student_class__section: 'A',
          total: 35,
          present: 28,
          absent: 4,
          late: 2,
          excused: 1
        },
        {
          student_class__id: 6,
          student_class__name: 'Grade 3 B',
          student_class__grade_level: 'Grade 3',
          student_class__section: 'B',
          total: 45,
          present: 35,
          absent: 7,
          late: 3,
          excused: 0
        }
      ]
    };
  };

  const exportReport = async (format = 'csv') => {
    try {
      const params = {
        startDate: dateRange ? dateRange[0].format('YYYY-MM-DD') : new Date().toISOString().split('T')[0],
        endDate: dateRange ? dateRange[1].format('YYYY-MM-DD') : new Date().toISOString().split('T')[0],
        format
      };

      if (selectedClass) params.classId = selectedClass;

      const response = await adminAttendanceApi.getAttendanceReport(params);

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `attendance_report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (err) {
      setError('Failed to export report');
      console.error('Error exporting report:', err);
    }
  };

  const getStatusTag = (count, color) => {
    return <Tag color={color}>{count}</Tag>;
  };

  if (loading && !dashboardData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const classBreakdownColumns = [
    {
      title: 'Class',
      dataIndex: 'student_class__grade_level',
      key: 'class',
      render: (text, record) => (
        <Space>
          <BankOutlined />
          {text} {record.student_class__section}
        </Space>
      )
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      align: 'right'
    },
    {
      title: 'Present',
      dataIndex: 'present',
      key: 'present',
      align: 'right',
      render: (count) => getStatusTag(count, 'success')
    },
    {
      title: 'Absent',
      dataIndex: 'absent',
      key: 'absent',
      align: 'right',
      render: (count) => getStatusTag(count, 'error')
    },
    {
      title: 'Late',
      dataIndex: 'late',
      key: 'late',
      align: 'right',
      render: (count) => getStatusTag(count, 'warning')
    },
    {
      title: 'Excused',
      dataIndex: 'excused',
      key: 'excused',
      align: 'right',
      render: (count) => getStatusTag(count, 'blue')
    },
    {
      title: 'Attendance Rate',
      key: 'rate',
      align: 'right',
      render: (record) => (
        <strong>
          {record.total > 0
            ? `${Math.round((record.present / record.total) * 100)}%`
            : '0%'
          }
        </strong>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>Attendance Dashboard</Title>
        <Space>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => exportReport('csv')}
          >
            Export CSV
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={() => exportReport('json')}
          >
            Export JSON
          </Button>
          <Button
            icon={<ReloadOutlined />}
            onClick={loadDashboardData}
            loading={loading}
          >
            Refresh
          </Button>
        </Space>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: '16px' }}
        />
      )}

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Title level={4} style={{ marginBottom: '16px' }}>Filters</Title>
        <Row gutter={16} align="middle">
          <Col xs={24} md={6}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Date Range:</label>
            <RangePicker
              style={{ width: '100%' }}
              onChange={setDateRange}
              format="YYYY-MM-DD"
            />
          </Col>
          <Col xs={24} md={4}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Class:</label>
            <Select
              style={{ width: '100%' }}
              value={selectedClass}
              onChange={setSelectedClass}
              placeholder="All Classes"
            >
              <Option value="">All Classes</Option>
              {classes.map((classItem) => (
                <Option key={classItem.id} value={classItem.id}>
                  {classItem.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Academic Year:</label>
            <Select
              style={{ width: '100%' }}
              value={selectedAcademicYear}
              onChange={setSelectedAcademicYear}
              placeholder="All Years"
            >
              <Option value="">All Years</Option>
              {academicYears.map((year) => (
                <Option key={year.id} value={year.id}>
                  {year.name}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} md={4}>
            <label style={{ display: 'block', marginBottom: '8px' }}>Term:</label>
            <Select
              style={{ width: '100%' }}
              value={selectedTerm}
              onChange={setSelectedTerm}
              placeholder="All Terms"
            >
              <Option value="">All Terms</Option>
              {terms.map((term) => (
                <Option key={term.id} value={term.id}>
                  {term.name}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Summary Cards */}
      {dashboardData && (
        <>
          <Row gutter={16} style={{ marginBottom: '24px' }}>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Total Records"
                  value={dashboardData.summary.total_records}
                  prefix={<BarChartOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Present"
                  value={dashboardData.summary.present}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Absent"
                  value={dashboardData.summary.absent}
                  valueStyle={{ color: '#cf1322' }}
                  prefix={<CloseCircleOutlined />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card>
                <Statistic
                  title="Attendance Rate"
                  value={dashboardData.summary.attendance_rate}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<RiseOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Class-wise Breakdown */}
          <Card style={{ marginBottom: '24px' }}>
            <Title level={4} style={{ marginBottom: '16px' }}>Class-wise Attendance Summary</Title>
            <Table
              columns={classBreakdownColumns}
              dataSource={dashboardData.class_breakdown}
              rowKey="student_class__id"
              pagination={false}
              scroll={{ x: 800 }}
            />
          </Card>

          {/* Date Range Info */}
          <Alert
            message={`Showing data for: ${dashboardData.date_range.start_date} to ${dashboardData.date_range.end_date} (Demo Data)`}
            type="info"
            showIcon
            style={{ marginBottom: '16px' }}
          />
          <Alert
            message="This is mock data for demonstration purposes. Connect to the backend API for real data."
            type="warning"
            showIcon
          />
        </>
      )}
    </div>
  );
};

export default AdminAttendanceDashboard;
