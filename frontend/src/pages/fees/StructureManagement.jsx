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
  Select,
  Modal,
  Form,
  InputNumber,
  DatePicker,
  Switch,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import {
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure
} from '../../api/auth';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;
const { TextArea } = Input;

export default function StructureManagement() {
  const navigate = useNavigate();
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [form] = Form.useForm();

  const [filterOptions, setFilterOptions] = useState({
    fee_type: '',
    academic_year: '',
    is_active: ''
  });

  useEffect(() => {
    fetchStructures();
  }, []);

  const fetchStructures = async (page = 1, pageSize = 10, query = '', filters = {}) => {
    setLoading(true);
    try {
      const params = {
        current: page,
        pageSize: pageSize,
      };

      if (query) params.q = query;
      if (filters.fee_type) params.fee_type = filters.fee_type;
      if (filters.academic_year) params.academic_year = filters.academic_year;
      if (filters.is_active !== '') params.is_active = filters.is_active;

      const response = await getFeeStructures(params);
      const data = response.data;

      setStructures(data.data || []);
      setPagination({
        current: data.pagination?.current || page,
        pageSize: data.pagination?.pageSize || pageSize,
        total: data.pagination?.total || 0
      });
    } catch (error) {
      message.error('Failed to load fee structures');
      setStructures([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchStructures(1, pagination.pageSize, value, filterOptions);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filterOptions, [key]: value };
    setFilterOptions(newFilters);
    fetchStructures(1, pagination.pageSize, searchText, newFilters);
  };

  const handleTableChange = (pagination) => {
    fetchStructures(pagination.current, pagination.pageSize, searchText, filterOptions);
  };

  const handleCreate = () => {
    setEditingStructure(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingStructure(record);
    form.setFieldsValue({
      ...record,
      due_date: record.due_date ? moment(record.due_date) : null,
    });
    setModalVisible(true);
  };

  const handleEditRecord = (record) => {
    // For future implementation - edit a single fee structure with ID
    console.log('Edit structure:', record);
    handleEdit(record);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Are you sure?',
      content: 'This action cannot be undone.',
      onOk: async () => {
        try {
          await deleteFeeStructure(id);
          message.success('Fee structure deleted successfully');
          fetchStructures(pagination.current, pagination.pageSize, searchText, filterOptions);
        } catch (error) {
          message.error('Failed to delete fee structure');
        }
      },
    });
  };

  const handleModalSubmit = async (values) => {
    try {
      const data = {
        ...values,
        due_date: values.due_date?.format('YYYY-MM-DD') || null,
      };

      if (editingStructure) {
        await updateFeeStructure(editingStructure.id, data);
        message.success('Fee structure updated successfully');
      } else {
        await createFeeStructure(data);
        message.success('Fee structure created successfully');
      }

      setModalVisible(false);
      fetchStructures(pagination.current, pagination.pageSize, searchText, filterOptions);
    } catch (error) {
      message.error('Failed to save fee structure');
    }
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      render: (text, record) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-xs text-gray-500">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Fee Type',
      dataIndex: 'fee_type',
      key: 'fee_type',
      render: (type) => {
        const colors = {
          tuition: 'blue',
          boarding: 'orange',
          transport: 'green',
          library: 'purple',
          sports: 'red',
          medical: 'cyan',
          examination: 'magenta',
          development: 'geekblue',
          other: 'gray'
        };
        return (
          <Tag color={colors[type] || 'default'} className="capitalize">
            {type?.replace('_', ' ')}
          </Tag>
        );
      },
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <div className="font-semibold text-green-600">
          {record.currency} {amount?.toLocaleString() || '0'}
        </div>
      ),
    },
    {
      title: 'Academic Year',
      dataIndex: 'academic_year',
      key: 'academic_year',
    },
    {
      title: 'Term',
      dataIndex: 'term',
      key: 'term',
      render: (term) => <Tag>{term?.replace('_', ' ').toUpperCase()}</Tag>,
    },
    {
      title: 'Due Date',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => date || '—',
    },
    {
      title: 'Students',
      key: 'student_count',
      render: (_, record) => record.student_count || 0,
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
      width: 140,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
            title="Edit"
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
            title="Delete"
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/school-dashboard/fees')}
            className="mb-2"
          >
            Back to Fee Management
          </Button>
          <Title level={2} className="!mb-1">
            Fee Structures Management
          </Title>
          <p className="text-gray-600">Create and manage fee categories for your school</p>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6 shadow-sm">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={12} lg={6}>
            <Search
              placeholder="Search structures..."
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="Fee Type"
              style={{ width: '100%' }}
              size="large"
              allowClear
              onChange={(value) => handleFilterChange('fee_type', value)}
            >
              <Option value="tuition">Tuition</Option>
              <Option value="boarding">Boarding</Option>
              <Option value="transport">Transport</Option>
              <Option value="library">Library</Option>
              <Option value="sports">Sports</Option>
              <Option value="medical">Medical</Option>
              <Option value="examination">Examination</Option>
              <Option value="development">Development</Option>
              <Option value="other">Other</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="Academic Year"
              style={{ width: '100%' }}
              size="large"
              allowClear
              onChange={(value) => handleFilterChange('academic_year', value)}
            >
              <Option value="2024-2025">2024-2025</Option>
              <Option value="2025-2026">2025-2026</Option>
              <Option value="2026-2027">2026-2027</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6} lg={4}>
            <Select
              placeholder="Status"
              style={{ width: '100%' }}
              size="large"
              allowClear
              onChange={(value) => handleFilterChange('is_active', value === 'true' ? true : value === 'false' ? false : '')}
            >
              <Option value="true">Active</Option>
              <Option value="false">Inactive</Option>
            </Select>
          </Col>

          <Col xs={24} lg={6} className="text-right">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={handleCreate}
            >
              Create Fee Structure
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={structures}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} of ${total} structures`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1200 }}
          />
        </Spin>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingStructure ? 'Edit Fee Structure' : 'Create Fee Structure'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="name"
                label="Structure Name"
                rules={[{ required: true, message: 'Please enter structure name' }]}
              >
                <Input placeholder="e.g., Grade 1 Term 1 Fees 2024" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="fee_type"
                label="Fee Type"
                rules={[{ required: true, message: 'Please select fee type' }]}
              >
                <Select placeholder="Select fee type">
                  <Option value="tuition">Tuition Fee</Option>
                  <Option value="boarding">Boarding Fee</Option>
                  <Option value="transport">Transport Fee</Option>
                  <Option value="library">Library Fee</Option>
                  <Option value="sports">Sports Fee</Option>
                  <Option value="medical">Medical Fee</Option>
                  <Option value="examination">Examination Fee</Option>
                  <Option value="development">Development Fee</Option>
                  <Option value="other">Other Fee</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item name="currency" label="Currency">
                <Select defaultValue="KES">
                  <Option value="KES">KES</Option>
                  <Option value="USD">USD</Option>
                  <Option value="EUR">EUR</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="academic_year"
                label="Academic Year"
                rules={[{ required: true, message: 'Please select academic year' }]}
              >
                <Select placeholder="Select year">
                  <Option value="2024-2025">2024-2025</Option>
                  <Option value="2025-2026">2025-2026</Option>
                  <Option value="2026-2027">2026-2027</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="term"
                label="Term"
                rules={[{ required: true, message: 'Please select term' }]}
              >
                <Select placeholder="Select term">
                  <Option value="term1">Term 1</Option>
                  <Option value="term2">Term 2</Option>
                  <Option value="term3">Term 3</Option>
                  <Option value="annual">Annual</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="due_date" label="Due Date">
                <DatePicker style={{ width: '100%' }} placeholder="Select due date" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="grade_level" label="Grade Level (Optional)">
                <Select placeholder="Specific to grade level" allowClear>
                  <Option value="pre-school">Pre-School</Option>
                  <Option value="grade-1">Grade 1</Option>
                  <Option value="grade-2">Grade 2</Option>
                  <Option value="grade-3">Grade 3</Option>
                  <Option value="grade-4">Grade 4</Option>
                  <Option value="grade-5">Grade 5</Option>
                  <Option value="grade-6">Grade 6</Option>
                  <Option value="grade-7">Grade 7</Option>
                  <Option value="grade-8">Grade 8</Option>
                  <Option value="form-1">Form 1</Option>
                  <Option value="form-2">Form 2</Option>
                  <Option value="form-3">Form 3</Option>
                  <Option value="form-4">Form 4</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="student_type" label="Student Type (Optional)">
                <Select placeholder="Specific to student type" allowClear>
                  <Option value="day">Day Scholar</Option>
                  <Option value="boarding">Boarding Student</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="description" label="Description">
                <TextArea rows={3} placeholder="Fee structure description..." />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item name="is_active" label="Active" valuePropName="checked">
                <Switch defaultChecked />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item name="is_optional" label="Optional Fee" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item name="installment_allowed" label="Installments Allowed" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <div className="flex justify-end mt-6">
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                {editingStructure ? 'Update' : 'Create'} Structure
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
