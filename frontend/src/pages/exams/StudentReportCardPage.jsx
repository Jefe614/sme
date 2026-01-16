import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Select,
  Divider,
  Row,
  Col,
  Statistic,
  Avatar,
  Descriptions,
  Progress,
  Alert,
  Spin,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  UserOutlined,
  TrophyOutlined,
  BookOutlined,
  CalculatorOutlined,
  PrinterOutlined,
} from "@ant-design/icons";
import {
  fetchStudentReportCard,
} from "../../api/examApi";
import { fetchAcademicYears, fetchTerms } from "../../api/academicApi";
import { getStudents } from "../../api/auth";
import { showNotification, handleApiError } from "../../utils/notifications";

const { Title, Text } = Typography;
const { Option } = Select;

export default function StudentReportCardPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [students, setStudents] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedStudent && selectedTerm && selectedAcademicYear) {
      fetchReportCard();
    }
  }, [selectedStudent, selectedTerm, selectedAcademicYear]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [studentsRes, academicYearsRes, termsRes] = await Promise.all([
        getStudents(),
        fetchAcademicYears(),
        fetchTerms(),
      ]);

      setStudents(studentsRes.data || []);
      setAcademicYears(academicYearsRes.data || []);
      setTerms(termsRes.data || []);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      handleApiError(error, "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchReportCard = async () => {
    if (!selectedStudent || !selectedTerm || !selectedAcademicYear) return;

    setLoading(true);
    try {
      const response = await fetchStudentReportCard({
        student_id: selectedStudent,
        term_id: selectedTerm,
        academic_year_id: selectedAcademicYear,
      });

      setReportData(response.data);
    } catch (error) {
      console.error("Error fetching report card:", error);
      handleApiError(error, "Failed to load report card");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (studentId) => {
    setSelectedStudent(studentId);
  };

  const handleTermChange = (termId) => {
    setSelectedTerm(termId);
  };

  const handleAcademicYearChange = (yearId) => {
    setSelectedAcademicYear(yearId);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // TODO: Implement PDF download
    showNotification.info("Info", "PDF download feature coming soon!");
  };

  const getGradeColor = (grade) => {
    const gradeColors = {
      'A': '#52c41a',
      'A-': '#73d13d',
      'B+': '#95de64',
      'B': '#b7eb8f',
      'B-': '#d9f7be',
      'C+': '#fff566',
      'C': '#fffb8f',
      'C-': '#fff566',
      'D+': '#ff9c6e',
      'D': '#ff7875',
      'D-': '#ff4d4f',
      'E': '#f5222d',
    };
    return gradeColors[grade] || '#d9d9d9';
  };

  const getPerformanceLevel = (meanScore) => {
    if (meanScore >= 80) return { level: 'Excellent', color: '#52c41a' };
    if (meanScore >= 70) return { level: 'Very Good', color: '#73d13d' };
    if (meanScore >= 60) return { level: 'Good', color: '#95de64' };
    if (meanScore >= 50) return { level: 'Fair', color: '#fff566' };
    if (meanScore >= 40) return { level: 'Poor', color: '#ff9c6e' };
    return { level: 'Very Poor', color: '#ff4d4f' };
  };

  const subjectColumns = [
    {
      title: "Subject",
      dataIndex: "subject_name",
      key: "subject_name",
      render: (name, record) => (
        <Space>
          <BookOutlined />
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.subject_code}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Exam",
      dataIndex: "exam_name",
      key: "exam_name",
    },
    {
      title: "Marks",
      dataIndex: "marks_obtained",
      key: "marks_obtained",
      render: (marks) => marks ? `${marks}` : '-',
    },
    {
      title: "Weight",
      dataIndex: "weight",
      key: "weight",
      render: (weight) => `${weight}%`,
    },
    {
      title: "Grade",
      dataIndex: "grade",
      key: "grade",
      render: (grade) => grade ? (
        <Tag color={getGradeColor(grade)}>{grade}</Tag>
      ) : '-',
    },
    {
      title: "Points",
      dataIndex: "points",
      key: "points",
      render: (points) => points || '-',
    },
  ];

  const student = reportData?.student;
  const term = reportData?.term;
  const performance = student ? getPerformanceLevel(reportData.mean_score) : null;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="!mb-2">
            <FileTextOutlined className="mr-2" />
            Student Report Card
          </Title>
          <Text type="secondary">
            View detailed term performance reports for students
          </Text>
        </div>
        <Space>
          {reportData && (
            <>
              <Button icon={<PrinterOutlined />} onClick={handlePrint}>
                Print
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownloadPDF}
              >
                Download PDF
              </Button>
            </>
          )}
        </Space>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Row gutter={16}>
          <Col span={8}>
            <div className="mb-4">
              <Text strong className="block mb-2">Select Student</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Choose a student"
                value={selectedStudent}
                onChange={handleStudentChange}
                loading={loading}
                showSearch
                optionFilterProp="children"
              >
                {students.map(student => (
                  <Option key={student.id} value={student.id}>
                    {student.first_name} {student.last_name} ({student.admission_number})
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col span={8}>
            <div className="mb-4">
              <Text strong className="block mb-2">Academic Year</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Choose academic year"
                value={selectedAcademicYear}
                onChange={handleAcademicYearChange}
                loading={loading}
              >
                {academicYears.map(year => (
                  <Option key={year.id} value={year.id}>{year.name}</Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col span={8}>
            <div className="mb-4">
              <Text strong className="block mb-2">Term</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Choose term"
                value={selectedTerm}
                onChange={handleTermChange}
                loading={loading}
                disabled={!selectedAcademicYear}
              >
                {terms.map(term => (
                  <Option key={term.id} value={term.id}>{term.name}</Option>
                ))}
              </Select>
            </div>
          </Col>
        </Row>
      </Card>

      {/* Report Card Display */}
      {loading ? (
        <div className="text-center py-12">
          <Spin size="large" />
          <div className="mt-4">
            <Text>Loading report card...</Text>
          </div>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Student Header */}
          <Card>
            <Row gutter={24} align="middle">
              <Col span={4}>
                <Avatar size={80} icon={<UserOutlined />} />
              </Col>
              <Col span={12}>
                <Title level={3} className="!mb-2">
                  {student.first_name} {student.last_name}
                </Title>
                <Space direction="vertical" size="small">
                  <Text>Admission Number: {student.admission_number}</Text>
                  <Text>Class: {student.class_name}</Text>
                  <Text>Term: {term.name} - {term.academic_year}</Text>
                </Space>
              </Col>
              <Col span={8}>
                <Row gutter={16}>
                  <Col span={12}>
                    <Statistic
                      title="Mean Score"
                      value={reportData.mean_score}
                      suffix="%"
                      valueStyle={{ color: performance?.color }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Overall Grade"
                      value={reportData.overall_grade || 'N/A'}
                      valueStyle={{
                        color: reportData.overall_grade ? getGradeColor(reportData.overall_grade) : '#d9d9d9'
                      }}
                    />
                  </Col>
                </Row>
              </Col>
            </Row>
          </Card>

          {/* Performance Summary */}
          <Row gutter={16}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Performance Level"
                  value={performance?.level}
                  valueStyle={{ color: performance?.color }}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Subjects Taken"
                  value={reportData.subject_results?.length || 0}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Average Points"
                  value={reportData.subject_results?.reduce((sum, subj) => sum + (subj.points || 0), 0) / (reportData.subject_results?.length || 1)}
                  precision={1}
                  prefix={<CalculatorOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Subject Performance Table */}
          <Card title="Subject Performance Details">
            <Table
              columns={subjectColumns}
              dataSource={reportData.subject_results || []}
              rowKey={(record) => `${record.subject_name}-${record.exam_name}`}
              pagination={false}
              summary={(pageData) => {
                const totalMarks = pageData.reduce((sum, item) => sum + (item.marks_obtained || 0), 0);
                const totalPoints = pageData.reduce((sum, item) => sum + (item.points || 0), 0);

                return (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={2}>
                      <Text strong>Total</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={1}>
                      <Text strong>{totalMarks}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={2} colSpan={2}>
                      <Text strong>Average: {(totalMarks / pageData.length).toFixed(1)}</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={3}>
                      <Text strong>{totalPoints}</Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                );
              }}
            />
          </Card>

          {/* Performance Visualization */}
          <Card title="Performance Overview">
            <Row gutter={16}>
              <Col span={12}>
                <div className="mb-4">
                  <Text strong>Overall Performance</Text>
                  <Progress
                    percent={reportData.mean_score}
                    status={reportData.mean_score >= 50 ? 'success' : 'exception'}
                    strokeColor={performance?.color}
                    className="mt-2"
                  />
                </div>
              </Col>
              <Col span={12}>
                <Alert
                  message="Performance Summary"
                  description={`Your overall performance for ${term.name} is ${performance?.level.toLowerCase()}. ${
                    reportData.mean_score >= 80 ? 'Excellent work! Keep it up.' :
                    reportData.mean_score >= 60 ? 'Good performance. Room for improvement.' :
                    'Needs significant improvement. Please seek extra help.'
                  }`}
                  type={reportData.mean_score >= 60 ? 'success' : 'warning'}
                  showIcon
                />
              </Col>
            </Row>
          </Card>

          {/* Footer */}
          <Card>
            <div className="text-center">
              <Text type="secondary">
                Report generated on {new Date().toLocaleDateString('en-GB')} at {new Date().toLocaleTimeString('en-GB')}
              </Text>
            </div>
          </Card>
        </div>
      ) : (
        selectedStudent && selectedTerm && selectedAcademicYear ? (
          <Card>
            <div className="text-center py-12">
              <FileTextOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
              <Title level={4} className="mt-4">
                No Report Data Available
              </Title>
              <Text type="secondary">
                No exam marks found for the selected student, term, and academic year combination.
              </Text>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-12">
              <FileTextOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
              <Title level={4} className="mt-4">
                Select Student and Term
              </Title>
              <Text type="secondary">
                Choose a student, academic year, and term to view their report card
              </Text>
            </div>
          </Card>
        )
      )}
    </div>
  );
}
