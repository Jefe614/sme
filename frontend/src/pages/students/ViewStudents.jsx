import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Card, 
  Table, 
  Tag, 
  Space, 
  Typography, 
  Input, 
  Row, 
  Col, 
  message,
  Spin,
  Avatar
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EyeOutlined,
  EditOutlined,
  UserOutlined,
  UploadOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getStudents } from '../../api/auth';

const { Title } = Typography;
const { Search } = Input;

export default function StudentsListPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async (page = 1, pageSize = 10, query = '') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page,
        pageSize: pageSize,
      });
      if (query) params.append('q', query);

      const response = await getStudents(params.toString());
      const data = response.data;

      setStudents(data.data || []);
      setPagination({
        current: data.pagination?.current || page,
        pageSize: data.pagination?.pageSize || pageSize,
        total: data.pagination?.total || 0
      });
    } catch (error) {
      message.error('Failed to load students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchStudents(1, pagination.pageSize, value);
  };

  const handleTableChange = (pagination) => {
    fetchStudents(pagination.current, pagination.pageSize, searchText);
  };

  const columns = [
    {
      title: 'Profile',
      key: 'profile',
      render: (_, record) => (
        <Avatar 
          src={record.profile_image} 
          icon={<UserOutlined />}
          size="large"
          className="bg-blue-500"
        />
      ),
      width: 70,
    },
    {
      title: 'Admission No.',
      dataIndex: 'admission_number',
      key: 'admission_number',
      render: (text) => text || '—',
    },
    {
      title: 'Student Name',
      key: 'name',
      render: (_, record) => (
        <div>
          <div className="font-medium">{`${record.first_name} ${record.last_name}`}</div>
          <div className="text-xs text-gray-500">{record.parent_name}</div>
        </div>
      ),
    },
    {
      title: 'Class',
      key: 'class',
      render: (_, record) => 
        record.student_class 
          ? `${record.student_class.grade_level} - Sec ${record.student_class.section}`
          : <Tag color="orange">Not Assigned</Tag>,
    },
    {
      title: 'Type',
      dataIndex: 'student_type',
      key: 'student_type',
      render: (type) => (
        <Tag color={type === 'boarding' ? 'blue' : 'green'} className="font-medium">
          {type === 'boarding' ? 'Boarding' : 'Day'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'} className="font-medium">
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button 
            icon={<EyeOutlined />} 
            size="small"
            onClick={() => navigate(`/school-dashboard/students/${record.id}`)}
            title="View"
          />
          <Button 
            icon={<EditOutlined />} 
            size="small"
            onClick={() => navigate(`/school-dashboard/students/${record.id}/edit`)}
            title="Edit"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <Title level={2} className="!mb-1 !text-2xl sm:!text-3xl">
            Students Management
          </Title>
          <p className="text-gray-600">View and manage all students in your school</p>
        </div>

        <Space wrap>
          <Button
            icon={<UploadOutlined />}
            onClick={() => navigate('/school-dashboard/students/bulk-import')}
            size="large"
            className="flex items-center"
          >
            <span className="hidden sm:inline">Bulk Import</span>
            <span className="sm:hidden">Import</span>
          </Button>

          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => navigate('/school-dashboard/add/students')}
            size="large"
            className="flex items-center"
          >
            Add Student
          </Button>
        </Space>
      </div>

      {/* Search & Stats */}
      <Card className="mb-6 shadow-sm">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16} lg={12}>
            <Search 
              placeholder="Search by name, admission no., or parent..." 
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
              allowClear
              className="w-full"
            />
          </Col>
          <Col xs={24} md={8} lg={12} className="text-right">
            <Space>
              <span className="text-gray-600 font-medium">
                Total: <strong className="text-blue-600">{pagination.total}</strong> students
              </span>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <Spin spinning={loading}>
          <Table 
            columns={columns} 
            dataSource={students} 
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) => 
                `${range[0]}–${range[1]} of ${total} students`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 900 }}
            className="overflow-x-auto"
          />
        </Spin>
      </Card>
    </div>
  );
}