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
  Avatar,
  Popconfirm
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EyeOutlined,
  EditOutlined,
  UserOutlined,
  UploadOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getStudents, deleteStudent } from '../../api/auth';
import BulkImportModal from './BulkImportModal';

const { Title, Text } = Typography;
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
  const [bulkImportModalOpen, setBulkImportModalOpen] = useState(false);

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

  const handleBulkImportSuccess = () => {
    setBulkImportModalOpen(false);
    fetchStudents(pagination.current, pagination.pageSize, searchText);
  };

  const handleDeleteStudent = async (studentId, studentName) => {
    try {
      await deleteStudent(studentId);
      message.success(`Student "${studentName}" deleted successfully`);
      fetchStudents(pagination.current, pagination.pageSize, searchText);
    } catch (error) {
      message.error(`Failed to delete student: ${error.response?.data?.error || error.message}`);
    }
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
      width: 80,
    },
    {
      title: 'Admission No.',
      dataIndex: 'admission_number',
      key: 'admission_number',
      render: (text) => <Text>{text || '—'}</Text>,
    },
    {
      title: 'Student Name',
      key: 'name',
      render: (_, record) => (
        <div>
          <div className="font-semibold text-gray-900">{`${record.first_name} ${record.last_name}`}</div>
          <div className="text-xs text-gray-500">{record.parent_name}</div>
        </div>
      ),
    },
    {
      title: 'Class',
      key: 'class',
      render: (_, record) => 
        record.student_class 
          ? <Text>{`${record.student_class.name}`}</Text>
          : <Tag color="orange">Not Assigned</Tag>,
    },
    {
      title: 'Type',
      dataIndex: 'student_type',
      key: 'student_type',
      render: (type) => (
        <Tag color={type === 'boarding' ? 'blue' : 'cyan'}>
          {type === 'boarding' ? 'Boarding' : 'Day'}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/school-dashboard/students/${record.id}`)}
            title="View"
          />
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => navigate(`/school-dashboard/students/${record.id}/edit`)}
            title="Edit"
          />
          <Popconfirm
            title={`Delete Student`}
            description={
              <>
                Are you sure you want to delete "{record.first_name} {record.last_name}"?
                <br />
                This action cannot be undone.
              </>
            }
            onConfirm={() => handleDeleteStudent(record.id, `${record.first_name} ${record.last_name}`)}
            okText="Yes"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              icon={<DeleteOutlined />}
              danger
              title="Delete"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Title level={2} className="!m-0 mb-2">Students Management</Title>
            <Text type="secondary">View and manage all students in your school</Text>
          </div>

          <Space wrap size="middle">
            <Button
              icon={<UploadOutlined />}
              onClick={() => setBulkImportModalOpen(true)}
              size="large"
            >
              <span className="hidden sm:inline">Bulk Import</span>
              <span className="sm:hidden">Import</span>
            </Button>

            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => navigate('/school-dashboard/add/students')}
              size="large"
            >
              Add Student
            </Button>
          </Space>
        </div>
      </div>

      {/* Search Card */}
      <Card className="mb-8 shadow-sm border-0">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} lg={14}>
            <Search
              placeholder="Search by name, admission no., or parent..."
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
              allowClear
            />
          </Col>
          <Col xs={24} lg={10} className="text-right">
            <Text className="text-gray-600">
              Total: <Text strong className="text-blue-600">{pagination.total}</Text> students
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Table Card */}
      <Card className="shadow-sm border-0">
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
          />
        </Spin>
      </Card>

      {/* Bulk Import Modal */}
      <BulkImportModal
        open={bulkImportModalOpen}
        onClose={() => setBulkImportModalOpen(false)}
        onSuccess={handleBulkImportSuccess}
      />
    </div>
  );
}
