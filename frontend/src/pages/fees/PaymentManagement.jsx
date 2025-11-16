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
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import {
  getFeePayments,
  createFeePayment,
  updateFeePayment,
  deleteFeePayment,
  getStudents,
  getFeeStructures,
} from '../../api/auth';

const { Title } = Typography;
const { Search } = Input;
const { Option } = Select;

export default function PaymentManagement() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [form] = Form.useForm();
  const [students, setStudents] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);

  useEffect(() => {
    fetchPayments();
    fetchStudentsAndStructures();
  }, []);

  const fetchStudentsAndStructures = async () => {
    try {
      const [studentsResponse, structuresResponse] = await Promise.all([
        getStudents(),
        getFeeStructures(),
      ]);
      setStudents(studentsResponse.data.data || []);
      setFeeStructures(structuresResponse.data.data || []);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const fetchPayments = async (page = 1, pageSize = 10, query = '') => {
    setLoading(true);
    try {
      const params = { current: page, pageSize: pageSize };
      if (query) params.q = query;

      const response = await getFeePayments(params);
      const data = response.data;

      setPayments(data.data || []);
      setPagination({
        current: data.pagination?.current || page,
        pageSize: data.pagination?.pageSize || pageSize,
        total: data.pagination?.total || 0
      });
    } catch (error) {
      message.error('Failed to load fee payments');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    fetchPayments(1, pagination.pageSize, value);
  };

  const handleTableChange = (pagination) => {
    fetchPayments(pagination.current, pagination.pageSize, searchText);
  };

  const handleCreate = () => {
    setEditingPayment(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingPayment(record);
    form.setFieldsValue({
      ...record,
      payment_date: moment(record.payment_date),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    Modal.confirm({
      title: 'Are you sure?',
      content: 'This action cannot be undone.',
      onOk: async () => {
        try {
          await deleteFeePayment(id);
          message.success('Fee payment deleted successfully');
          fetchPayments(pagination.current, pagination.pageSize, searchText);
        } catch (error) {
          message.error('Failed to delete fee payment');
        }
      },
    });
  };

  const handleModalSubmit = async (values) => {
    try {
      const data = {
        ...values,
        payment_date: values.payment_date?.format('YYYY-MM-DD') || new Date().toISOString().split('T')[0],
      };

      if (editingPayment) {
        await updateFeePayment(editingPayment.id, data);
        message.success('Fee payment updated successfully');
      } else {
        await createFeePayment(data);
        console.log('Fee payment created successfully');  
        message.success('Fee payment recorded successfully');
      }

      setModalVisible(false);
      fetchPayments(pagination.current, pagination.pageSize, searchText);
    } catch (error) {
      message.error('Failed to save fee payment');
    }
  };

  const columns = [
    {
      title: 'Receipt No.',
      dataIndex: 'receipt_number',
      key: 'receipt_number',
      render: (text) => text || '—',
    },
    {
      title: 'Student',
      key: 'student',
      render: (text, record) => (
        <div>
          <div className="font-medium">{record.student_name}</div>
          <div className="text-xs text-gray-500">ID: {record.admission_number}</div>
        </div>
      ),
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => (
        <div className="font-semibold text-green-600">
          KES {record.amount_paid?.toLocaleString() || '0'}
        </div>
      ),
    },
    {
      title: 'Balance',
      key: 'balance',
      render: (_, record) => {
        const balance = record.balance || 0;
        return (
          <span className={balance <= 0 ? 'text-green-600' : 'text-red-600'}>
            KES {balance.toLocaleString()}
          </span>
        );
      },
    },
    {
      title: 'Payment Method',
      dataIndex: 'payment_method',
      key: 'payment_method',
      render: (method) => <Tag>{method?.replace('_', ' ').toUpperCase()}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status?.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'payment_date',
      key: 'payment_date',
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Button
            icon={<EyeOutlined />}
            size="small"
            onClick={() => message.info('Receipt viewing not implemented yet')}
          />
          <Button
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Button
            icon={<DeleteOutlined />}
            size="small"
            danger
            onClick={() => handleDelete(record.id)}
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
            Fee Payment Management
          </Title>
          <p className="text-gray-600">Record and manage student fee payments</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6 shadow-sm">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={16} lg={12}>
            <Search
              placeholder="Search by student name, receipt no..."
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              onChange={(e) => setSearchText(e.target.value)}
              value={searchText}
              allowClear
            />
          </Col>
          <Col xs={24} lg={12} className="text-right">
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="large"
              onClick={handleCreate}
            >
              Record New Payment
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Table */}
      <Card className="shadow-sm">
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={payments}
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showQuickJumper: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total, range) =>
                `${range[0]}–${range[1]} of ${total} payments`,
            }}
            onChange={handleTableChange}
            scroll={{ x: 1000 }}
          />
        </Spin>
      </Card>

      {/* Payment Modal */}
      <Modal
        title={editingPayment ? 'Edit Payment' : 'Record New Payment'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleModalSubmit}
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Form.Item
                name="student"
                label="Student"
                rules={[{ required: true, message: 'Please select a student' }]}
              >
                <Select
                  placeholder="Select student"
                  showSearch
                  filterOption={(input, option) =>
                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                  }
                >
                  {students.map((student) => (
                    <Option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.admission_number})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="fee_structure" label="Fee Structure (Optional)">
                <Select placeholder="Select fee structure" allowClear>
                  {feeStructures.map((structure) => (
                    <Option key={structure.id} value={structure.id}>
                      {structure.name} - KES {structure.amount}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="amount_paid"
                label="Amount Paid"
                rules={[{ required: true, message: 'Please enter amount paid' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  prefix="KES"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="due_amount" label="Due Amount">
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  prefix="KES"
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="payment_method"
                label="Payment Method"
                rules={[{ required: true, message: 'Please select payment method' }]}
              >
                <Select placeholder="Select payment method">
                  <Option value="cash">Cash</Option>
                  <Option value="mpesa">M-Pesa</Option>
                  <Option value="bank_transfer">Bank Transfer</Option>
                  <Option value="cheque">Cheque</Option>
                  <Option value="card">Credit/Debit Card</Option>
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item
                name="payment_date"
                label="Payment Date"
                rules={[{ required: true, message: 'Please select payment date' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="transaction_id" label="Transaction ID (Optional)">
                <Input placeholder="Bank/M-Pesa transaction ID" />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="paid_by" label="Paid By (Optional)">
                <Input placeholder="Name of person who made payment" />
              </Form.Item>
            </Col>

            <Col xs={24}>
              <Form.Item name="notes" label="Notes (Optional)">
                <Input.TextArea rows={3} placeholder="Additional notes..." />
              </Form.Item>
            </Col>

            <Col xs={24} md={12}>
              <Form.Item name="is_installment" label="Installment Payment" valuePropName="checked">
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
                {editingPayment ? 'Update' : 'Record'} Payment
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
