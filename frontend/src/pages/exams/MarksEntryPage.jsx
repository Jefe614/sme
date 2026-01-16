import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Select,
  InputNumber,
  Form,
  Divider,
  Alert,
  Progress,
  Modal,
  Checkbox,
  Tooltip,
  Row,
  Col,
  Statistic,
  Input,
} from "antd";
import {
  SaveOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  UserOutlined,
  BookOutlined,
  CalculatorOutlined,
} from "@ant-design/icons";
import {
  fetchExams,
  bulkCreateExamMarks,
  getExamMarksByExam,
  getDefaultGradingSystem,
  calculateGrade,
} from "../../api/examApi";
import { fetchSubjects } from "../../api/academicApi";
import apiClient from "../../api/apiClient";
import { showNotification, handleApiError } from "../../utils/notifications";
import { getClasses } from "../../api/auth";

const { Title, Text } = Typography;
const { Option } = Select;

export default function MarksEntryPage() {
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [gradingSystem, setGradingSystem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [marksToConfirm, setMarksToConfirm] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Form state for marks entry
  const [marksForm] = Form.useForm();
  const [marksData, setMarksData] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedExam && selectedSubject) {
      fetchExamMarksData();
    }
  }, [selectedExam, selectedSubject]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [examsRes, subjectsRes, classesRes, gradingRes] = await Promise.all([
        fetchExams(),
        fetchSubjects(),
        getClasses(),
        getDefaultGradingSystem(),
      ]);
      console.log("examsRes", examsRes)

      setExams(examsRes.data || []);
      setSubjects(subjectsRes.data || []);
      setClasses(classesRes.data || []);
      setGradingSystem(gradingRes);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      handleApiError(error, "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchExamMarksData = async () => {
    if (!selectedExam || !selectedSubject) return;

    setLoading(true);
    try {
      const response = await getExamMarksByExam(selectedExam);
      const marks = response.data || [];

      // Filter marks for selected subject
      const subjectMarks = marks.filter(mark => mark.subject === parseInt(selectedSubject));

      // Create marks data object for form
      const marksObj = {};
      subjectMarks.forEach(mark => {
        marksObj[mark.student] = {
          marks_obtained: mark.marks_obtained,
          cbc_level: mark.cbc_level,
          is_absent: mark.is_absent,
          teacher_remarks: mark.teacher_remarks,
        };
      });

      setMarksData(marksObj);
      marksForm.setFieldsValue(marksObj);

      // Get students for this exam's class
      await fetchStudentsForExam();

    } catch (error) {
      console.error("Error fetching exam marks:", error);
      handleApiError(error, "Failed to load exam marks");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsForExam = async () => {
    if (!selectedExam || !selectedClass) return;

    try {
      // Fetch students for the selected class (since exams are school-wide, but we enter marks by class)
      const response = await apiClient.get('/students', {
        params: { class: selectedClass }
      });
      const studentsData = response.data?.data || [];

      setStudents(studentsData);

      // Initialize marks data for all students in the class
      const initialMarksData = {};
      studentsData.forEach(student => {
        initialMarksData[student.id] = {
          marks_obtained: null,
          cbc_level: null,
          is_absent: false,
          teacher_remarks: '',
        };
      });
      setMarksData(initialMarksData);
      marksForm.setFieldsValue(initialMarksData);

    } catch (error) {
      console.error("Error fetching students:", error);
      handleApiError(error, "Failed to load students");
    }
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
    setSelectedExam(null);
    setSelectedSubject(null);
    setMarksData({});
    marksForm.resetFields();
  };

  const handleExamChange = (examId) => {
    console.log("examId", examId)
    setSelectedExam(examId);
    setSelectedSubject(null);
    setMarksData({});
    marksForm.resetFields();
  };

  const handleSubjectChange = (subjectId) => {
    setSelectedSubject(subjectId);
  };

  const handleMarksChange = (studentId, field, value) => {
    setMarksData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      }
    }));
  };

  const validateMarks = () => {
    const errors = [];
    const exam = exams.find(e => e.id === parseInt(selectedExam));

    Object.entries(marksData).forEach(([studentId, data]) => {
      if (data.marks_obtained && !data.is_absent) {
        const marks = parseFloat(data.marks_obtained);
        if (isNaN(marks) || marks < 0) {
          errors.push(`Invalid marks for student ${studentId}`);
        }
        if (exam && marks > exam.total_marks) {
          errors.push(`Marks exceed total marks (${exam.total_marks}) for student ${studentId}`);
        }
      }
    });

    return errors;
  };



  const handleSaveMarks = async () => {
    if (!selectedExam || !selectedSubject) {
      showNotification.error("Error", "Please select an exam and subject");
      return;
    }

    // Validate marks
    const validationErrors = validateMarks();
    if (validationErrors.length > 0) {
      showNotification.error("Validation Error", validationErrors.join(', '));
      return;
    }

    // Prepare data for bulk save
    const marksToSave = Object.entries(marksData).map(([studentId, data]) => ({
      student_id: parseInt(studentId),
      marks_obtained: data.marks_obtained || null,
      cbc_level: data.cbc_level || null,
      teacher_remarks: data.teacher_remarks || '',
      is_absent: data.is_absent || false,
    }));

    if (marksToSave.length === 0) {
      showNotification.warning("Warning", "No marks to save");
      return;
    }

    // Show confirmation modal
    setMarksToConfirm(marksToSave);
    setConfirmModalVisible(true);
  };

  const handleRefresh = () => {
    if (selectedExam && selectedSubject) {
      fetchExamMarksData();
    }
  };

  const getFilteredExams = () => {
    // Show all active, unlocked exams (no class-specific filtering since exams are school-wide)
    return exams.filter(exam => !exam.is_locked);
  };

  const getFilteredSubjects = () => {
    if (!selectedExam) return subjects;

    const exam = exams.find(e => e.id === parseInt(selectedExam));
    if (!exam) return subjects;

    // TODO: Filter subjects based on class-subject assignments for the selected exam's class
    return subjects;
  };

  const getExamInfo = () => {
    if (!selectedExam) return null;
    return exams.find(e => e.id === parseInt(selectedExam));
  };

  const getMarksSummary = () => {
    const totalStudents = Object.keys(marksData).length;
    const enteredMarks = Object.values(marksData).filter(data =>
      data.marks_obtained !== null && data.marks_obtained !== undefined && !data.is_absent
    ).length;
    const absentStudents = Object.values(marksData).filter(data => data.is_absent).length;

    return { totalStudents, enteredMarks, absentStudents };
  };

  const exam = getExamInfo();
  const summary = getMarksSummary();



  const columns = [
    {
      title: "Student",
      key: "student",
      render: (_, record) => (
        <Space>
          <UserOutlined />
          <div>
            <Text strong>{record.first_name} {record.last_name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.admission_number}
            </Text>
          </div>
        </Space>
      ),
      width: 200,
      fixed: 'left',
    },
    {
      title: "Marks Obtained",
      key: "marks_obtained",
      render: (_, record) => (
        <Form.Item
          name={[record.id, 'marks_obtained']}
          style={{ margin: 0 }}
        >
          <InputNumber
            min={0}
            max={exam?.total_marks || 100}
            style={{ width: '100%' }}
            placeholder="Enter marks"
            disabled={marksData[record.id]?.is_absent}
            onChange={(value) => handleMarksChange(record.id, 'marks_obtained', value)}
          />
        </Form.Item>
      ),
      width: 150,
    },
    {
      title: "Absent",
      key: "is_absent",
      render: (_, record) => (
        <Form.Item
          name={[record.id, 'is_absent']}
          valuePropName="checked"
          style={{ margin: 0 }}
        >
          <Checkbox
            onChange={(e) => handleMarksChange(record.id, 'is_absent', e.target.checked)}
          />
        </Form.Item>
      ),
      width: 80,
    },
    {
      title: "Grade",
      key: "grade",
      render: (_, record) => {
        const data = marksData[record.id];
        if (data?.is_absent) {
          return <Tag color="orange">Absent</Tag>;
        }
        if (data?.marks_obtained && gradingSystem) {
          const gradeResult = calculateGrade(data.marks_obtained, gradingSystem);
          if (gradeResult) {
            return <Tag color="blue">{gradeResult.grade}</Tag>;
          }
        }
        return <Text type="secondary">-</Text>;
      },
      width: 80,
    },
    {
      title: "Remarks",
      key: "remarks",
      render: (_, record) => (
        <Form.Item
          name={[record.id, 'teacher_remarks']}
          style={{ margin: 0 }}
        >
          <Input
            placeholder="Teacher remarks"
            onChange={(e) => handleMarksChange(record.id, 'teacher_remarks', e.target.value)}
          />
        </Form.Item>
      ),
      width: 200,
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="!mb-2">
            <CalculatorOutlined className="mr-2" />
            Marks Entry
          </Title>
          <Text type="secondary">
            Enter and manage student marks for exams and assessments
          </Text>
        </div>
        <Space>
          <Button
            icon={<ReloadOutlined />}
            onClick={handleRefresh}
            disabled={!selectedExam || !selectedSubject}
          >
            Refresh
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSaveMarks}
            loading={saving}
            disabled={!selectedExam || !selectedSubject}
          >
            Save Marks
          </Button>
        </Space>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Row gutter={16}>
          <Col span={6}>
            <div className="mb-4">
              <Text strong className="block mb-2">Select Class</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Choose a class"
                value={selectedClass}
                onChange={handleClassChange}
                loading={loading}
                allowClear
              >
                {classes.map(cls => (
                  <Option key={cls.id} value={cls.id}>
                    {cls.name} ({cls.grade_level})
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col span={6}>
            <div className="mb-4">
              <Text strong className="block mb-2">Select Exam</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Choose an exam"
                value={selectedExam}
                onChange={handleExamChange}
                loading={loading}
              >
                {getFilteredExams().map(exam => (
                  <Option key={exam.id} value={exam.id}>
                    {exam.name} - {exam.term_name} ({exam.academic_year_name})
                    {exam.student_class ? ` - ${exam.student_class_name}` : ' - Whole School'}
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col span={6}>
            <div className="mb-4">
              <Text strong className="block mb-2">Select Subject</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Choose a subject"
                value={selectedSubject}
                onChange={handleSubjectChange}
                disabled={!selectedExam}
                loading={loading}
              >
                {getFilteredSubjects().map(subject => (
                  <Option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </Option>
                ))}
              </Select>
            </div>
          </Col>
          <Col span={6}>
            <div className="mb-4">
              <Text strong className="block mb-2">Exam Info</Text>
              {exam && (
                <Space direction="vertical" size="small">
                  <Text>Class: {exam.student_class_name || 'Whole School'}</Text>
                  <Text>Total Marks: {exam.total_marks}</Text>
                  <Text>Weight: {exam.weight_percentage}%</Text>
                </Space>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      {/* Summary Stats */}
      {selectedExam && selectedSubject && (
        <Row gutter={16} className="mb-6">
          <Col span={6}>
            <Card>
              <Statistic
                title="Total Students"
                value={summary.totalStudents}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Marks Entered"
                value={summary.enteredMarks}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: summary.enteredMarks > 0 ? '#3f8600' : '#cf1322' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Absent Students"
                value={summary.absentStudents}
                prefix={<ExclamationCircleOutlined />}
                valueStyle={{ color: summary.absentStudents > 0 ? '#faad14' : '#52c41a' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="Progress"
                value={summary.totalStudents > 0 ? Math.round((summary.enteredMarks / summary.totalStudents) * 100) : 0}
                suffix="%"
                prefix={<CalculatorOutlined />}
              />
              <Progress
                percent={summary.totalStudents > 0 ? Math.round((summary.enteredMarks / summary.totalStudents) * 100) : 0}
                size="small"
                status={summary.enteredMarks === summary.totalStudents ? 'success' : 'active'}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Marks Entry Table */}
      {selectedExam && selectedSubject ? (
        <Card>
          <Form form={marksForm}>
            <Table
              columns={columns}
              dataSource={students}
              rowKey="id"
              loading={loading}
              scroll={{ x: 800 }}
              pagination={{
                pageSize: 20,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} students`,
              }}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={4}>
                    <Text strong>Total Entries: {summary.enteredMarks} / {summary.totalStudents}</Text>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4}>
                    <Button
                      type="primary"
                      size="small"
                      onClick={handleSaveMarks}
                      loading={saving}
                      disabled={summary.enteredMarks === 0}
                    >
                      Save All
                    </Button>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
          </Form>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-12">
            <BookOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
            <Title level={4} className="mt-4">
              Select Exam and Subject
            </Title>
            <Text type="secondary">
              Choose an exam and subject to start entering marks for students
            </Text>
          </div>
        </Card>
      )}

      {/* Confirmation Modal */}
      <Modal
        title="Confirm Save Marks"
        open={confirmModalVisible}
        onOk={async () => {
          setSaving(true);
          setConfirmModalVisible(false);
          try {
            const response = await bulkCreateExamMarks({
              exam_id: selectedExam,
              subject_id: selectedSubject,
              marks_data: marksToConfirm,
            });

            const created = response?.data?.created || 0;
            const updated = response?.data?.updated || 0;

            showNotification.success(
              "Success",
              `Marks saved successfully! Created: ${created}, Updated: ${updated}`
            );

            // Refresh data
            await fetchExamMarksData();

          } catch (error) {
            console.error("Error saving marks:", error);
            handleApiError(error, "Failed to save marks");
          } finally {
            setSaving(false);
          }
        }}
        onCancel={() => {
          console.log("Modal cancelled");
          setConfirmModalVisible(false);
        }}
        confirmLoading={saving}
      >
        <p>Are you sure you want to save marks for {marksToConfirm.length} student(s)?</p>
        <p>This action cannot be undone.</p>
      </Modal>
    </div>
  );
}
