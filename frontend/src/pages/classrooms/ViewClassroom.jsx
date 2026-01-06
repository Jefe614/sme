import {
  Table,
  Button,
  Card,
  Row,
  Col,
  Select,
  Input,
  Space,
  Popconfirm,
  Typography,
  Tag,
} from "antd";
import { EditOutlined, DeleteOutlined, EyeOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getClasses, deleteClass, updateClassStatus, getTeachers, getStudents } from "../../api/auth";
import { showNotification, handleApiError } from "../../utils/notifications";

const { Title } = Typography;
const { Option } = Select;

const ViewClassroom = () => {
  const navigate = useNavigate();
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchStudents();
  }, []);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await getClasses();
      setClasses(response.data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      handleApiError(error, "Unable to fetch classes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await getTeachers();
      setTeachers(response.data.teachers || []);
    } catch (error) {
      console.error("Error fetching teachers:", error);
      handleApiError(error, "Unable to fetch teachers.");
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await getStudents();
      setStudents(response.data.data || []);
    } catch (error) {
      console.error("Error fetching students:", error);
      handleApiError(error, "Unable to fetch students.");
    }
  };

  const handleDelete = async (classId) => {
    try {
      await deleteClass(classId);
      showNotification.success("Success", "Class deleted successfully");
      fetchClasses();
    } catch (error) {
      console.error("Error deleting class:", error);
      handleApiError(error, "Unable to delete class. Please try again.");
    }
  };

  const handleStatusChange = async (classRecord) => {
    try {
      await updateClassStatus(classRecord.id, !classRecord.is_active);
      showNotification.success("Success", `Class ${classRecord.is_active ? 'deactivated' : 'activated'} successfully`);
      fetchClasses();
    } catch (error) {
      console.error("Error updating class status:", error);
      handleApiError(error, "Unable to update class status. Please try again.");
    }
  };

  const filteredClasses = classes.filter(cls => {
    const matchesSearch = cls.name.toLowerCase().includes(searchText.toLowerCase()) ||
                         cls.class_code.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = filterStatus === 'all' ||
                         (filterStatus === 'active' && cls.is_active) ||
                         (filterStatus === 'inactive' && !cls.is_active);
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Class Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Class Code',
      dataIndex: 'class_code',
      key: 'class_code',
    },
    {
      title: 'Teacher',
      key: 'teacher',
      render: (record) => {
        const teacher = teachers?.find(t => t?.id === record?.teacher);
        return teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Not assigned';
      }
    },
    {
      title: 'Students',
      key: 'students_count',
      render: (record) => {
        const classStudents = students.filter(s => s.class_id === record.id);
        return classStudents.length;
      }
    },
    {
      title: 'Status',
      key: 'status',
      render: (record) => (
        <Tag color={record.is_active ? 'green' : 'red'}>
          {record.is_active ? 'Active' : 'Inactive'}
        </Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record) => (
        <Space>
          <Button
            icon={<EyeOutlined />}
            onClick={() => navigate(`/classrooms/view/${record.id}`)}
          />
          <Button
            icon={<EditOutlined />}
            onClick={() => navigate(`/classrooms/edit/${record.id}`)}
          />
          <Popconfirm
            title="Are you sure to delete this class?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={2}>Classrooms</Title>
      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input
              placeholder="Search classes..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col span={8}>
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: '100%' }}
            >
              <Option value="all">All Classes</Option>
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
            </Select>
          </Col>
          <Col span={8}>
            <Button
              type="primary"
              onClick={() => navigate('/school-dashboard/classrooms/add')}
            >
              Add New Class
            </Button>
          </Col>
        </Row>
        <Table
          columns={columns}
          dataSource={filteredClasses}
          loading={loading}
          rowKey="id"
        />
      </Card>
    </div>
  );
};

export default ViewClassroom;
