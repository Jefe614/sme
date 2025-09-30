// src/pages/classes/ClassManagementPage.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  Table,
  Tag,
  Modal,
  message,
  Typography,
  Switch,
  Space,
  Popconfirm,
  Tooltip,
  Avatar,
  List,
  Divider,
  Row,
  Col,
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

import { getClasses, getTeachers } from "../../api/auth"; // reuse api helpers
import api from "../../api/apiClient"; // for students + delete

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
      message.error("Failed to load classes");
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
      message.error("Failed to load teachers");
    }
  };

  const fetchClassStudents = async (classId) => {
    setStudentsLoading(true);
    try {
      const { data } = await api.get(`/students/?class_id=${classId}`);
      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
      message.error("Failed to load students");
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
      await api.delete(`/classes/${classId}/`);
      message.success("Class deleted successfully!");
      fetchClasses();
    } catch (error) {
      console.error("Error deleting class:", error);
      message.error(
        error.response?.data?.message ||
          "Failed to delete class. There might be students assigned to it."
      );
    }
  };

  const handleStatusToggle = async (classRecord) => {
    try {
      await api.patch(`/classes/${classRecord.id}/`, {
        is_active: !classRecord.is_active,
      });
      message.success(
        `Class ${classRecord.is_active ? "deactivated" : "activated"} successfully!`
      );
      fetchClasses();
    } catch (error) {
      console.error("Error updating class status:", error);
      message.error("Failed to update class status");
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
            <TeamOutlined />
            Class Details - {selectedClass?.name}
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
        ]}
        width={800}
      >
        {selectedClass && (
          <div>
            <Row gutter={[16, 16]} className="mb-6">
              <Col span={8}>
                <Text strong>Grade Level:</Text>
                <br />
                <Tag color="blue">
                  {gradeLevels.find(
                    (g) => g.value === selectedClass.grade_level
                  )?.label || selectedClass.grade_level}
                </Tag>
              </Col>
              <Col span={8}>
                <Text strong>Section:</Text>
                <br />
                <Tag color="geekblue">Section {selectedClass.section}</Tag>
              </Col>
              <Col span={8}>
                <Text strong>Academic Year:</Text>
                <br />
                <Tag color="orange">{selectedClass.academic_year}</Tag>
              </Col>
              <Col span={8}>
                <Text strong>Room Number:</Text>
                <br />
                <Text>{selectedClass.room_number || "Not assigned"}</Text>
              </Col>
              <Col span={8}>
                <Text strong>Class Teacher:</Text>
                <br />
                {selectedClass.class_teacher ? (
                  <Space>
                    <Avatar size="small" icon={<UserOutlined />} />
                    <Text>
                      {selectedClass.class_teacher.first_name}{" "}
                      {selectedClass.class_teacher.last_name}
                    </Text>
                  </Space>
                ) : (
                  <Text type="secondary">Not assigned</Text>
                )}
              </Col>
              <Col span={8}>
                <Text strong>Student Capacity:</Text>
                <br />
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
              </Col>
              <Col span={24}>
                <Text strong>Curriculum:</Text>
                <br />
                <Text>{selectedClass.curriculum || "Not specified"}</Text>
              </Col>
            </Row>

            <Divider>Students in this Class</Divider>

            <List
              loading={studentsLoading}
              dataSource={students}
              renderItem={(student) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={`${student.first_name} ${student.last_name}`}
                    description={
                      <Space>
                        <Text>Admission: {student.admission_number}</Text>
                        <Text>
                          Type: <Tag size="small">{student.student_type}</Tag>
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: "No students assigned to this class" }}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
