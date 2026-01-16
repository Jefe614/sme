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
  Select,
  DatePicker,
  InputNumber,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  LockOutlined,
  UnlockOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import {
  fetchExams,
  createExam,
  updateExam,
  deleteExam,
  lockExam,
  validateExamData,
} from "../../api/examApi";
import { fetchAcademicYears } from "../../api/academicApi";
import { fetchTerms } from "../../api/academicApi";
import { getClasses } from "../../api/auth";
import { showNotification, handleApiError } from "../../utils/notifications";

const { Title, Text } = Typography;
const { Option } = Select;

export default function ExamManagementPage() {
  const [exams, setExams] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [examsRes, academicYearsRes, termsRes, classesRes] = await Promise.all([
        fetchExams(),
        fetchAcademicYears(),
        fetchTerms(),
        getClasses(),
      ]);

      setExams(examsRes.data || []);
      setAcademicYears(academicYearsRes.data || []);
      setTerms(termsRes.data || []);
      setClasses(classesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      handleApiError(error, "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchExamsData = async () => {
    try {
      const response = await fetchExams();
      setExams(response.data || []);
    } catch (error) {
      console.error("Error fetching exams:", error);
      handleApiError(error, "Failed to load exams");
    }
  };

  const handleCreate = () => {
    setEditingExam(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (exam) => {
    setEditingExam(exam);
    form.setFieldsValue({
      name: exam.name,
      exam_type: exam.exam_type,
      academic_year: exam.academic_year,
      term: exam.term,
      student_class: exam.student_class,
      total_marks: exam.total_marks,
      weight_percentage: exam.weight_percentage,
      exam_date: exam.exam_date ? new Date(exam.exam_date) : null,
      results_publish_date: exam.results_publish_date ? new Date(exam.results_publish_date) : null,
      notes: exam.notes,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteExam(id);
      showNotification.success("Success", "Exam deleted successfully!");
      fetchExamsData();
    } catch (error) {
      console.error("Error deleting exam:", error);
      handleApiError(error, "Failed to delete exam");
    }
  };

  const handleLockToggle = async (exam) => {
    try {
      const action = exam.is_locked ? 'unlock' : 'lock';
      await lockExam(exam.id, action);
      showNotification.success("Success", `Exam ${action}ed successfully!`);
      fetchExamsData();
    } catch (error) {
      console.error("Error toggling exam lock:", error);
      handleApiError(error, "Failed to toggle exam lock");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        exam_date: values.exam_date?.format('YYYY-MM-DD'),
        results_publish_date: values.results_publish_date?.format('YYYY-MM-DD'),
      };

      // Validate data
      const validation = validateExamData(data);
      if (!validation.isValid) {
        showNotification.error("Validation Error", validation.errors.join(', '));
        return;
      }

      if (editingExam) {
        await updateExam(editingExam.id, data);
        showNotification.success("Success", "Exam updated successfully!");
      } else {
        await createExam(data);
        showNotification.success("Success", "Exam created successfully!");
      }

      setIsModalVisible(false);
      fetchExamsData();
    } catch (error) {
      console.error("Error saving exam:", error);
      handleApiError(error, "Failed to save exam");
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

  const getExamTypeTag = (examType) => {
    const typeColors = {
      'cat1': 'blue',
      'cat2': 'cyan',
      'mid_term': 'orange',
      'end_term': 'red',
      'custom': 'purple',
    };
    return <Tag color={typeColors[examType] || 'default'}>{examType.replace('_', ' ').toUpperCase()}</Tag>;
  };

  const getStatusTag = (exam) => {
    if (exam.is_locked) {
      return <Tag color="red" icon={<LockOutlined />}>Locked</Tag>;
    } else if (exam.is_published) {
      return <Tag color="green" icon={<CheckCircleOutlined />}>Published</Tag>;
    } else {
      return <Tag color="default" icon={<ClockCircleOutlined />}>Draft</Tag>;
    }
  };

  const columns = [
    {
      title: "Exam Details",
      key: "details",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.name}</Text>
          <Space>
            {getExamTypeTag(record.exam_type)}
            {getStatusTag(record)}
          </Space>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.term_name} - {record.academic_year_name}
          </Text>
        </Space>
      ),
      width: 250,
    },
    {
      title: "Class",
      dataIndex: "student_class_name",
      key: "class",
      render: (className) => className || "Whole School",
    },
    {
      title: "Marks",
      key: "marks",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text>Total: {record.total_marks}</Text>
          <Text type="secondary">Weight: {record.weight_percentage}%</Text>
        </Space>
      ),
    },
    {
      title: "Dates",
      key: "dates",
      render: (_, record) => (
        <Space direction="vertical" size="small">
          <Text>Exam: {formatDate(record.exam_date)}</Text>
          <Text type="secondary">Results: {formatDate(record.results_publish_date)}</Text>
        </Space>
      ),
    },
    {
      title: "Entries",
      dataIndex: "marks_count",
      key: "entries",
      render: (count) => count || 0,
    },
    {
      title: "Actions",
      key: "actions",
      fixed: 'right',
      width: 150,
      render: (_, record) => (
        <Space>
          <Tooltip title={record.is_locked ? "Unlock Exam" : "Lock Exam"}>
            <Button
              icon={record.is_locked ? <UnlockOutlined /> : <LockOutlined />}
              size="small"
              onClick={() => handleLockToggle(record)}
              type={record.is_locked ? "default" : "primary"}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
              disabled={record.is_locked}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Exam"
            description="Are you sure you want to delete this exam?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okType="danger"
            disabled={record.is_locked}
          >
            <Tooltip title="Delete">
              <Button
                icon={<DeleteOutlined />}
                size="small"
                danger
                disabled={record.is_locked}
              />
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
            <FileTextOutlined className="mr-2" />
            Exam Management
          </Title>
          <Text type="secondary">
            Create and manage exams, assessments, and tests
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreate}
        >
          Create Exam
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={exams}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} exams`,
          }}
        />
      </Card>

      {/* Modal for Create/Edit */}
      <Modal
        title={editingExam ? "Edit Exam" : "Create Exam"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={700}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            exam_type: 'end_term',
            total_marks: 100,
            weight_percentage: 100,
          }}
        >
          <Form.Item
            name="name"
            label="Exam Name"
            rules={[{ required: true, message: 'Please enter exam name' }]}
          >
            <Input placeholder="e.g., End Term Exam, CAT 1" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="exam_type"
              label="Exam Type"
              rules={[{ required: true, message: 'Please select exam type' }]}
            >
              <Select placeholder="Select exam type">
                <Option value="cat1">CAT 1</Option>
                <Option value="cat2">CAT 2</Option>
                <Option value="mid_term">Mid Term</Option>
                <Option value="end_term">End Term</Option>
                <Option value="custom">Custom</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="total_marks"
              label="Total Marks"
              rules={[{ required: true, message: 'Please enter total marks' }]}
            >
              <InputNumber
                min={1}
                max={1000}
                style={{ width: '100%' }}
                placeholder="100"
              />
            </Form.Item>
          </div>

          <Divider orientation="left">Academic Context</Divider>

          <div className="grid grid-cols-2 gap-4">
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
              name="term"
              label="Term"
              rules={[{ required: true, message: 'Please select term' }]}
            >
              <Select placeholder="Select term">
                {terms.map(term => (
                  <Option key={term.id} value={term.id}>{term.name}</Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <Form.Item
            name="student_class"
            label="Class (Optional - leave empty for whole school)"
          >
            <Select placeholder="Select class" allowClear>
              {classes.map(cls => (
                <Option key={cls.id} value={cls.id}>{cls.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Divider orientation="left">Weight & Dates</Divider>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="weight_percentage"
              label="Weight Percentage"
              rules={[{ required: true, message: 'Please enter weight percentage' }]}
            >
              <InputNumber
                min={1}
                max={100}
                style={{ width: '100%' }}
                placeholder="100"
                addonAfter="%"
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item
              name="exam_date"
              label="Exam Date"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
              name="results_publish_date"
              label="Results Publish Date"
            >
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </div>

          <Form.Item
            name="notes"
            label="Notes"
          >
            <Input.TextArea
              rows={3}
              placeholder="Additional notes or instructions"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
