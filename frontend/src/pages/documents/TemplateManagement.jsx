import React, { useState, useEffect } from 'react';
import { Button, Table, Tag, Input, Select, Space, Modal, message, Card, Typography, Tooltip, Badge } from 'antd';
import { EditOutlined, EyeOutlined, DownloadOutlined, SearchOutlined, FilterOutlined, CloseCircleOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import {
  fetchTemplates,
  fetchTemplateCategories,
  downloadTemplate,
} from '../../api/templatesApi';

const { Title, Text } = Typography;
const { Option } = Select;

const TemplateManagement = () => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({});
  const [isPreviewModalVisible, setIsPreviewModalVisible] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState(null);
  const [searchValue, setSearchValue] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, [pagination.current, filters]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        pageSize: pagination.pageSize,
        current: pagination.current,
      };
      const response = await fetchTemplates(params);
      setTemplates(response.data);
      setPagination(prev => ({
        ...prev,
        total: response.pagination.total,
      }));
    } catch (error) {
      message.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await fetchTemplateCategories();
      setCategories(response.categories || []);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleDownload = async (templateId, templateName) => {
    try {
      const pdfBlob = await downloadTemplate(templateId);

      // Create a download link
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${templateName.replace(/\s+/g, '_')}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Clean up
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success('Template downloaded successfully');
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download template');
    }
  };

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, q: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleCategoryFilter = (value) => {
    setFilters(prev => ({ ...prev, category: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchValue('');
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 10, 200));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 10, 50));
  };

  const handleResetZoom = () => {
    setZoomLevel(100);
  };

  const activeFiltersCount = Object.keys(filters).filter(key => filters[key] !== undefined).length;

  const getCategoryTag = (category) => {
    const categoryLabels = {
      admission: 'Admission',
      transfer: 'Transfer',
      warning: 'Warning',
      suspension: 'Suspension',
      fee_reminder: 'Fee Reminder',
      clearance: 'Clearance',
      invitation: 'Invitation',
      notice: 'Notice',
      recommendation: 'Recommendation',
      employment: 'Employment',
      custom: 'Custom',
    };

    const colors = {
      admission: 'blue',
      transfer: 'green',
      warning: 'orange',
      suspension: 'red',
      fee_reminder: 'purple',
      clearance: 'cyan',
      invitation: 'magenta',
      notice: 'geekblue',
      recommendation: 'lime',
      employment: 'gold',
      custom: 'default',
    };

    return (
      <Tag color={colors[category] || 'default'}>
        {categoryLabels[category] || category}
      </Tag>
    );
  };

  const columns = [
    {
      title: 'Template Name',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      width: '25%',
      render: (name) => <Text strong>{name}</Text>,
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: '15%',
      render: (category) => getCategoryTag(category),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      width: '30%',
      render: (description) => (
        <Tooltip title={description}>
          <span style={{ color: '#666' }}>
            {description && description.length > 60 
              ? `${description.substring(0, 60)}...` 
              : description || 'No description'}
          </span>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'is_active',
      key: 'is_active',
      width: '10%',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'is_default',
      key: 'is_default',
      width: '12%',
      render: (isDefault) => (
        <Tag color={isDefault ? 'blue' : 'default'}>
          {isDefault ? 'System' : 'Custom'}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: '10%',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Preview">
            <Button
              icon={<EyeOutlined />}
              size="small"
              type="text"
              onClick={() => {
                setPreviewTemplate(record);
                setIsPreviewModalVisible(true);
                setZoomLevel(100);
              }}
            />
          </Tooltip>
          <Tooltip title="Download PDF">
            <Button
              icon={<DownloadOutlined />}
              size="small"
              type="primary"
              onClick={() => handleDownload(record.id, record.name)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
      <Card 
        bordered={false}
        style={{ 
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}
      >
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 8 }}>Document Templates</Title>
          <Text type="secondary">Preview and download document templates for school communications</Text>
        </div>

        <Card 
          size="small" 
          style={{ 
            marginBottom: 20, 
            background: '#fafafa',
            border: '1px solid #e8e8e8'
          }}
        >
          <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space wrap>
              <Input.Search
                placeholder="Search templates by name..."
                prefix={<SearchOutlined />}
                onSearch={handleSearch}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                style={{ width: 280 }}
                allowClear
              />
              <Select
                placeholder="Filter by category"
                allowClear
                style={{ width: 200 }}
                onChange={handleCategoryFilter}
                value={filters.category}
                suffixIcon={<FilterOutlined />}
              >
                {categories.map((category) => (
                  <Option key={category.value} value={category.value}>
                    {category.label}
                  </Option>
                ))}
              </Select>
              <Space>
                <input
                  type="checkbox"
                  id="showDefaults"
                  checked={filters.is_default === true}
                  onChange={(e) => {
                    const value = e.target.checked ? true : undefined;
                    setFilters(prev => ({ ...prev, is_default: value }));
                    setPagination(prev => ({ ...prev, current: 1 }));
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="showDefaults" style={{ margin: 0, cursor: 'pointer', userSelect: 'none' }}>
                  System Templates Only
                </label>
              </Space>
            </Space>
            {activeFiltersCount > 0 && (
              <Button 
                icon={<CloseCircleOutlined />} 
                onClick={clearAllFilters}
                size="small"
              >
                Clear Filters ({activeFiltersCount})
              </Button>
            )}
          </Space>
        </Card>

        <Table
          columns={columns}
          dataSource={templates}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `Showing ${range[0]}-${range[1]} of ${total} templates`,
            pageSizeOptions: ['10', '20', '50', '100'],
          }}
          onChange={handleTableChange}
          bordered
          size="middle"
        />

        {/* Enhanced Preview Modal */}
        <Modal
          title={
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              paddingRight: '50px' 
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '6px' }}>
                  {previewTemplate?.name}
                </div>
                <Space size="small">
                  {previewTemplate?.category && getCategoryTag(previewTemplate.category)}
                  <Tag color={previewTemplate?.is_default ? 'blue' : 'default'}>
                    {previewTemplate?.is_default ? 'System Template' : 'Custom Template'}
                  </Tag>
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    A4 Format (210mm × 297mm)
                  </Text>
                </Space>
              </div>
              <Space>
                <Space.Compact>
                  <Tooltip title="Zoom Out">
                    <Button
                      icon={<ZoomOutOutlined />}
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 50}
                    />
                  </Tooltip>
                  <Button 
                    onClick={handleResetZoom}
                    style={{ minWidth: '70px' }}
                  >
                    {zoomLevel}%
                  </Button>
                  <Tooltip title="Zoom In">
                    <Button
                      icon={<ZoomInOutlined />}
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 200}
                    />
                  </Tooltip>
                </Space.Compact>
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  size="large"
                  onClick={() => handleDownload(previewTemplate?.id, previewTemplate?.name)}
                  style={{ borderRadius: '6px' }}
                >
                  Download PDF
                </Button>
              </Space>
            </div>
          }
          open={isPreviewModalVisible}
          onCancel={() => setIsPreviewModalVisible(false)}
          footer={null}
          width="96vw"
          style={{ top: 10, maxWidth: '1600px' }}
          bodyStyle={{ 
            height: '86vh', 
            padding: '0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            overflow: 'hidden'
          }}
        >
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100%',
            padding: '30px 30px 60px',
            overflowY: 'auto',
            overflowX: 'auto',
          }}>
            {previewTemplate?.description && (
              <div style={{
                width: `${210 * (zoomLevel / 100)}mm`,
                padding: `${12 * (zoomLevel / 100)}px ${20 * (zoomLevel / 100)}px`,
                backgroundColor: 'rgba(255,255,255,0.98)',
                borderRadius: '8px 8px 0 0',
                fontSize: `${14 * (zoomLevel / 100)}px`,
                color: '#333',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                marginBottom: '0',
                border: '1px solid #e0e0e0',
                borderBottom: 'none',
                transition: 'all 0.3s ease',
              }}>
                <Text strong style={{ color: '#1890ff', fontSize: `${14 * (zoomLevel / 100)}px` }}>Template Description: </Text>
                <Text style={{ fontSize: `${14 * (zoomLevel / 100)}px` }}>{previewTemplate.description}</Text>
              </div>
            )}
            <div
              style={{
                width: `${210 * (zoomLevel / 100)}mm`,
                minHeight: `${297 * (zoomLevel / 100)}mm`,
                padding: `${25 * (zoomLevel / 100)}mm ${20 * (zoomLevel / 100)}mm`,
                backgroundColor: '#ffffff',
                color: '#000000',
                fontFamily: '"Times New Roman", Georgia, serif',
                fontSize: `${12 * (zoomLevel / 100)}pt`,
                lineHeight: '1.8',
                boxShadow: '0 30px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.05)',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                position: 'relative',
                borderRadius: previewTemplate?.description ? '0 0 2px 2px' : '2px',
                transition: 'all 0.3s ease',
                marginBottom: `${30 * (zoomLevel / 100)}px`,
              }}
            >
              {previewTemplate?.template_body}
            </div>
            <div style={{
              padding: '12px 24px',
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: '8px',
              color: '#666',
              fontSize: '13px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              maxWidth: `${210 * (zoomLevel / 100)}mm`,
            }}>
              <Text type="secondary">
                💡 This is a preview. Download the PDF for the final formatted document. Use zoom controls to adjust view.
              </Text>
            </div>
          </div>
        </Modal>
      </Card>
    </div>
  );
};

export default TemplateManagement;