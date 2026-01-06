import React, { useState } from 'react';
import {
  Modal,
  Upload,
  Button,
  message,
  Progress,
  Alert,
  Typography,
  Space,
  Divider,
  Tag,
} from 'antd';
import {
  UploadOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { bulkImportStudents, downloadStudentTemplate } from '../../api/auth';

const { Title, Text, Paragraph } = Typography;
const { Dragger } = Upload;

export default function BulkImportModal({ open, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (info) => {
    const file = info.file;
    setFile(file);
    setImportResult(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await downloadStudentTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'student_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      message.success('Template downloaded successfully!');
    } catch (error) {
      message.error('Failed to download template');
    }
  };

  const handleImport = async () => {
    if (!file) {
      message.error('Please select a file to import');
      return;
    }

    setUploading(true);
    setProgress(0);
    setImportResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await bulkImportStudents(formData);

      clearInterval(progressInterval);
      setProgress(100);

      setImportResult(response.data);

      if (response.data.success_count > 0) {
        message.success(`Successfully imported ${response.data.success_count} students!`);
        if (onSuccess) onSuccess();
      }

    } catch (error) {
      setProgress(0);
      message.error(error.response?.data?.error || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImportResult(null);
    setProgress(0);
    onClose();
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    accept: '.xlsx,.xls',
    beforeUpload: () => false, // Prevent auto upload
    onChange: handleFileChange,
    fileList: file ? [file] : [],
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FileExcelOutlined className="text-green-600" />
          <span>Bulk Import Students</span>
        </div>
      }
      open={open}
      onCancel={handleClose}
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Close
        </Button>,
        <Button
          key="import"
          type="primary"
          onClick={handleImport}
          loading={uploading}
          disabled={!file}
          icon={<UploadOutlined />}
        >
          {uploading ? 'Importing...' : 'Import Students'}
        </Button>
      ]}
      width={800}
    >
      <div className="space-y-6">
        {/* Instructions */}
        <div>
          <Title level={5}>Instructions</Title>
          <div className="bg-blue-50 p-4 rounded-lg">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Download the Excel template to see the required format</li>
              <li>Fill in student information in the Excel file</li>
              <li>Columns marked with * are required</li>
              <li>Upload the completed Excel file</li>
              <li>Review the import results before closing</li>
            </ul>
          </div>
        </div>

        {/* Download Template */}
        <div>
          <Space>
            <Button
              type="default"
              icon={<DownloadOutlined />}
              onClick={handleDownloadTemplate}
              className="border-green-500 text-green-600 hover:border-green-600"
            >
              Download Template
            </Button>
            <Text type="secondary">Get the Excel template with sample data and instructions</Text>
          </Space>
        </div>

        <Divider />

        {/* File Upload */}
        <div>
          <Title level={5}>Upload Excel File</Title>
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <FileExcelOutlined className="text-green-500" />
            </p>
            <p className="ant-upload-text">
              Click or drag Excel file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for .xlsx and .xls files only
            </p>
          </Dragger>
        </div>

        {/* Progress */}
        {uploading && (
          <div>
            <Text>Importing students...</Text>
            <Progress percent={progress} status="active" />
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <div className="space-y-4">
            <Title level={5}>Import Results</Title>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircleOutlined className="text-green-600" />
                  <Text strong className="text-green-600">Success</Text>
                </div>
                <Title level={3} className="text-green-600 m-0">
                  {importResult.success_count}
                </Title>
                <Text>Students imported</Text>
              </div>

              {importResult.error_count > 0 && (
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <ExclamationCircleOutlined className="text-red-600" />
                    <Text strong className="text-red-600">Errors</Text>
                  </div>
                  <Title level={3} className="text-red-600 m-0">
                    {importResult.error_count}
                  </Title>
                  <Text>Failed records</Text>
                </div>
              )}
            </div>

            {/* Success Details */}
            {importResult.imported_students && importResult.imported_students.length > 0 && (
              <div>
                <Text strong>Successfully Imported Students:</Text>
                <div className="mt-2 max-h-32 overflow-y-auto">
                  {importResult.imported_students.slice(0, 10).map((student, index) => (
                    <Tag key={index} color="green" className="mr-2 mb-1">
                      {student.name} ({student.admission_number})
                    </Tag>
                  ))}
                  {importResult.imported_students.length > 10 && (
                    <Text type="secondary">... and {importResult.imported_students.length - 10} more</Text>
                  )}
                </div>
              </div>
            )}

            {/* Error Details */}
            {importResult.errors && importResult.errors.length > 0 && (
              <Alert
                message="Import Errors"
                description={
                  <div className="max-h-32 overflow-y-auto">
                    {importResult.errors.slice(0, 5).map((error, index) => (
                      <div key={index} className="text-red-600 text-sm mb-1">
                        {error}
                      </div>
                    ))}
                    {importResult.errors.length > 5 && (
                      <Text type="secondary">... and {importResult.errors.length - 5} more errors</Text>
                    )}
                  </div>
                }
                type="error"
                showIcon
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
