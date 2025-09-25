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
  Switch,
  Avatar,
  Space,
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
  MedicineBoxOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { Step } = Steps;
const API_BASE_URL = import.meta.env.VITE_BASE_API || 'http://localhost:8000';

export default function StudentCreationPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [file, setFile] = useState(null);
  const [studentType, setStudentType] = useState('day');
  const [hasMedicalConditions, setHasMedicalConditions] = useState(false);
  const [classOptions, setClassOptions] = useState([]);
  const [sectionOptions, setSectionOptions] = useState([]);

  const steps = [
    { title: 'Basic Info', icon: <UserOutlined /> },
    { title: 'Student Type', icon: <UserOutlined /> },
    { title: 'Academic Details', icon: <BookOutlined /> },
    { title: 'Parent Info', icon: <TeamOutlined /> },
    { title: 'Medical & Additional', icon: <MedicineBoxOutlined /> },
  ];

  useEffect(() => {
    fetchClassOptions();
  }, []);

  const fetchClassOptions = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/classes/`, {
        headers: { Authorization: `Token ${user.token}` },
      });
      setClassOptions(response.data);
      const sections = [...new Set(response.data.map((cls) => cls.section))];
      setSectionOptions(sections);
    } catch (error) {
      console.error('Error fetching classes:', error);
      message.error('Failed to load classes');
    }
  };

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
    reader.onload = (e) => {
      setProfileImage(e.target.result);
    };
    reader.readAsDataURL(file);
    return false;
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(values).forEach((key) => {
        if (key === 'dateOfBirth' || key === 'admissionDate' || key === 'boardingSince') {
          formData.append(key, values[key]?.format('YYYY-MM-DD') || '');
        } else if (key === 'visitationDays') {
          formData.append(key, values[key]?.join(',') || '');
        } else {
          formData.append(key, values[key] || '');
        }
      });
      if (file) {
        formData.append('profileImage', file);
      }

      const response = await axios.post(`${API_BASE_URL}/api/students/`, formData, {
        headers: {
          Authorization: `Token ${user.token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.status === 201) {
        message.success('Student created successfully!');
        form.resetFields();
        setProfileImage(null);
        setFile(null);
        setStudentType('day');
        setHasMedicalConditions(false);
        setCurrentStep(0);
        navigate('/school-dashboard/students');
      }
    } catch (error) {
      console.error('Error creating student:', error);
      message.error(error.response?.data?.error || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    const currentStepFields = getStepFields(currentStep);
    form
      .validateFields(currentStepFields)
      .then(() => {
        setCurrentStep(currentStep + 1);
      })
      .catch((error) => {
        console.log('Validation failed:', error);
        message.error('Please fill in all required fields correctly before proceeding.');
      });
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const getStepFields = (step) => {
    const stepFields = {
      0: ['firstName', 'lastName', 'gender', 'dateOfBirth'],
      1: ['studentType', ...(studentType === 'boarding' ? ['hostel'] : [])],
      2: ['class', 'admissionDate'],
      3: ['parentName', 'relationship', 'parentPhone'],
      4: [],
    };
    return stepFields[step] || [];
  };

  const renderBasicInfo = () => (
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
          <Input prefix={<UserOutlined />} placeholder="Enter first name" size="large" />
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
        <Form.Item name="gender" label="Gender" rules={[{ required: true, message: 'Please select gender' }]}>
          <Select placeholder="Select gender" size="large">
            <Option value="male">Male</Option>
            <Option value="female">Female</Option>
            <Option value="other">Other</Option>
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
    </Row>
  );

  const renderStudentType = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Alert
          message="Student Type Selection"
          description="Choose whether the student will be a day scholar or boarding student. This affects fee structure, accommodation, and other arrangements."
          type="info"
          showIcon
          className="mb-4"
        />
      </Col>

      <Col xs={24}>
        <Form.Item
          name="studentType"
          label="Student Type"
          rules={[{ required: true, message: 'Please select student type' }]}
        >
          <Radio.Group
            onChange={(e) => setStudentType(e.target.value)}
            value={studentType}
            buttonStyle="solid"
            size="large"
            style={{ width: '100%' }}
          >
            <Row gutter={[16, 16]}>
              <Col xs={24} md={12}>
                <Radio.Button value="day" style={{ width: '100%', textAlign: 'center', height: '100px' }}>
                  <div className="flex flex-col items-center justify-center h-full">
                    <HomeOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                    <Text strong>Day Scholar</Text>
                    <Text type="secondary" className="text-xs">
                      Commutes daily
                    </Text>
                  </div>
                </Radio.Button>
              </Col>
              <Col xs={24} md={12}>
                <Radio.Button value="boarding" style={{ width: '100%', textAlign: 'center', height: '100px' }}>
                  <div className="flex flex-col items-center justify-center h-full">
                    <UserOutlined style={{ fontSize: '24px', marginBottom: '8px' }} />
                    <Text strong>Boarding Student</Text>
                    <Text type="secondary" className="text-xs">
                      Lives on campus
                    </Text>
                  </div>
                </Radio.Button>
              </Col>
            </Row>
          </Radio.Group>
        </Form.Item>
      </Col>

      {studentType === 'day' && (
        <Col xs={24}>
          <Card size="small" title="Day Scholar Details" className="mt-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item name="busRoute" label="Bus Route">
                  <Select placeholder="Select bus route" size="large">
                    <Option value="none">No Transport</Option>
                    <Option value="route1">Route 1 - Main Street</Option>
                    <Option value="route2">Route 2 - Downtown</Option>
                    <Option value="route3">Route 3 - Suburbs</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="pickupPerson" label="Authorized Pickup Person">
                  <Input placeholder="Name of authorized person" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="pickupNotes" label="Transport Notes">
                  <TextArea rows={2} placeholder="Special pickup instructions, alternate routes, etc." />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>
      )}

      {studentType === 'boarding' && (
        <Col xs={24}>
          <Card size="small" title="Boarding Details" className="mt-4">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="hostel"
                  label="Hostel"
                  rules={[{ required: true, message: 'Hostel is required for boarding students' }]}
                >
                  <Select placeholder="Select hostel" size="large">
                    <Option value="boys_hostel_a">Boys Hostel A</Option>
                    <Option value="boys_hostel_b">Boys Hostel B</Option>
                    <Option value="girls_hostel_a">Girls Hostel A</Option>
                    <Option value="girls_hostel_b">Girls Hostel B</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="dormitory" label="Dormitory/Room">
                  <Select placeholder="Select dormitory" size="large">
                    <Option value="dormitory1">Dormitory 1</Option>
                    <Option value="dormitory2">Dormitory 2</Option>
                    <Option value="dormitory3">Dormitory 3</Option>
                    <Option value="dormitory4">Dormitory 4</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="bedNumber" label="Bed Number">
                  <Input placeholder="Bed number" size="large" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="boardingSince" label="Boarding Since">
                  <DatePicker
                    style={{ width: '100%' }}
                    size="large"
                    placeholder="Start date"
                    format="YYYY-MM-DD"
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item name="boardingNotes" label="Boarding Special Requirements">
                  <TextArea rows={2} placeholder="Dietary restrictions, special care needs, etc." />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>
      )}
    </Row>
  );

  const renderAcademicDetails = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12}>
        <Form.Item
          name="class"
          label="Class / Grade"
          rules={[{ required: true, message: 'Please select class' }]}
        >
          <Select placeholder="Select class" size="large">
            {classOptions.map((cls) => (
              <Option key={cls.id} value={cls.id}>
                {gradeLevels.find((g) => g.value === cls.grade_level)?.label || cls.grade_level} - Section {cls.section} (
                {cls.academic_year})
              </Option>
            ))}
          </Select>
        </Form.Item>
      </Col>

      <Col xs={24} sm={12}>
        <Form.Item name="section" label="Section">
          <Select placeholder="Select section" size="large">
            {sectionOptions.map((sec) => (
              <Option key={sec} value={sec}>
                Section {sec}
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
        <Form.Item name="rollNumber" label="Roll Number">
          <Input placeholder="Enter roll number" size="large" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12}>
        <Form.Item name="classTeacher" label="Class Teacher">
          <Input placeholder="Enter class teacher name" size="large" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12}>
        <Form.Item name="previousSchool" label="Previous School">
          <Input placeholder="Name of previous school" size="large" />
        </Form.Item>
      </Col>
    </Row>
  );

  const renderParentInfo = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Alert
          message="Parent/Guardian Information"
          description="For boarding students, emergency contact information is crucial."
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
          <Input prefix={<UserOutlined />} placeholder="Enter parent name" size="large" />
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
            <Option value="other">Other</Option>
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
        <Form.Item name="parentEmail" label="Email">
          <Input placeholder="parent@example.com" size="large" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12}>
        <Form.Item name="parentOccupation" label="Occupation">
          <Input placeholder="Parent's occupation" size="large" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12}>
        <Form.Item name="emergencyContact" label="Emergency Contact">
          <Input placeholder="Alternative emergency number" size="large" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12}>
        <Form.Item name="parentAddress" label="Home Address">
          <TextArea rows={3} placeholder="Enter full home address" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12}>
        <Form.Item name="city" label="City">
          <Input placeholder="Enter city" size="large" />
        </Form.Item>
      </Col>

      <Col xs={24} sm={12}>
        <Form.Item name="postalCode" label="Postal Code">
          <Input placeholder="Enter postal code" size="large" />
        </Form.Item>
      </Col>

      {studentType === 'boarding' && (
        <Col xs={24}>
          <Card size="small" title="Boarding Parent Arrangements" className="mt-2">
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Form.Item name="visitationDays" label="Preferred Visitation Days">
                  <Select mode="multiple" placeholder="Select days">
                    <Option value="saturday">Saturday</Option>
                    <Option value="sunday">Sunday</Option>
                    <Option value="weekdays">Weekdays</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="leaveArrangements" label="Weekend Leave Policy">
                  <Select placeholder="Select leave arrangement">
                    <Option value="full">Full Weekend Leave</Option>
                    <Option value="partial">Partial Leave</Option>
                    <Option value="special">Special Arrangement</Option>
                    <Option value="none">No Weekend Leave</Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </Col>
      )}
    </Row>
  );

  const renderMedicalAdditional = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24}>
        <Card title="Medical Information" className="mb-4">
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
              <Form.Item name="hasMedicalConditions" label="Medical Conditions">
                <Switch
                  checked={hasMedicalConditions}
                  onChange={setHasMedicalConditions}
                  checkedChildren="Yes"
                  unCheckedChildren="No"
                />
              </Form.Item>
            </Col>
            {hasMedicalConditions && (
              <Col xs={24}>
                <Form.Item name="medicalConditions" label="Describe Medical Conditions">
                  <TextArea
                    rows={4}
                    placeholder="Detailed description of medical conditions, medications, special care requirements..."
                  />
                </Form.Item>
              </Col>
            )}
            <Col xs={24}>
              <Form.Item name="doctorInfo" label="Doctor/Clinic Information">
                <TextArea rows={2} placeholder="Doctor's name, clinic contact, etc." />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>

      <Col xs={24}>
        <Card title="Additional Information">
          <Row gutter={[16, 16]}>
            <Col xs={24}>
              <Form.Item name="specialNotes" label="Special Notes">
                <TextArea rows={3} placeholder="Any other important information..." />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="isActive" label="Active Status" valuePropName="checked" initialValue={true}>
                <Switch checkedChildren="Active" unCheckedChildren="Inactive" defaultChecked />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      </Col>
    </Row>
  );

  const stepContent = [renderBasicInfo(), renderStudentType(), renderAcademicDetails(), renderParentInfo(), renderMedicalAdditional()];
  const gradeLevels = [
    { value: 'pre-school', label: 'Pre-School' },
    { value: 'grade-1', label: 'Grade 1' },
    { value: 'grade-2', label: 'Grade 2' },
    { value: 'grade-3', label: 'Grade 3' },
    { value: 'grade-4', label: 'Grade 4' },
    { value: 'grade-5', label: 'Grade 5' },
    { value: 'grade-6', label: 'Grade 6' },
    { value: 'grade-7', label: 'Grade 7' },
    { value: 'grade-8', label: 'Grade 8' },
    { value: 'form-1', label: 'Form 1' },
    { value: 'form-2', label: 'Form 2' },
    { value: 'form-3', label: 'Form 3' },
    { value: 'form-4', label: 'Form 4' },
  ];

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
          <Tag color={studentType === 'boarding' ? 'blue' : 'green'} className="text-lg px-3 py-1">
            {studentType === 'boarding' ? 'Boarding Student' : 'Day Scholar'}
          </Tag>
        )}
      </div>

      <Card>
        <Steps current={currentStep} className="mb-8">
          {steps.map((step, index) => (
            <Step key={index} title={step.title} icon={step.icon} />
          ))}
        </Steps>

        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {stepContent[currentStep]}

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