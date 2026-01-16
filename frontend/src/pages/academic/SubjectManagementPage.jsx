import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Popconfirm,
  Tooltip,
  Modal,
  Form,
  Select,
  Input,
  Switch,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  BookOutlined,
} from "@ant-design/icons";
import {
  fetchSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} from "../../api/academicApi";
import { showNotification, handleApiError } from "../../utils/notifications";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function SubjectManagementPage() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchSubjectsData();
  }, []);

  const fetchSubjectsData = async () => {
    setLoading(true);
    try {
      const response = await fetchSubjects();
      console.log("Subjects response:", response);

      let subjectsData = [];
      if (response && response.data && Array.isArray(response.data.data)) {
        subjectsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        subjectsData = response.data;
      } else if (Array.isArray(response)) {
        subjectsData = response;
      }

      setSubjects(subjectsData);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      handleApiError(error, "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSubject(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    form.setFieldsValue({
      name: subject.name,
      code: subject.code,
      category: subject.category,
      description: subject.description,
      grade_levels: subject.grade_levels,
      is_compulsory: subject.is_compulsory,
      materials: subject.materials,
      is_active: subject.is_active,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteSubject(id);
      showNotification.success("Success", "Subject deleted successfully!");
      fetchSubjectsData();
    } catch (error) {
      console.error("Error deleting subject:", error);
      handleApiError(error, "Failed to delete subject");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      if (editingSubject) {
        await updateSubject(editingSubject.id, values);
        showNotification.success("Success", "Subject updated successfully!");
      } else {
        await createSubject(values);
        showNotification.success("Success", "Subject created successfully!");
      }

      setIsModalVisible(false);
      fetchSubjectsData();
    } catch (error) {
      console.error("Error saving subject:", error);
      handleApiError(error, "Failed to save subject");
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: "Subject",
      key: "subject",
      render: (_, record) => (
        <div>
          <Text strong>{record.name}</Text>
          {record.code && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Code: {record.code}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category) => {
        const categoryColors = {
          core: 'blue',
          elective: 'green',
          extracurricular: 'orange',
          language: 'purple',
        };
        return <Tag color={categoryColors[category] || 'default'}>{category}</Tag>;
      },
    },
    {
      title: "Compulsory",
      dataIndex: "is_compulsory",
      key: "is_compulsory",
      render: (isCompulsory) => (
        <Tag color={isCompulsory ? 'red' : 'default'}>
          {isCompulsory ? 'Yes' : 'No'}
        </Tag>
      ),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
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
            title="Delete Subject"
            description="Are you sure you want to delete this subject? This will also remove all related assignments."
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
            Subject Management
          </Title>
          <Text type="secondary">
            Create and manage subjects for your school
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreate}
        >
          Add Subject
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={subjects}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} subjects`,
          }}
        />
      </Card>

      {/* Modal for Create/Edit */}
      <Modal
        title={editingSubject ? "Edit Subject" : "Create Subject"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            category: 'core',
            is_compulsory: false,
            is_active: true,
            grade_levels: [],
          }}
        >
          <Form.Item
            name="name"
            label="Subject Name"
            rules={[{ required: true, message: 'Please enter subject name' }]}
          >
            <Input placeholder="e.g., Mathematics, English, Science" />
          </Form.Item>

          <Form.Item
            name="code"
            label="Subject Code"
          >
            <Input placeholder="e.g., MATH, ENG, SCI" />
          </Form.Item>

          <Form.Item
            name="category"
            label="Category"
            rules={[{ required: true, message: 'Please select category' }]}
          >
            <Select placeholder="Select category">
              <Option value="core">Core Subject</Option>
              <Option value="elective">Elective Subject</Option>
              <Option value="extracurricular">Extracurricular</Option>
              <Option value="language">Language</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea
              placeholder="Brief description of the subject"
              rows={3}
            />
          </Form.Item>



          <Form.Item
            name="is_compulsory"
            label="Is Compulsory"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="materials"
            label="Required Materials"
          >
            <TextArea
              placeholder="Textbooks, materials, or resources needed"
              rows={2}
            />
          </Form.Item>

          <Form.Item
            name="is_active"
            label="Is Active"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
