import React, { useState } from 'react';
import {
  Card, Row, Col, Select, Typography, Empty
} from 'antd';
import {
  LineChartOutlined, BarChartOutlined, PieChartOutlined
} from '@ant-design/icons';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

const { Title, Text } = Typography;
const { Option } = Select;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StudentCharts = ({ performanceData = [], attendanceData = [], studentName }) => {
  const [selectedSubject, setSelectedSubject] = useState(null);

  // Prepare performance chart data
  const getPerformanceChartData = () => {
    if (!performanceData || performanceData.length === 0) return [];

    if (selectedSubject) {
      const subjectData = performanceData.find(p => p.subject === selectedSubject);
      if (!subjectData) return [];

      return subjectData.data.map(item => ({
        exam: item.exam_name.length > 15 ? item.exam_name.substring(0, 15) + '...' : item.exam_name,
        marks: item.marks,
        grade: item.grade,
        fullExamName: item.exam_name
      }));
    }

    // Show all subjects in a combined view (average per exam)
    const examMap = new Map();

    performanceData.forEach(subject => {
      subject.data.forEach(exam => {
        const key = exam.exam_name;
        if (!examMap.has(key)) {
          examMap.set(key, { exam: key, totalMarks: 0, count: 0 });
        }
        const entry = examMap.get(key);
        entry.totalMarks += exam.marks;
        entry.count += 1;
      });
    });

    return Array.from(examMap.values()).map(entry => ({
      exam: entry.exam.length > 15 ? entry.exam.substring(0, 15) + '...' : entry.exam,
      marks: Math.round(entry.totalMarks / entry.count),
      fullExamName: entry.exam
    })).sort((a, b) => a.exam.localeCompare(b.exam));
  };

  // Prepare attendance chart data
  const getAttendanceChartData = () => {
    if (!attendanceData || attendanceData.length === 0) return [];

    return attendanceData.map(item => ({
      month: item.month,
      present: item.present,
      absent: item.absent,
      percentage: item.attendance_percentage
    }));
  };

  // Prepare attendance pie chart data
  const getAttendancePieData = () => {
    if (!attendanceData || attendanceData.length === 0) return [];

    const totalPresent = attendanceData.reduce((sum, item) => sum + item.present, 0);
    const totalAbsent = attendanceData.reduce((sum, item) => sum + item.absent, 0);

    return [
      { name: 'Present', value: totalPresent, color: '#52c41a' },
      { name: 'Absent', value: totalAbsent, color: '#ff4d4f' }
    ];
  };

  const performanceChartData = getPerformanceChartData();
  const attendanceChartData = getAttendanceChartData();
  const attendancePieData = getAttendancePieData();

  const hasPerformanceData = performanceData && performanceData.length > 0;
  const hasAttendanceData = attendanceData && attendanceData.length > 0;

  if (!hasPerformanceData && !hasAttendanceData) {
    return (
      <Card title={`Charts for ${studentName}`} style={{ marginTop: '16px' }}>
        <Empty description="No chart data available" />
      </Card>
    );
  }

  return (
    <Card
      title={`Performance & Attendance Charts - ${studentName}`}
      style={{ marginTop: '16px' }}
    >
      <Row gutter={[16, 16]}>
        {/* Performance Charts */}
        {hasPerformanceData && (
          <Col xs={24} lg={12}>
            <Card
              title={
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span><LineChartOutlined style={{ marginRight: '8px' }} />Academic Performance</span>
                  {performanceData.length > 1 && (
                    <Select
                      placeholder="Select subject"
                      style={{ width: 120, fontSize: '12px' }}
                      size="small"
                      allowClear
                      onChange={(value) => setSelectedSubject(value)}
                    >
                      <Option value={null}>All Subjects</Option>
                      {performanceData.map(subject => (
                        <Option key={subject.subject} value={subject.subject}>
                          {subject.subject}
                        </Option>
                      ))}
                    </Select>
                  )}
                </div>
              }
              size="small"
            >
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={performanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="exam"
                    fontSize={11}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis domain={[0, 100]} fontSize={11} />
                  <Tooltip
                    formatter={(value) => [`${value} marks`, 'Score']}
                    labelFormatter={(label) => performanceChartData.find(d => d.exam === label)?.fullExamName || label}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="marks"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}

        {/* Attendance Charts */}
        {hasAttendanceData && (
          <Col xs={24} lg={12}>
            <Card
              title={<span><BarChartOutlined style={{ marginRight: '8px' }} />Monthly Attendance</span>}
              size="small"
            >
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attendanceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip
                    formatter={(value, name) => [
                      `${value} days`,
                      name === 'present' ? 'Present' : 'Absent'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="present" fill="#52c41a" name="Present" />
                  <Bar dataKey="absent" fill="#ff4d4f" name="Absent" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}

        {/* Attendance Summary Pie Chart */}
        {hasAttendanceData && (
          <Col xs={24} md={12} lg={8}>
            <Card
              title={<span><PieChartOutlined style={{ marginRight: '8px' }} />Attendance Summary</span>}
              size="small"
            >
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={attendancePieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {attendancePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} days`, 'Days']} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        )}

        {/* Performance Summary */}
        {hasPerformanceData && (
          <Col xs={24} md={12} lg={8}>
            <Card
              title="Performance Summary"
              size="small"
            >
              <div style={{ padding: '8px 0' }}>
                {performanceData.slice(0, 3).map((subject, index) => {
                  const latestMark = subject.data[subject.data.length - 1];
                  return (
                    <div key={index} style={{ marginBottom: '12px' }}>
                      <Text strong style={{ fontSize: '12px' }}>
                        {subject.subject}
                      </Text>
                      <br />
                      <Text style={{ fontSize: '11px', color: '#666' }}>
                        Latest: {latestMark?.marks || 0} marks ({latestMark?.grade || 'N/A'})
                      </Text>
                    </div>
                  );
                })}
                {performanceData.length > 3 && (
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                    +{performanceData.length - 3} more subjects
                  </Text>
                )}
              </div>
            </Card>
          </Col>
        )}

        {/* Attendance Trends */}
        {hasAttendanceData && (
          <Col xs={24} md={12} lg={8}>
            <Card
              title="Attendance Trends"
              size="small"
            >
              <div style={{ padding: '8px 0' }}>
                {attendanceChartData.slice(-3).map((month, index) => (
                  <div key={index} style={{ marginBottom: '8px' }}>
                    <Text strong style={{ fontSize: '12px' }}>
                      {month.month}
                    </Text>
                    <br />
                    <Text style={{
                      fontSize: '11px',
                      color: month.percentage >= 80 ? '#52c41a' : month.percentage >= 60 ? '#faad14' : '#ff4d4f'
                    }}>
                      {month.percentage}% attendance ({month.present}/{month.present + month.absent} days)
                    </Text>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        )}
      </Row>
    </Card>
  );
};

export default StudentCharts;
