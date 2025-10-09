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
  message,
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
  }, [isTeacherRoute]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const response = await getStaff();
      console.log("API Response:", response);
      
      // Handle the actual API response structure - staff is in response.data.staff
      let staffData = [];
      
      if (response && response.data && Array.isArray(response.data.staff)) {
        staffData = response.data.staff;
      } else if (Array.isArray(response)) {
        staffData = response;
      } else if (response && Array.isArray(response.data)) {
        staffData = response.data;
      }
      
      console.log("Processed staff data:", staffData);
      
      // Filter for teachers if on teacher route
      const filteredStaff = isTeacherRoute 
        ? staffData.filter(s => s.staff_type === "teaching") 
        : staffData;
      
      setStaff(filteredStaff);
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

  const handleDelete = async (id) => {
  console.log("Deleting staff with ID:", id); // Debug log
  
  if (!id) {
    console.error("Staff ID is undefined or null");
    // You can show a small notification instead of Swal
    message.error("Invalid staff ID");
    return;
  }

  try {
    await deleteStaff(id);
    // Remove the Swal.fire success notification
    // The Popconfirm already handled the confirmation
    fetchStaff(); // Just refresh the staff list
  } catch (error) {
    console.error("Error deleting staff:", error);
    console.error("Full error response:", error.response);
    
    const errorMessage = error.response?.data?.error || error.message || "Failed to delete staff";
    
    message.error(errorMessage);
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

  const getStaffRoleDisplay = (role) => {
    const roleMap = {
      'teacher': 'Teacher',
      'head_teacher': 'Head Teacher',
      'deputy_head': 'Deputy Head',
      'department_head': 'Department Head',
      'secretary': 'Secretary',
      'accountant': 'Accountant',
      'librarian': 'Librarian',
      'nurse': 'Nurse',
      'counselor': 'Counselor',
      'security': 'Security',
      'cleaner': 'Cleaner',
      'driver': 'Driver',
      'cook': 'Cook'
    };
    return roleMap[role] || role;
  };

  const getStaffTypeDisplay = (type) => {
    const typeMap = {
      'teaching': 'Teaching',
      'non_teaching': 'Non-Teaching',
      'administrative': 'Administrative',
      'support': 'Support'
    };
    return typeMap[type] || type;
  };

  const getDepartmentDisplay = (dept) => {
    const deptMap = {
      'academic': 'Academic',
      'administration': 'Administration',
      'finance': 'Finance',
      'it': 'IT',
      'library': 'Library',
      'sports': 'Sports',
      'science': 'Science',
      'humanities': 'Humanities',
      'languages': 'Languages',
      'mathematics': 'Mathematics',
      'guidance': 'Guidance',
      'medical': 'Medical',
      'maintenance': 'Maintenance'
    };
    return deptMap[dept] || dept;
  };

  const formatPhoneNumber = (phone) => {
    if (!phone) return '-';
    return phone;
  };

  const columns = [
    {
      title: "Name",
      key: "name",
      render: (_, record) => (
        <Space>
          <Avatar 
            size="small" 
            src={record.profile_image} 
            icon={!record.profile_image && <UserOutlined />} 
          />
          <div>
            <Text strong>{record.full_name || `${record.first_name} ${record.last_name}`}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {record.personal_email || 'No email'}
            </Text>
          </div>
        </Space>
      ),
      fixed: 'left',
      width: 200,
    },
    {
      title: "Staff ID",
      dataIndex: "staff_id",
      key: "staff_id",
      render: (id) => id || '-',
    },
    {
      title: "Role",
      dataIndex: "staff_role",
      key: "staff_role",
      render: (role) => role ? <Tag color="blue">{getStaffRoleDisplay(role)}</Tag> : '-',
    },
    {
      title: "Type",
      dataIndex: "staff_type",
      key: "staff_type",
      render: (type) => type ? <Tag color={type === 'teaching' ? 'green' : 'geekblue'}>{getStaffTypeDisplay(type)}</Tag> : '-',
    },
    {
      title: "Department",
      dataIndex: "department",
      key: "department",
      render: (dept) => (dept ? <Tag color="orange">{getDepartmentDisplay(dept)}</Tag> : "-"),
    },
    {
      title: "Phone",
      dataIndex: "personal_phone",
      key: "personal_phone",
      render: (phone) => formatPhoneNumber(phone),
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
      fixed: 'right',
      width: 120,
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
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} ${isTeacherRoute ? 'teachers' : 'staff'}`,
          }}
        />
      </Card>
    </div>
  );
}