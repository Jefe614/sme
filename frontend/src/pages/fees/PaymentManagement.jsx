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
  Divider,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  EyeOutlined,
  PrinterOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
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
  const { user } = useContext(AuthContext);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [receiptModalVisible, setReceiptModalVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [currentReceipt, setCurrentReceipt] = useState(null);
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

      let response;
      if (editingPayment) {
        response = await updateFeePayment(editingPayment.id, data);
        message.success('Fee payment updated successfully');
      } else {
        response = await createFeePayment(data);
        console.log('Fee payment created successfully');
        message.success('Fee payment recorded successfully');
      }

      setModalVisible(false);
      fetchPayments(pagination.current, pagination.pageSize, searchText);

      // Show receipt for new payments
      if (!editingPayment && response?.data) {
        const paymentData = response.data;
        // Find student and fee structure details
        const student = students.find(s => s.id === paymentData.student);
        const feeStructure = feeStructures.find(fs => fs.id === paymentData.fee_structure);

        setCurrentReceipt({
          ...paymentData,
          student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown Student',
          admission_number: student?.admission_number || '',
          class_name: student?.student_class ? `${student.student_class.grade_level} ${student.student_class.section}` : '',
          fee_structure_name: feeStructure?.name || 'General Fee',
          company_name: user?.company?.name || 'School Management System',
        });
        setReceiptModalVisible(true);
      }
    } catch (error) {
      console.error('Failed to save fee payment:', error);
      message.error('Failed to save fee payment');
    }
  };

  const handleViewReceipt = (record) => {
    // Find student and fee structure details for existing payments
    const student = students.find(s => s.id === record.student);
    const feeStructure = feeStructures.find(fs => fs.id === record.fee_structure);

    setCurrentReceipt({
      ...record,
      student_name: record.student_name || (student ? `${student.first_name} ${student.last_name}` : 'Unknown Student'),
      admission_number: record.admission_number || student?.admission_number || '',
      class_name: record.class_name || (student?.student_class ? `${student.student_class.grade_level} ${student.student_class.section}` : ''),
      fee_structure_name: feeStructure?.name || 'General Fee',
      company_name: user?.company?.name || 'School Management System',
    });
    setReceiptModalVisible(true);
  };

  const handlePrintReceipt = () => {
    window.print();
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
            onClick={() => handleViewReceipt(record)}
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

      {/* Receipt Modal */}
      <Modal
        title={
          <div className="text-center">
            <Title level={3} className="!mb-0">Payment Receipt</Title>
            <div className="text-gray-500 text-sm">Official School Receipt</div>
          </div>
        }
        open={receiptModalVisible}
        onCancel={() => setReceiptModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setReceiptModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="print"
            type="primary"
            icon={<PrinterOutlined />}
            onClick={handlePrintReceipt}
          >
            Print Receipt
          </Button>,
        ]}
        width={800}
        className="receipt-modal"
      >
        {currentReceipt && (
          <div className="receipt-container bg-white p-8 border-2 border-gray-300 rounded-lg">
            {/* School Header */}
            <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
              <div className="text-2xl font-bold text-blue-800 mb-2">
                {currentReceipt.company_name}
              </div>
              <div className="text-sm text-gray-600 mb-1">
                School Management System
              </div>
              <div className="text-xs text-gray-500">
                Nairobi, Kenya | Tel: +254 XXX XXX XXX
              </div>
            </div>

            {/* Receipt Title */}
            <div className="text-center mb-6">
              <div className="text-xl font-bold text-gray-800 mb-2">
                OFFICIAL RECEIPT
              </div>
              <div className="flex justify-between items-center">
                <div className="text-sm">
                  <strong>Receipt No:</strong> {currentReceipt.receipt_number}
                </div>
                <div className="text-sm">
                  <strong>Date:</strong> {moment(currentReceipt.payment_date).format('DD/MM/YYYY')}
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className="mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <Title level={5} className="!mb-3">Student Information</Title>
                <Row gutter={[16, 8]}>
                  <Col xs={12}>
                    <div className="text-sm">
                      <strong>Name:</strong> {currentReceipt.student_name}
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div className="text-sm">
                      <strong>Admission No:</strong> {currentReceipt.admission_number}
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div className="text-sm">
                      <strong>Class:</strong> {currentReceipt.class_name || 'N/A'}
                    </div>
                  </Col>
                  <Col xs={12}>
                    <div className="text-sm">
                      <strong>Fee Structure:</strong> {currentReceipt.fee_structure_name}
                    </div>
                  </Col>
                </Row>
              </div>
            </div>

            {/* Payment Details */}
            <div className="mb-6">
              <Title level={5} className="!mb-3">Payment Details</Title>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="text-left p-3 font-semibold border-r">Description</th>
                      <th className="text-right p-3 font-semibold">Amount (KES)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="p-3 border-r">
                        {currentReceipt.fee_structure_name} - {currentReceipt.is_installment ? 'Installment' : 'Full'} Payment
                        {currentReceipt.transaction_id && (
                          <div className="text-xs text-gray-500 mt-1">
                            Transaction ID: {currentReceipt.transaction_id}
                          </div>
                        )}
                      </td>
                      <td className="p-3 text-right font-semibold">
                        {currentReceipt.amount_paid?.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                    {currentReceipt.due_amount > 0 && (
                      <tr className="border-t bg-gray-50">
                        <td className="p-3 border-r font-medium">Balance</td>
                        <td className="p-3 text-right">
                          {(currentReceipt.due_amount - currentReceipt.amount_paid)?.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t bg-blue-50">
                      <td className="p-3 border-r font-bold text-blue-800">Total Paid</td>
                      <td className="p-3 text-right font-bold text-blue-800 text-lg">
                        {currentReceipt.amount_paid?.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment Information */}
            <Row gutter={[16, 16]} className="mb-6">
              <Col xs={12}>
                <div className="text-sm">
                  <strong>Payment Method:</strong> {currentReceipt.payment_method?.replace('_', ' ').toUpperCase()}
                </div>
              </Col>
              <Col xs={12}>
                <div className="text-sm">
                  <strong>Payment Status:</strong>
                  <Tag color={currentReceipt.payment_status === 'completed' ? 'green' : 'orange'} className="ml-2">
                    {currentReceipt.payment_status?.toUpperCase()}
                  </Tag>
                </div>
              </Col>
              {currentReceipt.paid_by && (
                <Col xs={12}>
                  <div className="text-sm">
                    <strong>Paid By:</strong> {currentReceipt.paid_by}
                  </div>
                </Col>
              )}
              {currentReceipt.balance !== undefined && (
                <Col xs={12}>
                  <div className="text-sm">
                    <strong>Outstanding Balance:</strong> KES {currentReceipt.balance?.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                  </div>
                </Col>
              )}
            </Row>

            {currentReceipt.notes && (
              <div className="mb-6">
                <div className="text-sm">
                  <strong>Notes:</strong> {currentReceipt.notes}
                </div>
              </div>
            )}

            {/* Footer */}
            <Divider />
            <div className="flex justify-between items-end">
              <div className="text-center flex-1">
                <div className="mb-2">
                  <CheckCircleOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
                </div>
                <div className="text-sm font-semibold">Payment Received</div>
                <div className="text-xs text-gray-500">
                  This receipt is computer generated and invalid without signature/stamp
                </div>
              </div>
              <div className="text-center">
                <div className="border-t border-gray-400 pt-2 min-w-48">
                  <div className="text-sm font-semibold">Authorized Signature/stamp</div>
                  <div className="text-xs text-gray-500 mt-6">___________________________</div>
                  <div className="text-xs text-gray-500">Accountant/Bursar</div>
                </div>
              </div>
            </div>


          </div>
        )}
      </Modal>
    </div>
  );
}
