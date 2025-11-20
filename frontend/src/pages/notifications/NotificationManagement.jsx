import React, { useState, useEffect } from 'react';
import {
  Card, Typography, Space, Button, Table, Modal, Form, Input,
  Select, Radio, Divider, List, Badge, Tag, message, Spin, Statistic
} from 'antd';
import {
  SendOutlined, MessageOutlined, MailOutlined,
  HistoryOutlined, ExclamationCircleOutlined, UserOutlined
} from '@ant-design/icons';
import parentApi from '../../api/parentApi';
import { showNotification } from '../../utils/notifications';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { confirm } = Modal;

const NotificationManagement = () => {
  const [loading, setLoading] = useState(false);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [parents, setParents] = useState([]);
  const [form] = Form.useForm();
  const [sendForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [notificationsRes, studentsRes] = await Promise.all([
        parentApi.getNotifications(),
        parentApi.getStudentsForNotification()
      ]);

      setNotifications(notificationsRes.data);
      setStudents(studentsRes.data.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      showNotification.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async (values) => {
    try {
      setLoading(true);

      // Determine recipients
      let studentIds;
      if (values.recipientType === 'all') {
        studentIds = students.map(s => s.id);
      } else {
        studentIds = values.studentIds || [];
      }

      if (!studentIds.length) {
        showNotification.error('No recipients selected');
        return;
      }

      const requestData = {
        notification_type: values.notificationType,
        subject: values.subject,
        message: values.message,
        student_ids: studentIds
      };

      await parentApi.sendNotification(requestData);

      showNotification.success('Notifications sent successfully');
      setSendModalVisible(false);
      sendForm.resetFields();
      loadData(); // Refresh notifications list

    } catch (error) {
      console.error('Error sending notification:', error);
      showNotification.error('Failed to send notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleSendFeeReminders = async () => {
    confirm({
      title: 'Send Fee Reminders',
      icon: <ExclamationCircleOutlined />,
      content: 'This will send fee payment reminders to all parents with outstanding fees. Continue?',
      okText: 'Send',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          await parentApi.sendFeeReminders();
          showNotification.success('Fee reminders sent successfully');
          loadData();
        } catch (error) {
          console.error('Error sending fee reminders:', error);
          showNotification.error('Failed to send fee reminders');
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      sent: 'blue',
      delivered: 'green',
      failed: 'red'
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'green',
      medium: 'blue',
      high: 'orange',
      urgent: 'red'
    };
    return colors[priority] || 'default';
  };

  const notificationsColumns = [
    {
      title: 'Type',
      dataIndex: 'notification_type',
      key: 'notification_type',
      render: (type) => (
        <Space>
          {type === 'email' ? <MailOutlined /> : <MessageOutlined />}
          {type.toUpperCase()}
        </Space>
      ),
      filters: [
        { text: 'Email', value: 'email' },
        { text: 'SMS', value: 'sms' }
      ],
      onFilter: (value, record) => record.notification_type === value
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      ellipsis: true
    },
    {
      title: 'Recipient',
      dataIndex: 'parent_name',
      key: 'parent_name',
      render: (name, record) => name || `${record.recipient_phone || record.recipient_email}`
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>{priority.toUpperCase()}</Tag>
      ),
      filters: [
        { text: 'Low', value: 'low' },
        { text: 'Medium', value: 'medium' },
        { text: 'High', value: 'high' },
        { text: 'Urgent', value: 'urgent' }
      ]
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Badge status={getStatusColor(status)} text={status.toUpperCase()} />
      ),
      filters: [
        { text: 'Pending', value: 'pending' },
        { text: 'Sent', value: 'sent' },
        { text: 'Delivered', value: 'delivered' },
        { text: 'Failed', value: 'failed' }
      ]
    },
    {
      title: 'Sent Date',
      dataIndex: 'sent_at',
      key: 'sent_at',
      render: (date) => date ? new Date(date).toLocaleDateString() : '-',
      sorter: (a, b) => new Date(a.sent_at) - new Date(b.sent_at)
    }
  ];

  return (
    <div>
      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={3}>📢 Parent Communications</Title>
              <Text type="secondary">
                Send notifications and messages to parents via SMS and email
              </Text>
            </div>

            <Space>
              <Button
                type="primary"
                danger
                icon={<ExclamationCircleOutlined />}
                onClick={handleSendFeeReminders}
                loading={loading}
              >
                Send Fee Reminders
              </Button>

              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={() => setSendModalVisible(true)}
              >
                Send Notification
              </Button>
            </Space>
          </div>

          <Divider />

          {/* Quick Stats */}
          <Space direction="horizontal" size="large" wrap>
            <Card size="small">
              <Statistic
                title="Total Parents"
                value={parents.length}
                prefix={<UserOutlined />}
              />
            </Card>

            <Card size="small">
              <Statistic
                title="Emails Sent Today"
                value={notifications.filter(n =>
                  n.notification_type === 'email' &&
                  n.sent_at &&
                  new Date(n.sent_at).toDateString() === new Date().toDateString()
                ).length}
                prefix={<MailOutlined />}
              />
            </Card>

            <Card size="small">
              <Statistic
                title="SMS Sent Today"
                value={notifications.filter(n =>
                  n.notification_type === 'sms' &&
                  n.sent_at &&
                  new Date(n.sent_at).toDateString() === new Date().toDateString()
                ).length}
                prefix={<MessageOutlined />}
              />
            </Card>
          </Space>

          {/* Notifications Table */}
          <div>
            <div style={{ marginBottom: 16 }}>
              <Title level={4}>
                <HistoryOutlined /> Notification History
              </Title>
            </div>

            <Table
              columns={notificationsColumns}
              dataSource={notifications}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} notifications`
              }}
              expandable={{
                expandedRowRender: (record) => (
                  <div>
                    <Paragraph><strong>Message:</strong> {record.message}</Paragraph>
                    {record.error_message && (
                      <Paragraph type="danger">
                        <strong>Error:</strong> {record.error_message}
                      </Paragraph>
                    )}
                    <Text type="secondary">
                      Reference: {record.reference_number}
                    </Text>
                  </div>
                )
              }}
            />
          </div>
        </Space>
      </Card>

      {/* Send Notification Modal */}
      <Modal
        title="Send Notification to Parents"
        open={sendModalVisible}
        onCancel={() => setSendModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={sendForm}
          layout="vertical"
          onFinish={handleSendNotification}
        >
          <Form.Item
            name="notificationType"
            label="Notification Type"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio value="email">📧 Email</Radio>
              <Radio value="sms">📱 SMS</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true }]}
          >
            <Input placeholder="Notification subject" />
          </Form.Item>

          <Form.Item
            name="message"
            label="Message"
            rules={[{ required: true }]}
          >
            <TextArea
              rows={4}
              placeholder="Enter your message..."
              showCount
              maxLength={160} // SMS length limit
            />
          </Form.Item>

          <Form.Item
            name="recipientType"
            label="Recipients"
            rules={[{ required: true }]}
          >
            <Radio.Group>
              <Radio value="all">All Parents ({parents.length})</Radio>
              <Radio value="selected">Selected Parents</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.recipientType !== currentValues.recipientType
            }
          >
            {({ getFieldValue }) =>
              getFieldValue('recipientType') === 'selected' ? (
                <Form.Item
                  name="parentIds"
                  label="Select Parents"
                  rules={[{ required: true, message: 'Please select at least one parent' }]}
                >
                  <Select
                    mode="multiple"
                    placeholder="Select parents"
                    style={{ width: '100%' }}
                    optionFilterProp="children"
                    showSearch
                  >
                    {parents.map(parent => (
                      <Option key={parent.id} value={parent.id}>
                        {parent.full_name} (Children: {parent.students.length})
                      </Option>
                    ))}
                  </Select>
                </Form.Item>
              ) : null
            }
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                Send Notification
              </Button>
              <Button onClick={() => setSendModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NotificationManagement;
