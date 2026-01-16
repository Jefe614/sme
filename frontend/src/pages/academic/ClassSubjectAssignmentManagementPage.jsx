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
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  BookOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  fetchClassSubjectAssignments,
  createClassSubjectAssignment,
  updateClassSubjectAssignment,
  deleteClassSubjectAssignment,
  validateClassSubjectAssignmentData,
  fetchAcademicYears,
} from "../../api/academicApi";
import { getStaff } from "../../api/auth";
import { showNotification, handleApiError } from "../../utils/notifications";

const { Title, Text } = Typography;
const { Option } = Select;

export default function ClassSubjectAssignmentManagementPage() {
  const [assignments, setAssignments] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    await Promise.all([
      fetchAssignmentsData(),
      fetchReferenceData()
    ]);
  };

  const fetchAssignmentsData = async () => {
    setLoading(true);
    try {
      const response = await fetchClassSubjectAssignments();
      console.log("Assignments response:", response);

      let assignmentsData = [];
      if (response && response.data && Array.isArray(response.data.data)) {
        assignmentsData = response.data.data;
      } else if (Array.isArray(response.data)) {
        assignmentsData = response.data;
      } else if (Array.isArray(response)) {
        assignmentsData = response;
      }

      setAssignments(assignmentsData);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      handleApiError(error, "Failed to load class-subject assignments");
    } finally {
      setLoading(false);
    }
  };

  const fetchReferenceData = async () => {
    try {
      const [academicYearsRes, staffRes] = await Promise.all([
        fetchAcademicYears(),
        getStaff()
      ]);

      // Set academic years
      let yearsData = [];
      if (academicYearsRes && academicYearsRes.data && Array.isArray(academicYearsRes.data.data)) {
        yearsData = academicYearsRes.data.data;
      } else if (Array.isArray(academicYearsRes.data)) {
        yearsData = academicYearsRes.data;
      } else if (Array.isArray(academicYearsRes)) {
        yearsData = academicYearsRes;
      }
      setAcademicYears(yearsData);

      // Set staff
      let staffData = [];
      if (staffRes && staffRes.data && Array.isArray(staffRes.data.data)) {
        staffData = staffRes.data.data;
      } else if (Array.isArray(staffRes.data)) {
        staffData = staffRes.data;
      } else if (Array.isArray(staffRes)) {
        staffData = staffRes;
      }
      setStaff(staffData);

      // For now, use mock data for classes and subjects
      // In a real implementation, you would fetch these from your API
      setClasses([
        { id: 1, name: "Grade 1A" },
        { id: 2, name: "Grade 1B" },
        { id: 3, name: "Grade 2A" },
      ]);

      setSubjects([
        { id: 1, name: "Mathematics", code: "MATH" },
        { id: 2, name: "English", code: "ENG" },
        { id: 3, name: "Science", code: "SCI" },
      ]);

    } catch (error) {
      console.error("Error fetching reference data:", error);
    }
  };

  const handleCreate = () => {
    setEditingAssignment(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    form.setFieldsValue({
      academic_year: assignment.academic_year,
      student_class: assignment.student_class,
      subject: assignment.subject,
      teacher: assignment.teacher,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteClassSubjectAssignment(id);
      showNotification.success("Success", "Assignment deleted successfully!");
      fetchAssignmentsData();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      handleApiError(error, "Failed to delete assignment");
    }
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();

      // Validate data
      const validation = validateClassSubjectAssignmentData(values);
      if (!validation.isValid) {
        showNotification.error("Validation Error", validation.errors.join(', '));
        return;
      }

      if (editingAssignment) {
        await updateClassSubjectAssignment(editingAssignment.id, values);
        showNotification.success("Success", "Assignment updated successfully!");
      } else {
        await createClassSubjectAssignment(values);
        showNotification.success("Success", "Assignment created successfully!");
      }

      setIsModalVisible(false);
      fetchAssignmentsData();
    } catch (error) {
      console.error("Error saving assignment:", error);
      handleApiError(error, "Failed to save assignment");
    }
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    {
      title: "Academic Year",
      dataIndex: "academic_year_name",
      key: "academic_year_name",
      render: (name) => <Tag color="purple">{name}</Tag>,
    },
    {
      title: "Class",
      dataIndex: "student_class_name",
      key: "student_class_name",
      render: (name) => (
        <Space>
          <TeamOutlined style={{ color: '#1890ff' }} />
          <Tag color="blue">{name}</Tag>
        </Space>
      ),
    },
    {
      title: "Subject",
      key: "subject",
      render: (_, record) => (
        <div>
          <Text strong>{record.subject_name}</Text>
          {record.subject_code && (
            <div>
              <Text type="secondary" style={{ fontSize: '12px' }}>
                Code: {record.subject_code}
              </Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Teacher",
      dataIndex: "teacher_name",
      key: "teacher_name",
      render: (name) => name ? (
        <Space>
          <UserOutlined style={{ color: '#52c41a' }} />
          <Text>{name}</Text>
        </Space>
      ) : (
        <Text type="secondary">Not assigned</Text>
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
            title="Delete Assignment"
            description="Are you sure you want to delete this assignment?"
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
            Subject Assignments
          </Title>
          <Text type="secondary">
            Assign subjects to classes and teachers
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={handleCreate}
        >
          Add Assignment
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={assignments}
          rowKey="id"
          loading={loading}
          scroll={{ x: 800 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} assignments`,
          }}
        />
      </Card>

      {/* Modal for Create/Edit */}
      <Modal
        title={editingAssignment ? "Edit Subject Assignment" : "Create Subject Assignment"}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
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
            name="student_class"
            label="Class"
            rules={[{ required: true, message: 'Please select class' }]}
          >
            <Select placeholder="Select class">
              {classes.map(cls => (
                <Option key={cls.id} value={cls.id}>{cls.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please select subject' }]}
          >
            <Select placeholder="Select subject">
              {subjects.map(subject => (
                <Option key={subject.id} value={subject.id}>
                  {subject.name} {subject.code && `(${subject.code})`}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="teacher"
            label="Teacher (Optional)"
          >
            <Select placeholder="Select teacher" allowClear>
              {staff.map(teacher => (
                <Option key={teacher.id} value={teacher.id}>
                  {teacher.first_name} {teacher.last_name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}