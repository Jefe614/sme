import React from 'react';
import { Button, Card, Table, Tag, Space, Typography, Input, Row, Col } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Search } = Input;

export default function StudentsListPage() {
  const navigate = useNavigate();

  const columns = [
    {
      title: 'Admission No.',
      dataIndex: 'admissionNumber',
      key: 'admissionNumber',
    },
    {
      title: 'Student Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Class',
      dataIndex: 'class',
      key: 'class',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'Active' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} size="small">View</Button>
          <Button icon={<EditOutlined />} size="small">Edit</Button>
        </Space>
      ),
    },
  ];

  const data = [
    {
      key: '1',
      admissionNumber: 'STU001',
      name: 'John Doe',
      class: 'Grade 5A',
      status: 'Active',
    },
    // ... more data
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={2}>Students Management</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => navigate('/school-dashboard/add/students')}
          size="large"
        >
          Add New Student
        </Button>
      </div>

      <Card>
        <Row gutter={[16, 16]} className="mb-4">
          <Col xs={24} sm={12} md={8}>
            <Search placeholder="Search students..." enterButton={<SearchOutlined />} />
          </Col>
        </Row>

        <Table columns={columns} dataSource={data} />
      </Card>
    </div>
  );
}