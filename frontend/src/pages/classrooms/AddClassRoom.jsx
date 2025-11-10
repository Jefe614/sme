import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Select,
  message,
  Typography,
  Switch,
  Divider,
} from "antd";
import { SaveOutlined } from "@ant-design/icons";
import { createClass, getTeachers } from "../../api/auth";
import Swal from "sweetalert2";
const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function CreateClassPage() {
  const [form] = Form.useForm();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
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

  const sections = ["A", "B", "C", "D", "E", "F"];
  const academicYears = ["2023-2024", "2024-2025", "2025-2026"];

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await getTeachers();
      setTeachers(response.data);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      message.error("Failed to load teachers");
    }
  };

 const handleSubmit = async (values) => {
  setLoading(true);
  try {
    const response = await createClass(values);
    await Swal.fire({
      title: "Success!",
      text: "Class created successfully!",
      icon: "success",
      confirmButtonText: "OK",
      width: "600px",
      padding: "2em",
      customClass: {
        popup: "large-success-modal",
      },
      showConfirmButton: true,
    });
    navigate("/school-dashboard/classrooms");
  } catch (error) {
    console.error("Error saving class:", error);
    const errorMsg = error.response?.data?.error || "Failed to save class";
    Swal.fire({
      title: "Error",
      text: errorMsg,
      icon: "error",
      confirmButtonText: "OK",
    });
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="!mb-2">
            Create New Class
          </Title>
          <Text type="secondary">Fill in the details to create a new class</Text>
        </div>
        <Link to="/school-dashboard/classrooms">
          <Button size="large">Back to Classes</Button>
        </Link>
      </div>

      {/* Form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          max_students: 40,
          is_active: true,
          academic_year: "2024-2025",
          section: "A",
        }}
      >
        <Row gutter={[16, 16]}>
          {/* Grade Level */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="grade_level"
              label="Grade Level"
              rules={[{ required: true, message: "Please select grade level" }]}
            >
              <Select placeholder="Select grade level" size="large">
                {gradeLevels.map((grade) => (
                  <Option key={grade.value} value={grade.value}>
                    {grade.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Section */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="section"
              label="Section"
              rules={[{ required: true, message: "Please select section" }]}
            >
              <Select placeholder="Select section" size="large">
                {sections.map((section) => (
                  <Option key={section} value={section}>
                    Section {section}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Academic Year */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="academic_year"
              label="Academic Year"
              rules={[{ required: true, message: "Please enter academic year" }]}
            >
              <Select placeholder="Select academic year" size="large">
                {academicYears.map((year) => (
                  <Option key={year} value={year}>
                    {year}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Max Students */}
          <Col xs={24} sm={12}>
            <Form.Item
              name="max_students"
              label="Maximum Students"
              rules={[{ required: true, message: "Please enter maximum students" }]}
            >
              <Input type="number" min="1" max="60" size="large" />
            </Form.Item>
          </Col>

          {/* Class Teacher */}
          <Col xs={24} sm={12}>
            <Form.Item name="class_teacher" label="Class Teacher">
              <Select
                placeholder="Select class teacher"
                size="large"
                allowClear
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  option.children.toLowerCase().includes(input.toLowerCase())
                }
              >
                {teachers.map((teacher) => (
                  <Option key={teacher.id} value={teacher.id}>
                    {teacher.first_name} {teacher.last_name}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          {/* Room Number */}
          <Col xs={24} sm={12}>
            <Form.Item name="room_number" label="Room Number">
              <Input placeholder="e.g., Room 101" size="large" />
            </Form.Item>
          </Col>

          {/* Curriculum */}
          <Col xs={24}>
            <Form.Item name="curriculum" label="Curriculum">
              <Input placeholder="e.g., CBC, 8-4-4, IGCSE" size="large" />
            </Form.Item>
          </Col>

          {/* Schedule Notes */}
          <Col xs={24}>
            <Form.Item name="class_schedule" label="Class Schedule Notes">
              <TextArea
                rows={3}
                placeholder="Enter class schedule or timetable notes..."
                showCount
                maxLength={500}
              />
            </Form.Item>
          </Col>

          {/* Active Status */}
          <Col xs={24}>
            <Form.Item
              name="is_active"
              label="Active Status"
              valuePropName="checked"
            >
              <Switch
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                defaultChecked
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Submit */}
        <Divider />
        <div className="flex justify-end space-x-3">
          <Link to="/school-dashboard/classrooms">
            <Button size="large" disabled={loading}>
              Cancel
            </Button>
          </Link>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<SaveOutlined />}
            size="large"
          >
            Create Class
          </Button>
        </div>
      </Form>
    </div>
  );
}
