import React, { useState, useContext, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Row,
  Col,
  Select,
  DatePicker,
  Upload,
  message,
  Divider,
  Typography,
  Avatar,
  Steps,
  Alert,
  Radio,
  Tag,
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  SaveOutlined,
  ArrowLeftOutlined,
  BookOutlined,
  TeamOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getClasses, createStudent } from '../../api/auth';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;

export default function StudentCreationPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [file, setFile] = useState(null);
  const [studentType, setStudentType] = useState('day');
  const [classOptions, setClassOptions] = useState([]);

  const steps = [
    { title: 'Basic Info', icon: <UserOutlined /> },
    { title: 'Academic Details', icon: <BookOutlined /> },
    { title: 'Parent Info', icon: <TeamOutlined /> },
  ];

  /* ------------------------------------------------------------------ */
  /*  Load class options                                                */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    fetchClassOptions();
  }, []);

  const fetchClassOptions = async () => {
    try {
      const response = await getClasses();
      setClassOptions(response.data || []);
    } catch (error) {
      message.error('Failed to load classes');
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Avatar upload                                                     */
  /* ------------------------------------------------------------------ */
  const handleImageUpload = (info) => {
    const file = info.file;
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return false;
    }
    setFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setProfileImage(e.target.result);
    reader.readAsDataURL(file);
    return false;
  };

  /* ------------------------------------------------------------------ */
  /*  Step navigation & validation                                      */
  /* ------------------------------------------------------------------ */
  const stepFieldMap = {
    0: ['firstName', 'lastName', 'gender', 'dateOfBirth'],
    1: ['class', 'admissionDate'],
    2: ['parentName', 'relationship', 'parentPhone'],
  };

  const nextStep = () => {
    const fields = stepFieldMap[currentStep];
    form
      .validateFields(fields)
      .then(() => setCurrentStep((s) => s + 1))
      .catch(() => message.error('Please fill all required fields before proceeding.'));
  };

  const prevStep = () => setCurrentStep((s) => s - 1);

  /* ------------------------------------------------------------------ */
  /*  Submit – map fields to backend names                              */
  /* ------------------------------------------------------------------ */
  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();

      const fieldMapping = {
        firstName: 'first_name',
        lastName: 'last_name',
        dateOfBirth: 'date_of_birth',
        admissionNumber: 'admission_number',
        parentName: 'parent_name',
        parentPhone: 'parent_phone',
        parentEmail: 'parent_email',
        rollNumber: 'roll_number',
        medicalConditions: 'medical_conditions',
        bloodGroup: 'blood_group',
        gender: 'gender',
        nationality: 'nationality',
        class: 'student_class',
        admissionDate: 'admission_date',
        relationship: 'relationship',
        address: 'address',
        hostel: 'hostel',
        allergies: 'allergies',
      };

      Object.keys(values).forEach((key) => {
        const backendKey = fieldMapping[key] || key;
        const value = values[key];
        if (value === undefined || value === null || value === '') return;

        if (key === 'dateOfBirth' || key === 'admissionDate') {
          formData.append(backendKey, value.format('YYYY-MM-DD'));
        } else {
          formData.append(backendKey, value);
        }
      });

      formData.append('student_type', studentType);
      if (file) formData.append('profile_image', file);

      const response = await createStudent(formData);
      if (response.status === 201) {
        message.success('Student created successfully!');
        form.resetFields();
        setProfileImage(null);
        setFile(null);
        setStudentType('day');
        setCurrentStep(0);
        navigate('/school-dashboard/students');
      }
    } catch (error) {
      message.error(
        error.response?.data?.error ||
          error.response?.data?.detail ||
          'Failed to create student'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Render all steps (hidden when not active)                         */
  /* ------------------------------------------------------------------ */
  const renderStepContent = () => (
    <>
      {/* Step 0: Basic Info */}
      <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} className="text-center mb-4">
            <Upload
              name="avatar"
              listType="picture-circle"
              showUploadList={false}
              beforeUpload={handleImageUpload}
              accept="image/*"
            >
              {profileImage ? (
                <Avatar size={100} src={profileImage} />
              ) : (
                <div>
                  <CameraOutlined style={{ fontSize: '24px' }} />
                  <div className="mt-2">Upload Photo</div>
                </div>
              )}
            </Upload>
            <Text type="secondary" className="block mt-2">
              Click to upload student photo (Max 2MB)
            </Text>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[{ required: true, message: 'Please enter first name' }]}
            >
              <Input placeholder="Enter first name" size="large" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[{ required: true, message: 'Please enter last name' }]}
            >
              <Input placeholder="Enter last name" size="large" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="admissionNumber"
              label="Admission Number"
              tooltip="Leave blank to auto-generate"
            >
              <Input placeholder="Auto-generate if blank" size="large" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: 'Please select gender' }]}
            >
              <Select placeholder="Select gender" size="large">
                <Option value="male">Male</Option>
                <Option value="female">Female</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="dateOfBirth"
              label="Date of Birth"
              rules={[{ required: true, message: 'Please select date of birth' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                placeholder="Select date of birth"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="nationality" label="Nationality">
              <Input placeholder="Enter nationality" size="large" />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Alert
              message="Student Type"
              description="Choose whether the student will be a day scholar or boarding student."
              type="info"
              showIcon
              className="mb-4"
            />
            <Radio.Group
              onChange={(e) => setStudentType(e.target.value)}
              value={studentType}
              buttonStyle="solid"
              size="large"
              style={{ width: '100%' }}
            >
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Radio.Button
                    value="day"
                    style={{ width: '100%', textAlign: 'center', height: '80px' }}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <HomeOutlined style={{ fontSize: '20px', marginBottom: '8px' }} />
                      <Text strong>Day Scholar</Text>
                    </div>
                  </Radio.Button>
                </Col>
                <Col xs={24} md={12}>
                  <Radio.Button
                    value="boarding"
                    style={{ width: '100%', textAlign: 'center', height: '80px' }}
                  >
                    <div className="flex flex-col items-center justify-center h-full">
                      <UserOutlined style={{ fontSize: '20px', marginBottom: '8px' }} />
                      <Text strong>Boarding Student</Text>
                    </div>
                  </Radio.Button>
                </Col>
              </Row>
            </Radio.Group>
          </Col>

          {studentType === 'boarding' && (
            <Col xs={24}>
              <Form.Item name="hostel" label="Hostel (Optional)">
                <Input placeholder="Enter hostel name" size="large" />
              </Form.Item>
            </Col>
          )}
        </Row>
      </div>

      {/* Step 1: Academic Details */}
      <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12}>
            <Form.Item
              name="class"
              label="Class / Grade"
              rules={[{ required: true, message: 'Please select class' }]}
            >
              <Select placeholder="Select class" size="large" loading={!classOptions.length}>
                {classOptions.map((cls) => (
                  <Option key={cls.id} value={cls.id}>
                    {cls.grade_level} - Section {cls.section} ({cls.academic_year})
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="admissionDate"
              label="Admission Date"
              rules={[{ required: true, message: 'Please select admission date' }]}
            >
              <DatePicker
                style={{ width: '100%' }}
                size="large"
                placeholder="Select admission date"
                format="YYYY-MM-DD"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="rollNumber" label="Roll Number (Optional)">
              <Input placeholder="Enter roll number" size="large" />
            </Form.Item>
          </Col>
        </Row>
      </div>

      {/* Step 2: Parent Info */}
      <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Alert
              message="Parent/Guardian Information"
              description="Primary contact information for the student's parent or guardian."
              type="info"
              showIcon
              className="mb-4"
            />
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="parentName"
              label="Parent/Guardian Name"
              rules={[{ required: true, message: 'Please enter parent name' }]}
            >
              <Input placeholder="Enter parent name" size="large" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="relationship"
              label="Relationship"
              rules={[{ required: true, message: 'Please select relationship' }]}
            >
              <Select placeholder="Select relationship" size="large">
                <Option value="father">Father</Option>
                <Option value="mother">Mother</Option>
                <Option value="guardian">Guardian</Option>
              </Select>
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item
              name="parentPhone"
              label="Phone Number"
              rules={[{ required: true, message: 'Please enter phone number' }]}
            >
              <Input placeholder="+254 XXX XXX XXX" size="large" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12}>
            <Form.Item name="parentEmail" label="Email (Optional)">
              <Input type="email" placeholder="parent@example.com" size="large" />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Form.Item name="address" label="Home Address (Optional)">
              <TextArea rows={3} placeholder="Enter full home address" />
            </Form.Item>
          </Col>

          <Col xs={24}>
            <Card title="Medical Information (Optional)" size="small">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <Form.Item name="bloodGroup" label="Blood Group">
                    <Select placeholder="Select blood group" size="large">
                      <Option value="A+">A+</Option>
                      <Option value="A-">A-</Option>
                      <Option value="B+">B+</Option>
                      <Option value="B-">B-</Option>
                      <Option value="AB+">AB+</Option>
                      <Option value="AB-">AB-</Option>
                      <Option value="O+">O+</Option>
                      <Option value="O-">O-</Option>
                    </Select>
                  </Form.Item>
                </Col>

                <Col xs={24} sm={12}>
                  <Form.Item name="allergies" label="Known Allergies">
                    <Input placeholder="List any allergies" size="large" />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item name="medicalConditions" label="Medical Conditions">
                    <TextArea
                      rows={3}
                      placeholder="Any medical conditions, medications, or special care requirements..."
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </>
  );

  /* ------------------------------------------------------------------ */
  /*  UI                                                                */
  /* ------------------------------------------------------------------ */
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/school-dashboard/students')}
            className="mb-2"
          >
            Back to Students
          </Button>
          <Title level={2} className="!mb-1">
            Add New Student
          </Title>
          <Text type="secondary">Create a new student record - Day Scholar or Boarding</Text>
        </div>

        {studentType && (
          <Tag
            color={studentType === 'boarding' ? 'blue' : 'green'}
            className="text-lg px-3 py-1"
          >
            {studentType === 'boarding' ? 'Boarding Student' : 'Day Scholar'}
          </Tag>
        )}
      </div>

      <Card>
        <Steps current={currentStep} className="mb-8">
          {steps.map((step, idx) => (
            <Step key={idx} title={step.title} icon={step.icon} />
          ))}
        </Steps>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {renderStepContent()}

          <Divider />

          <div className="flex justify-between">
            <div>
              {currentStep > 0 && (
                <Button onClick={prevStep} size="large">
                  Previous
                </Button>
              )}
            </div>

            <div>
              {currentStep < steps.length - 1 ? (
                <Button type="primary" onClick={nextStep} size="large">
                  Next
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SaveOutlined />}
                  size="large"
                >
                  Create Student
                </Button>
              )}
            </div>
          </div>
        </Form>
      </Card>
    </div>
  );
}