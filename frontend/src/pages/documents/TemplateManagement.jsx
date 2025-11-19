import React, { useState, useEffect } from 'react';
import { Button, Table, Tag, Input, Select, Space, Modal, Form, message, Card, Typography, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  fetchTemplateCategories,
} from '../../api/templatesApi';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const TemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({});
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, [pagination.current, filters]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        pageSize: pagination.pageSize,
        current: pagination.current,
      };
      const response = await fetchTemplates(params);
      setTemplates(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
      }));
    } catch (error) {
      message.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetchTemplateCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    form.setFieldsValue(template);
    setIsModalVisible(true);
  };

  const handleDelete = async (templateId) => {
    Modal.confirm({
      title: 'Delete Template',
      content: 'Are you sure you want to delete this template?',
      onOk: async () => {
        try {
          await deleteTemplate(templateId);
          message.success('Template deleted successfully');
          loadTemplates();
        } catch (error) {
          message.error('Failed to delete template');
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, values);
        message.success('Template updated successfully');
      } else {
        await createTemplate(values);
        message.success('Template created successfully');
      }
      setIsModalVisible(false);
      loadTemplates();
    } catch (error) {
      if (error.response?.data?.error) {
        message.error(error.response.data.error);
      } else {
        message.error('Failed to save template');
      }
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, q: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleCategoryFilter = (value) => {
    setFilters(prev => ({ ...prev, category: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const getCategoryTag = (category) => {
    const categoryLabels = {
      admission: 'Admission',
      transfer: 'Transfer',
      warning: 'Warning',
      suspension: 'Suspension',
      fee_reminder: 'Fee Reminder',
      clearance: 'Clearance',
      invitation: 'Invitation',
      notice: 'Notice',
      recommendation: 'Recommendation',
      employment: 'Employment',
      custom: 'Custom',
    };

    const colors = {
      admission: 'blue',
      transfer: 'green',
      warning: 'orange',
      suspension: 'red',
      fee_reminder: 'purple',
      clearance: 'cyan',
      invitation: 'magenta',
      notice: 'geekblue',
      recommendation: 'lime',
      employment: 'gold',
      custom: 'default',
    };

    return (
      <Tag color={colors[category] || 'default'}>
        {categoryLabels[category] || category}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => getCategoryTag(category),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description) => (
        <Tooltip title={description}>
          <span>{description && description.length > 50 ? `${description.substring(0, 50)}...` : description}</span>
        </Tooltip>
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
      title: 'Default',
      dataIndex: 'is_default',
      key: 'is_default',
      render: (isDefault) => (
        <Tag color={isDefault ? 'blue' : 'default'}>
          {isDefault ? 'System Default' : 'Custom'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit Template">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="Preview Template">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                Modal.info({
                  title: record.name,
                  width: 800,
                  content: (
                    <div style={{ maxHeight: '400px', overflow: 'auto' }}>
                      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                        {record.template_body}
                      </pre>
                    </div>
                  ),
                });
              }}
            />
          </Tooltip>
          {!record.is_default && (
            <Tooltip title="Delete Template">
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
                onClick={() => handleDelete(record.id)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <Title level={3}>Document Templates</Title>
            <p>Manage reusable document templates for school communications</p>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreate}
          >
            Create Template
          </Button>
        </div>

        <Space style={{ marginBottom: 16 }}>
          <Input.Search
            placeholder="Search templates..."
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          <Select
            placeholder="Filter by category"
            allowClear
            style={{ width: 200 }}
            onChange={handleCategoryFilter}
          >
            {categories.map((category) => (
              <Option key={category.value} value={category.value}>
                {category.label}
              </Option>
            ))}
          </Select>
        </Space>

        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} templates`,
          }}
          onChange={handleTableChange}
        />

        <Modal
          title={editingTemplate ? 'Edit Template' : 'Create Template'}
          open={isModalVisible}
          onOk={handleModalOk}
          onCancel={handleModalCancel}
          width={800}
          okText={editingTemplate ? 'Update' : 'Create'}
        >
          <Form form={form} layout="vertical">
            <Form.Item
              name="name"
              label="Template Name"
              rules={[{ required: true, message: 'Please enter template name' }]}
            >
              <Input placeholder="e.g., Admission Letter 2024" />
            </Form.Item>

            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: 'Please select a category' }]}
            >
              <Select placeholder="Select category">
                {categories.map((category) => (
                  <Option key={category.value} value={category.value}>
                    {category.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              name="description"
              label="Description"
              rules={[{ required: true, message: 'Please enter description' }]}
            >
              <TextArea
                placeholder="Brief description of the template purpose"
                rows={2}
              />
            </Form.Item>

            <Form.Item
              name="template_body"
              label="Template Body"
              rules={[{ required: true, message: 'Please enter template content' }]}
            >
              <TextArea
                placeholder="Enter the template content with {{placeholders}}"
                rows={12}
                style={{ fontFamily: 'monospace' }}
              />
            </Form.Item>

            <Form.Item
              name="is_active"
              label="Active"
              valuePropName="checked"
            >
              <input type="checkbox" />
            </Form.Item>
          </Form>
        </Modal>
      </Card>
    </div>
  );
};

export default TemplateManagement;
