import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Table,
  Tag,
  Typography,
  Switch,
  Space,
  Popconfirm,
  Tooltip,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
  CheckCircleOutlined,
  LockOutlined,
} from "@ant-design/icons";
import {
  fetchTerms,
  createTerm,
  updateTerm,
  deleteTerm,
  validateTermData,
  fetchAcademicYears,
} from "../../api/academicApi";
import { showNotification, handleApiError } from "../../utils/notifications";

const { Title, Text } = Typography;
const { Option } = Select;

export default function TermManagementPage() {
  const [terms, setTerms] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTerm, setEditingTerm] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchTermsData(),
      fetchAcademicYearsData()
    ]);
  };

  const fetchTermsData = async () => {
    setLoading(true);
    try {
      const response = await fetchTerms();
      console.log("Terms response:", response);

      let termsData = [];
      if (response && response.data && Array.isArray(response.data.data)) {
        termsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        termsData = response.data;
      } else if (Array.isArray(response)) {
        termsData = response;
      }

      setTerms(termsData);
    } catch (error) {
      console.error("Error fetching terms:", error);
      handleApiError(error, "Failed to load terms");
    } finally {
      setLoading(false);
    }
  };

  const fetchAcademicYearsData = async () => {
    try {
      const response = await fetchAcademicYears();
      let yearsData = [];
      if (response && response.data && Array.isArray(response.data.data)) {
        yearsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        yearsData = response.data;
      } else if (Array.isArray(response)) {
        yearsData = response;
      }
      setAcademicYears(yearsData);
    } catch (error) {
      console.error("Error fetching academic years:", error);
    }
  };

  const handleCreate = () => {
    setEditingTerm(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (term) => {
    setEditingTerm(term);
    form.setFieldsValue({
      academic_year: term.academic_year,
      name: term.name,
      start_date: term.start_date ? new Date(term.start_date) : null,
      end_date: term.end_date ? new Date(term.end_date) : null,
      is_current: term.is_current,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteTerm(id);
      showNotification.success("Success", "Term deleted successfully!");
      fetchTermsData();
    } catch (error) {
      console.error("Error deleting term:", error);
      handleApiError(error, "Failed to delete term");
    }
  };

  const handleStatusToggle = async (term) => {
    try {
      await updateTerm(term.id, { is_current: !term.is_current });
      showNotification.success("Success", `Term ${term.is_current ? "marked as not current" : "marked as current"} successfully!`);
      fetchTermsData();
    } catch (error) {
      console.error("Error updating term status:", error);
      handleApiError(error, "Failed to update term status");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        start_date: values.start_date?.format('YYYY-MM-DD'),
        end_date: values.end_date?.format('YYYY-MM-DD'),
      };

      // Validate data
      const validation = validateTermData(data);
      if (!validation.isValid) {
        showNotification.error("Validation Error", validation.errors.join(', '));
        return;
      }

      if (editingTerm) {
        await updateTerm(editingTerm.id, data);
        showNotification.success("Success", "Term updated successfully!");
      } else {
        await createTerm(data);
        showNotification.success("Success", "Term created successfully!");
      }

      setIsModalVisible(false);
      fetchTermsData();
    } catch (error) {
      console.error("Error saving term:", error);
      handleApiError(error, "Failed to save term");
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const getStatusTag = (term) => {
    if (term.is_current) {
      return <Tag color="blue" icon={<CheckCircleOutlined />}>Current</Tag>;
    } else if (term.is_locked) {
      return <Tag color="red" icon={<LockOutlined />}>Locked</Tag>;
    } else {
      return <Tag color="default">Inactive</Tag>;
    }
  };

  const columns = [
    {
      title: "Academic Year",
      dataIndex: "academic_year_name",
      key: "academic_year_name",
      render: (name) => <Tag color="purple">{name}</Tag>,
    },
    {
      title: "Term",
      dataIndex: "name",
      key: "name",
      render: (name) => (
        <Space>
          <BookOutlined style={{ color: '#52c41a' }} />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: "Dates",
      key: "dates",
      render: (_, record) => (
        <div>
          <Text>{formatDate(record.start_date)} - {formatDate(record.end_date)}</Text>
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => getStatusTag(record),
    },
    {
      title: "Within Date Range",
      dataIndex: "is_within_date_range",
      key: "is_within_date_range",
      render: (isWithin) => isWithin ? <Tag color="green">Yes</Tag> : <Tag color="red">No</Tag>,
    },
    {
      title: "Current",
      dataIndex: "is_current",
      key: "is_current",
      render: (isCurrent, record) => (
        <Switch
          checked={isCurrent}
          onChange={() => handleStatusToggle(record)}
          size="small"
          checkedChildren="Current"
          unCheckedChildren="Not Current"
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Term"
            description="Are you sure you want to delete this term?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okType="danger"
          >
            <Tooltip title="Delete">
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="!mb-2">
            Term Management
          </Title>
          <Text type="secondary">
            Manage terms within academic years
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreate}
        >
          Add Term
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={terms}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} terms`,
          }}
        />
      </Card>

      {/* Modal for Create/Edit */}
      <Modal
        title={editingTerm ? "Edit Term" : "Create Term"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            is_current: false,
          }}
        >
          <Form.Item
            name="academic_year"
            label="Academic Year"
            rules={[{ required: true, message: 'Please select academic year' }]}
          >
            <Select placeholder="Select academic year">
              {academicYears.map(year => (
                <Option key={year.id} value={year.id}>{year.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="name"
            label="Term Name"
            rules={[{ required: true, message: 'Please select term name' }]}
          >
            <Select placeholder="Select term">
              <Option value="Term 1">Term 1</Option>
              <Option value="Term 2">Term 2</Option>
              <Option value="Term 3">Term 3</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="start_date"
            label="Start Date"
            rules={[{ required: true, message: 'Please select start date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="end_date"
            label="End Date"
            rules={[{ required: true, message: 'Please select end date' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="is_current" label="Current Term" valuePropName="checked">
            <Switch checkedChildren="Current" unCheckedChildren="Not Current" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}