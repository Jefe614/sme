import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Avatar,
  Tag,
  Button,
  Spin,
  Descriptions,
  Divider,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  CalendarOutlined,
  BookOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { getStudent } from '../../api/auth';

const { Title, Text } = Typography;

export default function ViewStudentPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [id]);

  const fetchStudentData = async () => {
    try {
      const response = await getStudent(id);
      setStudent(response.data.student);
    } catch (error) {
      message.error('Failed to load student data');
      navigate('/school-dashboard/students');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="p-6">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/school-dashboard/students')}
        >
          Back to Students
        </Button>
        <div className="text-center mt-8">
          <Text type="secondary">Student not found</Text>
        </div>
      </div>
    );
  }

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
            {student.first_name} {student.last_name}
          </Title>
          <Text type="secondary">Student Details</Text>
        </div>

        <div className="flex gap-2">
          <Tag
            color={student.student_type === 'boarding' ? 'blue' : 'green'}
          >
            {student.student_type === 'boarding' ? 'Boarding Student' : 'Day Scholar'}
          </Tag>
          <Tag color={student.is_active ? 'green' : 'red'}>
            {student.is_active ? 'Active' : 'Inactive'}
          </Tag>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card className="text-center">
            <Avatar
              size={120}
              src={student.profile_image}
              icon={<UserOutlined />}
              className="bg-blue-500 mb-4"
            />
            <Title level={4} className="!mb-1">
              {student.first_name} {student.last_name}
            </Title>
            <Text type="secondary" className="block mb-2">
              Admission No: {student.admission_number || '—'}
            </Text>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => navigate(`/school-dashboard/students/${student.id}/edit`)}
            >
              Edit Student
            </Button>
          </Card>

          <Card title="Academic Information" className="mt-4">
            <Descriptions size="small" column={1}>
              <Descriptions.Item label={<><BookOutlined /> Class</>}>
                {student.student_class
                  ? `${student.student_class.name}`
                  : 'Not Assigned'
                }
              </Descriptions.Item>
              <Descriptions.Item label={<><CalendarOutlined /> Admission Date</>}>
                {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Roll Number">
                {student.roll_number || '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card title="Personal Information">
            <Descriptions column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="First Name">{student.first_name}</Descriptions.Item>
              <Descriptions.Item label="Last Name">{student.last_name}</Descriptions.Item>
              <Descriptions.Item label="Gender">
                <Tag color={student.gender === 'male' ? 'blue' : 'pink'}>
                  {student.gender?.charAt(0).toUpperCase() + student.gender?.slice(1)}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Date of Birth">
                {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Nationality">{student.nationality || '—'}</Descriptions.Item>
              <Descriptions.Item label="Student Type">
                <Tag color={student.student_type === 'boarding' ? 'blue' : 'green'}>
                  {student.student_type === 'boarding' ? 'Boarding' : 'Day Scholar'}
                </Tag>
              </Descriptions.Item>
              {student.student_type === 'boarding' && (
                <Descriptions.Item label="Hostel">{student.hostel || '—'}</Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          <Card title={<><TeamOutlined /> Parent/Guardian Information</>} className="mt-4">
            <Descriptions column={{ xs: 1, sm: 2 }}>
              <Descriptions.Item label="Name">{student.parent_name || '—'}</Descriptions.Item>
              <Descriptions.Item label="Relationship">{student.relationship || '—'}</Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                {student.parent_phone || '—'}
              </Descriptions.Item>
              <Descriptions.Item label={<><MailOutlined /> Email</>}>
                {student.parent_email || '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card title={<><HomeOutlined /> Address Information</>} className="mt-4">
            <Descriptions column={1}>
              <Descriptions.Item label="Address">
                {student.address || '—'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {(student.blood_group || student.allergies || student.medical_conditions) && (
            <Card title="Medical Information" className="mt-4">
              <Descriptions column={{ xs: 1, sm: 2 }}>
                {student.blood_group && (
                  <Descriptions.Item label="Blood Group">{student.blood_group}</Descriptions.Item>
                )}
                {student.allergies && (
                  <Descriptions.Item label="Allergies">{student.allergies}</Descriptions.Item>
                )}
                {student.medical_conditions && (
                  <Descriptions.Item label="Medical Conditions" span={2}>
                    {student.medical_conditions}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          )}
        </Col>
      </Row>
    </div>
  );
}
