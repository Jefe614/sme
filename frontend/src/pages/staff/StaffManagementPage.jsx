// src/pages/staff/StaffManagementPage.jsx
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  Card,
  Table,
  Tag,
  Typography,
  Switch,
  Space,
  Popconfirm,
  Tooltip,
  Avatar,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
} from "@ant-design/icons";
import Swal from "sweetalert2";
import { getStaff, deleteStaff, updateStaff } from "../../api/auth";

const { Title, Text } = Typography;

export default function StaffManagementPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isTeacherRoute = location.pathname.includes("/teachers");

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const { data } = await getStaff();
      setStaff(isTeacherRoute ? data.filter(s => s.staff_type === "teaching") : data);
    } catch (error) {
      console.error("Error fetching staff:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to load staff",
        icon: "error",
        confirmButtonText: "OK",
        width: "600px",
        customClass: { popup: "large-success-modal" },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (staffId) => {
    try {
      await deleteStaff(staffId);
      await Swal.fire({
        title: "Success!",
        text: "Staff deleted successfully!",
        icon: "success",
        confirmButtonText: "OK",
        width: "600px",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "large-success-modal" },
      });
      fetchStaff();
    } catch (error) {
      console.error("Error deleting staff:", error);
      Swal.fire({
        title: "Error",
        text: error.response?.data?.message || "Failed to delete staff",
        icon: "error",
        confirmButtonText: "OK",
        width: "600px",
        customClass: { popup: "large-success-modal" },
      });
    }
  };

  const handleStatusToggle = async (staff) => {
    try {
      await updateStaff(staff.id, { is_active: !staff.is_active });
      await Swal.fire({
        title: "Success!",
        text: `Staff ${staff.is_active ? "deactivated" : "activated"} successfully!`,
        icon: "success",
        confirmButtonText: "OK",
        width: "600px",
        timer: 2000,
        timerProgressBar: true,
        customClass: { popup: "large-success-modal" },
      });
      fetchStaff();
    } catch (error) {
      console.error("Error updating staff status:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to update staff status",
        icon: "error",
        confirmButtonText: "OK",
        width: "600px",
        customClass: { popup: "large-success-modal" },
      });
    }
  };

  const columns = [
    {
      title: "Name",
      key: "name",
      render: (_, record) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} />
          <Text strong>{`${record.first_name} ${record.last_name}`}</Text>
        </Space>
      ),
    },
    {
      title: "Staff ID",
      dataIndex: "staff_id",
      key: "staff_id",
    },
    {
      title: "Role",
      dataIndex: "staff_role",
      key: "staff_role",
      render: (role) => <Tag color="blue">{role}</Tag>,
    },
    {
      title: "Type",
      dataIndex: "staff_type",
      key: "staff_type",
      render: (type) => <Tag color="geekblue">{type}</Tag>,
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (dept) => (dept ? <Tag>{dept}</Tag> : "-"),
    },
    {
      title: "Status",
      dataIndex: "is_active",
      key: "is_active",
      render: (isActive, record) => (
        <Switch
          checked={isActive}
          onChange={() => handleStatusToggle(record)}
          size="small"
          checkedChildren="Active"
          unCheckedChildren="Inactive"
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => navigate(`/school-dashboard/staff/edit/${record.id}`)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Staff"
            description="Are you sure you want to delete this staff member?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okType="danger"
          >
            <Tooltip title="Delete">
              <Button icon={<DeleteOutlined />} size="small" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2} className="!mb-2">
            {isTeacherRoute ? "Teacher Management" : "Staff Management"}
          </Title>
          <Text type="secondary">
            {isTeacherRoute
              ? "Manage teaching staff"
              : "Manage all staff members"}
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="large"
          onClick={() => navigate("/school-dashboard/staff/add", { state: { isTeacher: isTeacherRoute } })}
        >
          Add New {isTeacherRoute ? "Teacher" : "Staff"}
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={staff}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} staff`,
          }}
        />
      </Card>
    </div>
  );
}