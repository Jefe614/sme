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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";
import {
  fetchAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  validateAcademicYearData,
} from "../../api/academicApi";
import { showNotification, handleApiError } from "../../utils/notifications";

const { Title, Text } = Typography;

export default function AcademicYearManagementPage() {
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAcademicYearsData();
  }, []);

  const fetchAcademicYearsData = async () => {
    setLoading(true);
    try {
      const response = await fetchAcademicYears();
      console.log("Academic years response:", response);

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
      handleApiError(error, "Failed to load academic years");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingYear(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (year) => {
    setEditingYear(year);
    form.setFieldsValue({
      name: year.name,
      start_date: year.start_date ? new Date(year.start_date) : null,
      end_date: year.end_date ? new Date(year.end_date) : null,
      is_active: year.is_active,
      is_archived: year.is_archived,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteAcademicYear(id);
      showNotification.success("Success", "Academic year deleted successfully!");
      fetchAcademicYearsData();
    } catch (error) {
      console.error("Error deleting academic year:", error);
      handleApiError(error, "Failed to delete academic year");
    }
  };

  const handleStatusToggle = async (year) => {
    try {
      await updateAcademicYear(year.id, { is_active: !year.is_active });
      showNotification.success("Success", `Academic year ${year.is_active ? "deactivated" : "activated"} successfully!`);
      fetchAcademicYearsData();
    } catch (error) {
      console.error("Error updating academic year status:", error);
      handleApiError(error, "Failed to update academic year status");
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
      const validation = validateAcademicYearData(data);
      if (!validation.isValid) {
        showNotification.error("Validation Error", validation.errors.join(', '));
        return;
      }

      if (editingYear) {
        await updateAcademicYear(editingYear.id, data);
        showNotification.success("Success", "Academic year updated successfully!");
      } else {
        await createAcademicYear(data);
        showNotification.success("Success", "Academic year created successfully!");
      }

      setIsModalVisible(false);
      fetchAcademicYearsData();
    } catch (error) {
      console.error("Error saving academic year:", error);
      handleApiError(error, "Failed to save academic year");
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

  const getStatusTag = (year) => {
    if (year.is_active) {
      return <Tag color="green" icon={<CheckCircleOutlined />}>Active</Tag>;
    } else if (year.is_archived) {
      return <Tag color="orange">Archived</Tag>;
    } else {
      return <Tag color="default">Inactive</Tag>;
    }
  };

  const columns = [
    {
      title: "Academic Year",
      dataIndex: "name",
      key: "name",
      render: (name, record) => (
        <Space>
          <CalendarOutlined style={{ color: '#1890ff' }} />
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {formatDate(record.start_date)} - {formatDate(record.end_date)}
            </Text>
          </div>
        </Space>
      ),
      fixed: 'left',
      width: 200,
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => getStatusTag(record),
    },
    {
      title: "Terms",
      dataIndex: "terms_count",
      key: "terms_count",
      render: (count) => count || 0,
    },
    {
      title: "Current Year",
      dataIndex: "is_current_year",
      key: "is_current_year",
      render: (isCurrent) => isCurrent ? <Tag color="blue">Current</Tag> : '-',
    },
    {
      title: "Active",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={() => handleStatusToggle(record)}
          size="small"
          checkedChildren="Active"
          unCheckedChildren="Inactive"
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
            title="Delete Academic Year"
            description="Are you sure you want to delete this academic year?"
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
            Academic Year Management
          </Title>
          <Text type="secondary">
            Manage academic years and their terms
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreate}
        >
          Add Academic Year
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={academicYears}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} academic years`,
          }}
        />
      </Card>

      {/* Modal for Create/Edit */}
      <Modal
        title={editingYear ? "Edit Academic Year" : "Create Academic Year"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            is_active: false,
            is_archived: false,
          }}
        >
          <Form.Item
            name="name"
            label="Academic Year Name"
            rules={[{ required: true, message: 'Please enter academic year name' }]}
          >
            <Input placeholder="e.g., 2024-2025" />
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

          <Form.Item name="is_active" label="Active" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>

          <Form.Item name="is_archived" label="Archived" valuePropName="checked">
            <Switch checkedChildren="Archived" unCheckedChildren="Not Archived" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
