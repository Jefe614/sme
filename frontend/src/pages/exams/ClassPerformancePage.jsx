import React, { useState, useEffect } from "react";
import {
  Button,
  Card,
  Table,
  Tag,
  Typography,
  Space,
  Select,
  Row,
  Col,
  Statistic,
  Progress,
  Spin,
} from "antd";
import {
  BarChartOutlined,
  LineChartOutlined,
  PieChartOutlined,
  TrophyOutlined,
  UserOutlined,
  BookOutlined,
  CalculatorOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import {
  fetchClassPerformance,
} from "../../api/examApi";
import { fetchAcademicYears, fetchTerms } from "../../api/academicApi";
import { getClasses } from "../../api/auth";
import { showNotification, handleApiError } from "../../utils/notifications";

const { Title, Text } = Typography;
const { Option } = Select;

export default function ClassPerformancePage() {
  const [loading, setLoading] = useState(false);
  const [performanceData, setPerformanceData] = useState(null);
  const [classes, setClasses] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [terms, setTerms] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState(null);
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedClass && selectedTerm && selectedAcademicYear) {
      fetchPerformanceData();
    }
  }, [selectedClass, selectedTerm, selectedAcademicYear]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [classesRes, academicYearsRes, termsRes] = await Promise.all([
        getClasses(),
        fetchAcademicYears(),
        fetchTerms(),
      ]);

      setClasses(classesRes.data || []);
      setAcademicYears(academicYearsRes.data || []);
      setTerms(termsRes.data || []);
    } catch (error) {
      console.error("Error fetching initial data:", error);
      handleApiError(error, "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformanceData = async () => {
    if (!selectedClass || !selectedTerm || !selectedAcademicYear) return;

    setLoading(true);
    try {
      const response = await fetchClassPerformance({
        class_id: selectedClass,
        term_id: selectedTerm,
        academic_year_id: selectedAcademicYear,
      });

      setPerformanceData(response.data);
    } catch (error) {
      console.error("Error fetching performance data:", error);
      handleApiError(error, "Failed to load performance data");
      setPerformanceData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (classId) => {
    setSelectedClass(classId);
  };

  const handleTermChange = (termId) => {
    setSelectedTerm(termId);
  };

  const handleAcademicYearChange = (yearId) => {
    setSelectedAcademicYear(yearId);
  };

  const handleDownloadReport = () => {
    // TODO: Implement report download
    showNotification.info("Info", "Report download feature coming soon!");
  };



  const getPerformanceColor = (score) => {
    if (score >= 80) return '#52c41a';
    if (score >= 70) return '#73d13d';
    if (score >= 60) return '#95de64';
    if (score >= 50) return '#fff566';
    if (score >= 40) return '#ff9c6e';
    return '#ff4d4f';
  };

  const studentColumns = [
    {
      title: "Rank",
      dataIndex: "rank",
      key: "rank",
      render: (text, record, index) => (
        <Space>
          {index < 3 ? <TrophyOutlined style={{ color: '#faad14' }} /> : null}
          <Text strong>{index + 1}</Text>
        </Space>
      ),
      width: 80,
    },
    {
      title: "Student",
      dataIndex: "student_name",
      key: "student_name",
      render: (name, record) => (
        <Space>
          <UserOutlined />
          <div>
            <Text strong>{name}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.admission_number}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Mean Score",
      dataIndex: "mean_score",
      key: "mean_score",
      render: (score) => (
        <Text strong style={{ color: getPerformanceColor(score) }}>
          {score?.toFixed(1)}%
        </Text>
      ),
      sorter: (a, b) => (a.mean_score || 0) - (b.mean_score || 0),
    },
    {
      title: "Subjects",
      dataIndex: "subject_count",
      key: "subject_count",
      render: (count) => `${count} subjects`,
    },
    {
      title: "Performance",
      key: "performance",
      render: (_, record) => {
        const score = record.mean_score || 0;
        let level = 'Poor';
        if (score >= 80) level = 'Excellent';
        else if (score >= 70) level = 'Very Good';
        else if (score >= 60) level = 'Good';
        else if (score >= 50) level = 'Fair';

        return <Tag color={getPerformanceColor(score)}>{level}</Tag>;
      },
    },
  ];

  const subjectColumns = [
    {
      title: "Subject",
      dataIndex: "subject_name",
      key: "subject_name",
      render: (name) => (
        <Space>
          <BookOutlined />
          <Text strong>{name}</Text>
        </Space>
      ),
    },
    {
      title: "Average Mark",
      dataIndex: "average_mark",
      key: "average_mark",
      render: (avg) => avg ? `${avg.toFixed(1)}` : '-',
      sorter: (a, b) => (a.average_mark || 0) - (b.average_mark || 0),
    },
    {
      title: "Pass Rate",
      dataIndex: "pass_rate",
      key: "pass_rate",
      render: (rate) => (
        <Space>
          <Text>{rate?.toFixed(1)}%</Text>
          <Progress
            percent={rate}
            size="small"
            status={rate >= 70 ? 'success' : rate >= 50 ? 'normal' : 'exception'}
            showInfo={false}
          />
        </Space>
      ),
      sorter: (a, b) => (a.pass_rate || 0) - (b.pass_rate || 0),
    },
    {
      title: "Students",
      dataIndex: "total_students",
      key: "total_students",
      render: (count) => `${count} students`,
    },
    {
      title: "Performance",
      key: "performance",
      render: (_, record) => {
        const rate = record.pass_rate || 0;
        let level = 'Poor';
        let color = 'red';
        if (rate >= 80) { level = 'Excellent'; color = 'green'; }
        else if (rate >= 70) { level = 'Good'; color = 'blue'; }
        else if (rate >= 60) { level = 'Fair'; color = 'orange'; }

        return <Tag color={color}>{level}</Tag>;
      },
    },
  ];

  const renderChart = () => {
    if (!performanceData?.subject_performance) return null;

    const data = performanceData.subject_performance.map(subject => ({
      subject: subject.subject_name,
      average: subject.average_mark || 0,
      passRate: subject.pass_rate || 0,
    }));

    // Simple chart representation - in real app, use proper charting library
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Subject Average Marks">
          <div className="space-y-4">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <Text className="w-1/3 truncate">{item.subject}</Text>
                <div className="flex-1 mx-4">
                  <Progress
                    percent={item.average}
                    size="small"
                    strokeColor={getPerformanceColor(item.average)}
                    status={item.average >= 50 ? 'success' : 'exception'}
                  />
                </div>
                <Text strong className="w-16 text-right">{item.average.toFixed(1)}</Text>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Subject Pass Rates">
          <div className="space-y-4">
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <Text className="w-1/3 truncate">{item.subject}</Text>
                <div className="flex-1 mx-4">
                  <Progress
                    percent={item.passRate}
                    size="small"
                    strokeColor={item.passRate >= 70 ? '#52c41a' : item.passRate >= 50 ? '#faad14' : '#ff4d4f'}
                    status={item.passRate >= 70 ? 'success' : item.passRate >= 50 ? 'normal' : 'exception'}
                  />
                </div>
                <Text strong className="w-16 text-right">{item.passRate.toFixed(1)}%</Text>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="!mb-2">
            <BarChartOutlined className="mr-2" />
            Class Performance Analysis
          </Title>
          <Text type="secondary">
            Analyze class performance, subject trends, and student rankings
          </Text>
        </div>
        <Space>
          {performanceData && (
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleDownloadReport}
            >
              Download Report
            </Button>
          )}
          <Select
            value={chartType}
            onChange={setChartType}
            style={{ width: 120 }}
          >
            <Option value="bar"><BarChartOutlined /> Bar</Option>
            <Option value="line"><LineChartOutlined /> Line</Option>
            <Option value="pie"><PieChartOutlined /> Pie</Option>
          </Select>
        </Space>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Row gutter={16}>
          <Col span={8}>
            <div className="mb-4">
              <Text strong className="block mb-2">Select Class</Text>
              <Select
                style={{ width: '100%' }}
                placeholder="Choose a class"
                value={selectedClass}
                onChange={handleClassChange}
                loading={loading}
              >
                {classes.map(cls => (
                  <Option key={cls.id} value={cls.id}>{cls.name}</Option>
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

      {/* Performance Overview */}
      {loading ? (
        <div className="text-center py-12">
          <Spin size="large" />
          <div className="mt-4">
            <Text>Loading performance data...</Text>
          </div>
        </div>
      ) : performanceData ? (
        <div className="space-y-6">
          {/* Key Metrics */}
          <Row gutter={16}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Class Average"
                  value={performanceData.class_average}
                  suffix="%"
                  valueStyle={{ color: getPerformanceColor(performanceData.class_average) }}
                  prefix={<CalculatorOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Total Students"
                  value={performanceData.total_students}
                  prefix={<UserOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Subjects Analyzed"
                  value={performanceData.subject_performance?.length || 0}
                  prefix={<BookOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Top Performer"
                  value={performanceData.student_rankings?.[0]?.mean_score?.toFixed(1) || 0}
                  suffix="%"
                  valueStyle={{ color: '#faad14' }}
                  prefix={<TrophyOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {/* Student Rankings */}
          <Card title="Student Performance Rankings">
            <Table
              columns={studentColumns}
              dataSource={performanceData.student_rankings || []}
              rowKey="admission_number"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} students`,
              }}
            />
          </Card>

          {/* Subject Performance */}
          <Card title="Subject Performance Analysis">
            <Table
              columns={subjectColumns}
              dataSource={performanceData.subject_performance || []}
              rowKey="subject_name"
              pagination={false}
            />
          </Card>

          {/* Charts */}
          <Card title="Performance Visualizations">
            {renderChart()}
          </Card>

          {/* Performance Insights */}
          <Card title="Performance Insights">
            <Row gutter={16}>
              <Col span={12}>
                <div className="space-y-4">
                  <div>
                    <Text strong>Strengths:</Text>
                    <ul className="mt-2 ml-4 list-disc">
                      {performanceData.subject_performance
                        ?.filter(sub => (sub.average_mark || 0) >= 70)
                        .slice(0, 3)
                        .map((subject, index) => (
                          <li key={index}>
                            <Text>{subject.subject_name} ({subject.average_mark?.toFixed(1)}%)</Text>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="space-y-4">
                  <div>
                    <Text strong>Areas for Improvement:</Text>
                    <ul className="mt-2 ml-4 list-disc">
                      {performanceData.subject_performance
                        ?.filter(sub => (sub.average_mark || 0) < 50)
                        .slice(0, 3)
                        .map((subject, index) => (
                          <li key={index}>
                            <Text>{subject.subject_name} ({subject.average_mark?.toFixed(1)}%)</Text>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </div>
      ) : (
        selectedClass && selectedTerm && selectedAcademicYear ? (
          <Card>
            <div className="text-center py-12">
              <BarChartOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
              <Title level={4} className="mt-4">
                No Performance Data Available
              </Title>
              <Text type="secondary">
                No exam marks found for the selected class, term, and academic year combination.
              </Text>
            </div>
          </Card>
        ) : (
          <Card>
            <div className="text-center py-12">
              <BarChartOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />
              <Title level={4} className="mt-4">
                Select Class and Term
              </Title>
              <Text type="secondary">
                Choose a class, academic year, and term to view performance analysis
              </Text>
            </div>
          </Card>
        )
      )}
    </div>
  );
}
