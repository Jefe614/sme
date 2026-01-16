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
  Input,
  Select,
  Switch,
  Divider,
  Row,
  Col,
  InputNumber,
  List,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  StarOutlined,
} from "@ant-design/icons";
import {
  fetchGradingSystems,
  createGradingSystem,
  updateGradingSystem,
  deleteGradingSystem,
  validateGradingSystemData,
} from "../../api/examApi";
import { showNotification, handleApiError } from "../../utils/notifications";

const { Title, Text } = Typography;
const { Option } = Select;

export default function GradingSystemManagementPage() {
  const [gradingSystems, setGradingSystems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSystem, setEditingSystem] = useState(null);
  const [form] = Form.useForm();
  const [gradingScale, setGradingScale] = useState([]);

  useEffect(() => {
    fetchGradingSystemsData();
  }, []);

  const fetchGradingSystemsData = async () => {
    setLoading(true);
    try {
      const response = await fetchGradingSystems();
      setGradingSystems(response.data || []);
    } catch (error) {
      console.error("Error fetching grading systems:", error);
      handleApiError(error, "Failed to load grading systems");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSystem(null);
    form.resetFields();
    setGradingScale([]);
    setIsModalVisible(true);
  };

  const handleEdit = (system) => {
    setEditingSystem(system);
    form.setFieldsValue({
      name: system.name,
      grading_type: system.grading_type,
      is_default: system.is_default,
    });
    setGradingScale(system.grading_scale || []);
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteGradingSystem(id);
      showNotification.success("Success", "Grading system deleted successfully!");
      fetchGradingSystemsData();
    } catch (error) {
      console.error("Error deleting grading system:", error);
      handleApiError(error, "Failed to delete grading system");
    }
  };

  const handleSetDefault = async (system) => {
    try {
      await updateGradingSystem(system.id, { is_default: true });
      showNotification.success("Success", `${system.name} set as default grading system!`);
      fetchGradingSystemsData();
    } catch (error) {
      console.error("Error setting default grading system:", error);
      handleApiError(error, "Failed to set default grading system");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        grading_scale: gradingScale,
      };

      // Validate data
      const validation = validateGradingSystemData(data);
      if (!validation.isValid) {
        showNotification.error("Validation Error", validation.errors.join(', '));
        return;
      }

      if (editingSystem) {
        await updateGradingSystem(editingSystem.id, data);
        showNotification.success("Success", "Grading system updated successfully!");
      } else {
        await createGradingSystem(data);
        showNotification.success("Success", "Grading system created successfully!");
      }

      setIsModalVisible(false);
      fetchGradingSystemsData();
    } catch (error) {
      console.error("Error saving grading system:", error);
      handleApiError(error, "Failed to save grading system");
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
    setGradingScale([]);
  };

  const addGradeRule = () => {
    const gradingType = form.getFieldValue('grading_type');
    if (gradingType === '8-4-4') {
      setGradingScale([...gradingScale, {
        min_mark: 0,
        max_mark: 100,
        grade: '',
        points: 0
      }]);
    } else if (gradingType === 'cbc') {
      setGradingScale([...gradingScale, {
        level: '',
        description: ''
      }]);
    }
  };

  const updateGradeRule = (index, field, value) => {
    const updatedScale = [...gradingScale];
    updatedScale[index][field] = value;
    setGradingScale(updatedScale);
  };

  const removeGradeRule = (index) => {
    setGradingScale(gradingScale.filter((_, i) => i !== index));
  };

  const getGradingTypeTag = (type) => {
    const typeColors = {
      '8-4-4': 'blue',
      'cbc': 'green',
      'custom': 'purple',
    };
    return <Tag color={typeColors[type] || 'default'}>{type.toUpperCase()}</Tag>;
  };

  const renderGradingScale = (scale, type) => {
    if (type === '8-4-4') {
      return scale
        .sort((a, b) => b.min_mark - a.min_mark)
        .map((grade) => `${grade.min_mark}-${grade.max_mark}: ${grade.grade} (${grade.points} pts)`)
        .join(', ');
    } else if (type === 'cbc') {
      return scale.map(level => level.level).join(', ');
    }
    return '';
  };

  const columns = [
    {
      title: "Grading System",
      key: "system",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Space>
            <Text strong>{record.name}</Text>
            {record.is_default && <StarOutlined style={{ color: '#faad14' }} />}
          </Space>
          <Space>
            {getGradingTypeTag(record.grading_type)}
            {record.is_default && <Tag color="gold">Default</Tag>}
          </Space>
        </Space>
      ),
      width: 250,
    },
    {
      title: "Grading Scale",
      dataIndex: "grading_scale",
      key: "grading_scale",
      render: (scale, record) => (
        <Text ellipsis={{ tooltip: renderGradingScale(scale, record.grading_type) }}>
          {renderGradingScale(scale, record.grading_type)}
        </Text>
      ),
    },
    {
      title: "Rules Count",
      key: "rules_count",
      render: (_, record) => record.grading_scale?.length || 0,
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
      width: 180,
      render: (_, record) => (
        <Space>
          {!record.is_default && (
            <Tooltip title="Set as Default">
              <Button
                icon={<StarOutlined />}
                size="small"
                onClick={() => handleSetDefault(record)}
              />
            </Tooltip>
          )}
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Grading System"
            description="Are you sure you want to delete this grading system?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okType="danger"
            disabled={record.is_default}
          >
            <Tooltip title={record.is_default ? "Cannot delete default system" : "Delete"}>
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
                disabled={record.is_default}
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const renderGradeRuleForm = (rule, index) => {
    const gradingType = form.getFieldValue('grading_type');

    if (gradingType === '8-4-4') {
      return (
        <Row gutter={16} key={index} align="middle">
          <Col span={4}>
            <InputNumber
              placeholder="Min"
              value={rule.min_mark}
              onChange={(value) => updateGradeRule(index, 'min_mark', value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <InputNumber
              placeholder="Max"
              value={rule.max_mark}
              onChange={(value) => updateGradeRule(index, 'max_mark', value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Input
              placeholder="Grade (A, B+)"
              value={rule.grade}
              onChange={(e) => updateGradeRule(index, 'grade', e.target.value)}
            />
          </Col>
          <Col span={4}>
            <InputNumber
              placeholder="Points"
              value={rule.points}
              onChange={(value) => updateGradeRule(index, 'points', value)}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={4}>
            <Text type="secondary">
              {rule.min_mark}-{rule.max_mark}: {rule.grade} ({rule.points} pts)
            </Text>
          </Col>
          <Col span={4}>
            <Button
              type="link"
              danger
              onClick={() => removeGradeRule(index)}
            >
              Remove
            </Button>
          </Col>
        </Row>
      );
    } else if (gradingType === 'cbc') {
      return (
        <Row gutter={16} key={index} align="middle">
          <Col span={8}>
            <Input
              placeholder="Level (Exceeding Expectations)"
              value={rule.level}
              onChange={(e) => updateGradeRule(index, 'level', e.target.value)}
            />
          </Col>
          <Col span={12}>
            <Input
              placeholder="Description"
              value={rule.description}
              onChange={(e) => updateGradeRule(index, 'description', e.target.value)}
            />
          </Col>
          <Col span={4}>
            <Button
              type="link"
              danger
              onClick={() => removeGradeRule(index)}
            >
              Remove
            </Button>
          </Col>
        </Row>
      );
    }
    return null;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="!mb-2">
            <SettingOutlined className="mr-2" />
            Grading System Management
          </Title>
          <Text type="secondary">
            Configure grading scales and systems for your school
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreate}
        >
          Create Grading System
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={gradingSystems}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} grading systems`,
          }}
        />
      </Card>

      {/* Modal for Create/Edit */}
      <Modal
        title={editingSystem ? "Edit Grading System" : "Create Grading System"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            grading_type: '8-4-4',
            is_default: false,
          }}
        >
          <Form.Item
            name="name"
            label="System Name"
            rules={[{ required: true, message: 'Please enter grading system name' }]}
          >
            <Input placeholder="e.g., KCSE Grading, CBC Primary" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="grading_type"
                label="Grading Type"
                rules={[{ required: true, message: 'Please select grading type' }]}
              >
                <Select placeholder="Select grading type">
                  <Option value="8-4-4">8-4-4 System (Marks & Grades)</Option>
                  <Option value="cbc">CBC System (Competency Levels)</Option>
                  <Option value="custom">Custom Grading</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="is_default" label="Set as Default" valuePropName="checked">
                <Switch checkedChildren="Default" unCheckedChildren="Not Default" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">Grading Scale Configuration</Divider>

          <Form.Item label="Grade Rules">
            <div className="space-y-4">
              {gradingScale.map((rule, index) => renderGradeRuleForm(rule, index))}
            </div>
            <Button
              type="dashed"
              onClick={addGradeRule}
              className="mt-4"
              block
            >
              <PlusOutlined /> Add Grade Rule
            </Button>
          </Form.Item>

          <div className="mt-4 p-4 bg-gray-50 rounded">
            <Text strong>Preview:</Text>
            <div className="mt-2">
              <Text>
                {renderGradingScale(gradingScale, form.getFieldValue('grading_type'))}
              </Text>
            </div>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
