// src/pages/staff/CreateStaffPage.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Form,
  Input,
  Button,
  Row,
  Col,
  Select,
  Typography,
  Switch,
  Divider,
  DatePicker,
  Upload,
} from "antd";
import { UploadOutlined, SaveOutlined } from "@ant-design/icons";
import Swal from "sweetalert2";
import { createStaff, getClasses, getSubjects } from "../../api/auth";
import { getGradeLabel } from "../../utils/gradeLevels";
import moment from "moment";

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export default function CreateStaffPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [staffType, setStaffType] = useState("teaching");
  const navigate = useNavigate();
  const location = useLocation();
  const isTeacherRoute = location.state?.isTeacher || false;

  const staffTypes = [
    { value: "teaching", label: "Teaching Staff" },
    { value: "non_teaching", label: "Non-Teaching Staff" },
    { value: "administrative", label: "Administrative Staff" },
    { value: "support", label: "Support Staff" },
  ];

  const staffRoles = [
    { value: "teacher", label: "Teacher" },
    { value: "head_teacher", label: "Head Teacher" },
    { value: "deputy_head", label: "Deputy Head Teacher" },
    { value: "department_head", label: "Department Head" },
    { value: "secretary", label: "Secretary" },
    { value: "accountant", label: "Accountant" },
    { value: "librarian", label: "Librarian" },
    { value: "nurse", label: "Nurse" },
    { value: "counselor", label: "Counselor" },
    { value: "security", label: "Security" },
    { value: "cleaner", label: "Cleaner" },
    { value: "driver", label: "Driver" },
    { value: "cook", label: "Cook" },
  ];

  const departments = [
    { value: "academic", label: "Academic" },
    { value: "administration", label: "Administration" },
    { value: "finance", label: "Finance" },
    { value: "it", label: "IT Department" },
    { value: "library", label: "Library" },
    { value: "sports", label: "Sports" },
    { value: "science", label: "Science" },
    { value: "humanities", label: "Humanities" },
    { value: "languages", label: "Languages" },
    { value: "mathematics", label: "Mathematics" },
    { value: "guidance", label: "Guidance and Counseling" },
    { value: "medical", label: "Medical" },
    { value: "maintenance", label: "Maintenance" },
  ];

  const qualifications = [
    { value: "certificate", label: "Certificate" },
    { value: "diploma", label: "Diploma" },
    { value: "degree", label: "Bachelor's Degree" },
    { value: "masters", label: "Master's Degree" },
    { value: "phd", label: "PhD" },
    { value: "other", label: "Other" },
  ];

  const employmentTypes = [
    { value: "full_time", label: "Full Time" },
    { value: "part_time", label: "Part Time" },
    { value: "contract", label: "Contract" },
    { value: "probation", label: "Probation" },
    { value: "intern", label: "Intern" },
  ];

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
  ];

  const bloodGroupOptions = [
    { value: "A+", label: "A+" },
    { value: "A-", label: "A-" },
    { value: "B+", label: "B+" },
    { value: "B-", label: "B-" },
    { value: "AB+", label: "AB+" },
    { value: "AB-", label: "AB-" },
    { value: "O+", label: "O+" },
    { value: "O-", label: "O-" },
  ];

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    form.setFieldsValue({ staff_type: isTeacherRoute ? "teaching" : "teaching" });
    setStaffType(isTeacherRoute ? "teaching" : "teaching");
  }, [form, isTeacherRoute]);

  const fetchClasses = async () => {
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
        customClass: { popup: "large-success-modal" },
      });
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data } = await getSubjects();
      setSubjects(data);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load subjects",
        icon: "error",
        confirmButtonText: "OK",
        width: "600px",
        customClass: { popup: "large-success-modal" },
      });
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        if (key === "profile_image" && values[key]?.file) {
          formData.append(key, values[key].file);
        } else if (
          key === "date_of_birth" ||
          key === "date_joined" ||
          key === "contract_start_date" ||
          key === "contract_end_date" ||
          key === "probation_end_date"
        ) {
          formData.append(
            key,
            values[key] ? moment(values[key]).format("YYYY-MM-DD") : ""
          );
        } else if (key === "subjects" || key === "classes_taught") {
          formData.append(key, JSON.stringify(values[key] || []));
        } else {
          formData.append(key, values[key] || "");
        }
      });

      const response = await createStaff(formData);
      console.log("API Response:", response);
      await Swal.fire({
        title: "Success!",
        text: "Staff created successfully!",
        icon: "success",
        confirmButtonText: "OK",
        width: "600px",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "large-success-modal" },
      });
      navigate(isTeacherRoute ? "/school-dashboard/teachers" : "/school-dashboard/staff");
    } catch (error) {
      console.error("Error creating staff:", error);
      const errorMsg = error.response?.data?.error || "Failed to create staff";
      Swal.fire({
        title: "Error",
        text: errorMsg,
        icon: "error",
        confirmButtonText: "OK",
        width: "600px",
        customClass: { popup: "large-success-modal" },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStaffTypeChange = (value) => {
    setStaffType(value);
    if (value !== "teaching") {
      form.setFieldsValue({
        subjects: [],
        classes_taught: [],
        is_class_teacher: false,
        class_teacher_of: null,
        tsc_number: "",
        kuppet_number: "",
        knut_number: "",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="!mb-2">
            Create New {isTeacherRoute ? "Teacher" : "Staff"}
          </Title>
          <Text type="secondary">
            Fill in the details to create a new {isTeacherRoute ? "teacher" : "staff member"}
          </Text>
        </div>
        <Link to={isTeacherRoute ? "/school-dashboard/teachers" : "/school-dashboard/staff"}>
          <Button size="large">Back to {isTeacherRoute ? "Teachers" : "Staff"}</Button>
        </Link>
      </div>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          staff_type: isTeacherRoute ? "teaching" : "teaching",
          employment_type: "full_time",
          is_active: true,
          is_class_teacher: false,
        }}
      >
        <Divider orientation="left">Basic Information</Divider>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="first_name"
              label="First Name"
              rules={[{ required: true, message: "Please enter first name" }]}
            >
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="last_name"
              label="Last Name"
              rules={[{ required: true, message: "Please enter last name" }]}
            >
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="gender" label="Gender">
              <Select size="large" placeholder="Select gender">
                {genderOptions.map((option) => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="date_of_birth" label="Date of Birth">
              <DatePicker size="large" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="nationality" label="Nationality">
              <Input size="large" placeholder="e.g., Kenyan" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="profile_image" label="Profile Image">
              <Upload
                accept="image/*"
                beforeUpload={() => false} // Prevent auto-upload
                maxCount={1}
              >
                <Button icon={<UploadOutlined />}>Upload Image</Button>
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Contact Information</Divider>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Form.Item name="personal_phone" label="Personal Phone">
              <Input size="large" placeholder="e.g., +254123456789" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="alternative_phone" label="Alternative Phone">
              <Input size="large" placeholder="e.g., +254987654321" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="personal_email" label="Personal Email">
              <Input size="large" placeholder="e.g., john.doe@example.com" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="emergency_contact_name" label="Emergency Contact Name">
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="emergency_contact_phone" label="Emergency Contact Phone">
              <Input size="large" placeholder="e.g., +254123456789" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="emergency_contact_relationship" label="Emergency Contact Relationship">
              <Input size="large" placeholder="e.g., Spouse" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Address Information</Divider>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Form.Item name="residential_address" label="Residential Address">
              <TextArea rows={3} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="city" label="City">
              <Input size="large" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="postal_code" label="Postal Code">
              <Input size="large" />
            </Form.Item>
          </Col>
        </Row>

        <Divider orientation="left">Employment Details</Divider>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="staff_type"
              label="Staff Type"
              rules={[{ required: true, message: "Please select staff type" }]}
            >
              <Select size="large" onChange={handleStaffTypeChange}>
                {staffTypes.map((type) => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="staff_role"
              label="Staff Role"
              rules={[{ required: true, message: "Please select staff role" }]}
            >
              <Select size="large">
                {staffRoles.map((role) => (
                  <Option key={role.value} value={role.value}>
                    {role.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="department" label="Department">
              <Select size="large" allowClear>
                {departments.map((dept) => (
                  <Option key={dept.value} value={dept.value}>
                    {dept.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="employment_type"
              label="Employment Type"
              rules={[{ required: true, message: "Please select employment type" }]}
            >
              <Select size="large">
                {employmentTypes.map((type) => (
                  <Option key={type.value} value={type.value}>
                    {type.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item
              name="date_joined"
              label="Date Joined"
              rules={[{ required: true, message: "Please select date joined" }]}
            >
              <DatePicker size="large" style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        {staffType === "teaching" && (
          <>
            <Divider orientation="left">Teacher-Specific Information</Divider>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item name="tsc_number" label="TSC Number">
                  <Input size="large" placeholder="Teachers Service Commission Number" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="kuppet_number" label="KUPPET Number">
                  <Input size="large" placeholder="KUPPET Membership Number" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="knut_number" label="KNUT Number">
                  <Input size="large" placeholder="KNUT Membership Number" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="qualification" label="Qualification">
                  <Select size="large" allowClear>
                    {qualifications.map((qual) => (
                      <Option key={qual.value} value={qual.value}>
                        {qual.label}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="specialization" label="Specialization">
                  <Input size="large" placeholder="e.g., Mathematics Education" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="subjects" label="Subjects Taught">
                  <Select mode="multiple" size="large" placeholder="Select subjects">
                    {subjects.map((subject) => (
                      <Option key={subject.id} value={subject.id}>
                        {subject.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="classes_taught" label="Classes Taught">
                  <Select mode="multiple" size="large" placeholder="Select classes">
                    {classes.map((cls) => (
                      <Option key={cls.id} value={cls.id}>
                        {`${getGradeLabel(cls.grade_level)} - Section ${cls.section}`}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="is_class_teacher" label="Is Class Teacher" valuePropName="checked">
                  <Switch checkedChildren="Yes" unCheckedChildren="No" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="class_teacher_of"
                  label="Class Teacher Of"
                  rules={[
                    {
                      required: form.getFieldValue("is_class_teacher"),
                      message: "Please select a class if the staff is a class teacher",
                    },
                  ]}
                >
                  <Select size="large" allowClear placeholder="Select class">
                    {classes.map((cls) => (
                      <Option key={cls.id} value={cls.id}>
                        {`${getGradeLabel(cls.grade_level)} - Section ${cls.section}`}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </>
        )}

        <Divider orientation="left">Additional Information</Divider>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Form.Item name="bio" label="Biography">
              <TextArea rows={3} placeholder="Brief biography or profile" />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="notes" label="Notes">
              <TextArea rows={3} placeholder="Additional notes or comments" />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="is_active" label="Active Status" valuePropName="checked">
              <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
            </Form.Item>
          </Col>
        </Row>

        <Divider />
        <div className="flex justify-end space-x-3">
          <Link to={isTeacherRoute ? "/school-dashboard/teachers" : "/school-dashboard/staff"}>
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
            Create Staff
          </Button>
        </div>
      </Form>
    </div>
  );
}