import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Table,
  Tag,
  Modal,
  Typography,
  Switch,
  Space,
  Popconfirm,
  Tooltip,
  Avatar,
  Descriptions,
  Divider,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  UserOutlined,
  HomeOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import Swal from "sweetalert2";
import {
  getClasses,
  getTeachers,
  getClassStudents,
  deleteClass,
  updateClassStatus,
} from "../../api/auth";

const { Title, Text } = Typography;

export default function ClassManagementPage() {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const navigate = useNavigate();

  const gradeLevels = [
    { value: "pre-school", label: "Pre-School" },
    { value: "grade-1", label: "Grade 1" },
    { value: "grade-2", label: "Grade 2" },
    { value: "grade-3", label: "Grade 3" },
    { value: "grade-4", label: "Grade 4" },
    { value: "grade-5", label: "Grade 5" },
    { value: "grade-6", label: "Grade 6" },
    { value: "grade-7", label: "Grade 7" },
    { value: "grade-8", label: "Grade 8" },
    { value: "form-1", label: "Form 1" },
    { value: "form-2", label: "Form 2" },
    { value: "form-3", label: "Form 3" },
    { value: "form-4", label: "Form 4" },
  ];

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const { data } = await getClasses();
      setClasses(data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load classes",
        icon: "error",
        confirmButtonText: "OK",
        width: "600px",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data } = await getTeachers();
      setTeachers(data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load teachers",
        icon: "error",
        confirmButtonText: "OK",
        width: "600px",
      });
    }
  };

  const fetchClassStudents = async (classId) => {
    setStudentsLoading(true);
    try {
      const { data } = await getClassStudents(classId);
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load students",
        icon: "error",
        confirmButtonText: "OK",
        width: "600px",
      });
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleView = async (classRecord) => {
    setSelectedClass(classRecord);
    await fetchClassStudents(classRecord.id);
    setViewModalVisible(true);
  };

  const handleDelete = async (classId) => {
    try {
      await deleteClass(classId);
      await Swal.fire({
        title: "Success!",
        text: "Class deleted successfully!",
        icon: "success",
        confirmButtonText: "OK",
        width: "600px",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "large-success-modal" },
      });
      fetchClasses();
    } catch (error) {
      console.error("Error deleting class:", error);
      Swal.fire({
        title: "Error",
        text:
          error.response?.data?.message ||
          "Failed to delete class. There might be students assigned to it.",
        icon: "error",
        confirmButtonText: "OK",
        width: "600px",
      });
    }
  };

  const handleStatusToggle = async (classRecord) => {
    try {
      await updateClassStatus(classRecord.id, !classRecord.is_active);
      await Swal.fire({
        title: "Success!",
        text: `Class ${
          classRecord.is_active ? "deactivated" : "activated"
        } successfully!`,
        icon: "success",
        confirmButtonText: "OK",
        width: "600px",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "large-success-modal" },
      });
      fetchClasses();
    } catch (error) {
      console.error("Error updating class status:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to update class status",
        icon: "error",
        confirmButtonText: "OK",
        width: "600px",
      });
    }
  };

  const columns = [
    {
      title: "Class Name",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Button
          type="link"
          onClick={() => handleView(record)}
          style={{ padding: 0, height: "auto" }}
        >
          <Space>
            <TeamOutlined style={{ color: "#1890ff" }} />
            <Text strong>{text}</Text>
          </Space>
        </Button>
      ),
    },
    {
      title: "Grade Level",
      dataIndex: "grade_level",
      key: "grade_level",
      render: (value) => {
        const grade = gradeLevels.find((g) => g.value === value);
        return grade ? <Tag color="blue">{grade.label}</Tag> : value;
      },
    },
    {
      title: "Section",
      dataIndex: "section",
      key: "section",
      render: (section) => <Tag color="geekblue">Section {section}</Tag>,
    },
    {
      title: "Academic Year",
      dataIndex: "academic_year",
      key: "academic_year",
      render: (year) => <Tag color="orange">{year}</Tag>,
    },
    {
      title: "Class Teacher",
      dataIndex: "class_teacher",
      key: "class_teacher",
      render: (teacher) =>
        teacher ? (
          <Space>
            <Avatar size="small" icon={<UserOutlined />} />
            <Text>
              {teacher.first_name} {teacher.last_name}
            </Text>
          </Space>
        ) : (
          <Text type="secondary">Not assigned</Text>
        ),
    },
    {
      title: "Students",
      dataIndex: "current_strength",
      key: "current_strength",
      render: (strength, record) => (
        <Tooltip title={`${record.available_seats || 0} seats available`}>
          <Tag
            color={
              strength >= record.max_students
                ? "red"
                : strength > 0
                ? "green"
                : "default"
            }
          >
            {strength || 0}/{record.max_students}
          </Tag>
        </Tooltip>
      ),
    },
    {
      title: "Room",
      dataIndex: "room_number",
      key: "room_number",
      render: (room) => (room ? <Tag icon={<HomeOutlined />}>{room}</Tag> : "-"),
    },
    {
      title: "Status",
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
      render: (_, record) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => navigate(`/classes/edit/${record.id}`)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Class"
            description="Are you sure you want to delete this class? This action cannot be undone."
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

  const studentColumns = [
    {
      title: "Name",
      key: "name",
      render: (_, record) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          {`${record.first_name} ${record.last_name}`}
        </Space>
      ),
    },
    {
      title: "Admission Number",
      dataIndex: "admission_number",
      key: "admission_number",
    },
    {
      title: "Type",
      dataIndex: "student_type",
      key: "student_type",
      render: (type) => <Tag>{type}</Tag>,
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          type="link"
          onClick={() => navigate(`/students/edit/${record.id}`)}
        >
          View Profile
        </Button>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="!mb-2">
            Class Management
          </Title>
          <Text type="secondary">Create and manage classes for your school</Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate("/school-dashboard/add/classrooms")}
        >
          Add New Class
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={classes}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} classes`,
          }}
        />
      </Card>

      {/* View Class Details Modal */}
      <Modal
        title={
          <Space>
            <TeamOutlined style={{ color: "#1890ff" }} />
            <Text strong>Class Details - {selectedClass?.name}</Text>
          </Space>
        }
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false);
          setSelectedClass(null);
          setStudents([]);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setViewModalVisible(false);
              setSelectedClass(null);
              setStudents([]);
            }}
          >
            Close
          </Button>,
          <Button
            key="edit"
            type="primary"
            onClick={() => {
              setViewModalVisible(false);
              navigate(`/classes/edit/${selectedClass?.id}`);
            }}
          >
            Edit Class
          </Button>,
        ]}
        width="80%"
        style={{ maxWidth: 800 }}
        className="class-details-modal"
      >
        {selectedClass && (
          <div>
            <Card className="mb-4">
              <Descriptions
                title="Class Information"
                bordered
                column={{ xs: 1, sm: 2 }}
                labelStyle={{ fontWeight: "bold" }}
              >
                <Descriptions.Item label="Grade Level">
                  <Tag color="blue">
                    {gradeLevels.find(
                      (g) => g.value === selectedClass.grade_level
                    )?.label || selectedClass.grade_level}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Section">
                  <Tag color="geekblue">Section {selectedClass.section}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Academic Year">
                  <Tag color="orange">{selectedClass.academic_year}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Room Number">
                  {selectedClass.room_number || "Not assigned"}
                </Descriptions.Item>
                <Descriptions.Item label="Class Teacher">
                  {selectedClass.class_teacher ? (
                    <Space>
                      <Avatar size="small" icon={<UserOutlined />} />
                      {`${selectedClass.class_teacher.first_name} ${selectedClass.class_teacher.last_name}`}
                    </Space>
                  ) : (
                    <Text type="secondary">Not assigned</Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Student Capacity">
                  <Tag
                    color={
                      selectedClass.current_strength >=
                      selectedClass.max_students
                        ? "red"
                        : "green"
                    }
                  >
                    {selectedClass.current_strength || 0}/
                    {selectedClass.max_students}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Curriculum" span={2}>
                  {selectedClass.curriculum || "Not specified"}
                </Descriptions.Item>
                <Descriptions.Item label="Schedule Notes" span={2}>
                  {selectedClass.class_schedule?.length > 0
                    ? selectedClass.class_schedule.join(", ")
                    : "Not specified"}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Students in this Class">
              <Table
                columns={studentColumns}
                dataSource={students}
                rowKey="id"
                loading={studentsLoading}
                locale={{ emptyText: "No students assigned to this class" }}
                pagination={false}
                size="small"
              />
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
}