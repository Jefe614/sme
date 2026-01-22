import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Box,
  Chip,
  Avatar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Schedule as ScheduleIcon,
  EventBusy as EventBusyIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Class as ClassIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { teacherAttendanceApi, attendanceUtils } from '../../api/attendanceApi';

const TeacherAttendancePage = () => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [students, setStudents] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Load teacher's classes on mount
  useEffect(() => {
    loadTeacherClasses();
  }, []);

  // Load attendance data when class or date changes
  useEffect(() => {
    if (selectedClass) {
      loadAttendanceData();
    }
  }, [selectedClass, selectedDate]);

  const loadTeacherClasses = async () => {
    try {
      setLoading(true);
      // For demo purposes, using staff_id from query params or context
      // In real app, this would come from user context
      const staffId = new URLSearchParams(window.location.search).get('staff_id') || '1';

      const response = await teacherAttendanceApi.getTeacherClasses(staffId);
      setClasses(response.data.classes);

      // Auto-select first class if available
      if (response.data.classes.length > 0) {
        setSelectedClass(response.data.classes[0]);
      }
    } catch (err) {
      setError('Failed to load classes');
      console.error('Error loading classes:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceData = async () => {
    try {
      setLoading(true);
      const staffId = new URLSearchParams(window.location.search).get('staff_id') || '1';
      const dateStr = selectedDate.toISOString().split('T')[0];

      const response = await teacherAttendanceApi.getClassAttendanceData(
        selectedClass.id,
        dateStr,
        staffId
      );

      setStudents(response.data.students);

      // Initialize attendance data
      const initialAttendance = {};
      response.data.students.forEach(student => {
        initialAttendance[student.id] = {
          status: student.attendance?.status || 'present',
          remarks: student.attendance?.remarks || '',
          reason: student.attendance?.reason || ''
        };
      });
      setAttendanceData(initialAttendance);

    } catch (err) {
      setError('Failed to load attendance data');
      console.error('Error loading attendance data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleRemarksChange = (studentId, remarks) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        remarks
      }
    }));
  };

  const handleReasonChange = (studentId, reason) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        reason
      }
    }));
  };

  const getAttendanceIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircleIcon color="success" />;
      case 'absent':
        return <CancelIcon color="error" />;
      case 'late':
        return <ScheduleIcon color="warning" />;
      case 'excused':
        return <EventBusyIcon color="info" />;
      default:
        return <PersonIcon />;
    }
  };

  const markAllPresent = () => {
    const updatedAttendance = {};
    students.forEach(student => {
      updatedAttendance[student.id] = {
        status: 'present',
        remarks: '',
        reason: ''
      };
    });
    setAttendanceData(updatedAttendance);
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      setMessage('');
      setError('');

      const staffId = new URLSearchParams(window.location.search).get('staff_id') || '1';
      const dateStr = selectedDate.toISOString().split('T')[0];

      // Get current academic year and term - in real app, this would be determined automatically
      const academicYearId = '1'; // Default
      const termId = '1'; // Default

      const attendanceRecords = students.map(student => ({
        student_id: student.id,
        status: attendanceData[student.id]?.status || 'present',
        remarks: attendanceData[student.id]?.remarks || '',
        reason: attendanceData[student.id]?.reason || ''
      }));

      const attendancePayload = {
        date: dateStr,
        class_id: selectedClass.id,
        academic_year_id: academicYearId,
        term_id: termId,
        staff_id: staffId,
        attendance_records: attendanceRecords
      };

      const response = await teacherAttendanceApi.markAttendance(attendancePayload);

      setMessage(`Attendance saved successfully! Created: ${response.data.created}, Updated: ${response.data.updated}`);

      // Reload data to get latest state
      await loadAttendanceData();

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save attendance');
      console.error('Error saving attendance:', err);
    } finally {
      setSaving(false);
    }
  };

  const confirmSave = () => {
    const totalStudents = students.length;
    const presentCount = Object.values(attendanceData).filter(a => a.status === 'present').length;
    const absentCount = Object.values(attendanceData).filter(a => a.status === 'absent').length;

    setConfirmDialog({
      open: true,
      title: 'Confirm Attendance',
      message: `Total Students: ${totalStudents}\nPresent: ${presentCount}\nAbsent: ${absentCount}\n\nDo you want to save this attendance?`,
      onConfirm: () => {
        setConfirmDialog({ open: false });
        saveAttendance();
      }
    });
  };

  if (loading && classes.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Mark Attendance
        </Typography>

        {message && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Class and Date Selection */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Select Class
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {classes.map((classItem) => (
                  <Chip
                    key={classItem.id}
                    label={`${classItem.grade_level} ${classItem.section}`}
                    onClick={() => setSelectedClass(classItem)}
                    color={selectedClass?.id === classItem.id ? 'primary' : 'default'}
                    variant={selectedClass?.id === classItem.id ? 'filled' : 'outlined'}
                    icon={<ClassIcon />}
                  />
                ))}
              </Box>
            </Grid>

            <Grid item xs={12} md={4}>
              <Typography variant="h6" gutterBottom>
                Select Date
              </Typography>
              <DatePicker
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                renderInput={(params) => <TextField {...params} fullWidth />}
                maxDate={new Date()}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <Box display="flex" gap={1} mt={3}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadAttendanceData}
                  disabled={loading}
                >
                  Refresh
                </Button>
                <Button
                  variant="contained"
                  onClick={markAllPresent}
                  disabled={!selectedClass}
                >
                  Mark All Present
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Selected Class Info */}
        {selectedClass && (
          <Paper sx={{ p: 2, mb: 3, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
            <Typography variant="h6">
              {selectedClass.grade_level} {selectedClass.section} - {selectedClass.student_count} Students
            </Typography>
            <Typography variant="body2">
              Academic Year: {selectedClass.academic_year.name}
            </Typography>
          </Paper>
        )}

        {/* Attendance Marking */}
        {selectedClass && (
          <Paper sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <Typography variant="h6">
                Student Attendance - {selectedDate.toLocaleDateString()}
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={confirmSave}
                disabled={saving || students.length === 0}
              >
                {saving ? <CircularProgress size={20} /> : 'Save Attendance'}
              </Button>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : students.length === 0 ? (
              <Alert severity="info">
                No students found in this class.
              </Alert>
            ) : (
              <Grid container spacing={2}>
                {students.map((student) => (
                  <Grid item xs={12} key={student.id}>
                    <Card variant="outlined">
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box display="flex" alignItems="center" gap={2}>
                            <Avatar>{student.name.charAt(0)}</Avatar>
                            <Box>
                              <Typography variant="h6">{student.name}</Typography>
                              <Typography variant="body2" color="textSecondary">
                                Admission #: {student.admission_number}
                              </Typography>
                            </Box>
                          </Box>

                          <Box display="flex" alignItems="center" gap={2}>
                            {getAttendanceIcon(attendanceData[student.id]?.status)}
                            <RadioGroup
                              row
                              value={attendanceData[student.id]?.status || 'present'}
                              onChange={(e) => handleStatusChange(student.id, e.target.value)}
                            >
                              {attendanceUtils.STATUS_OPTIONS.map((option) => (
                                <FormControlLabel
                                  key={option.value}
                                  value={option.value}
                                  control={<Radio size="small" />}
                                  label={
                                    <Chip
                                      size="small"
                                      label={option.label}
                                      color={option.color}
                                      variant={attendanceData[student.id]?.status === option.value ? 'filled' : 'outlined'}
                                    />
                                  }
                                />
                              ))}
                            </RadioGroup>
                          </Box>
                        </Box>

                        {/* Remarks and Reason for absent/late */}
                        {(attendanceData[student.id]?.status === 'absent' ||
                          attendanceData[student.id]?.status === 'late' ||
                          attendanceData[student.id]?.status === 'excused') && (
                          <Box mt={2}>
                            <Divider sx={{ mb: 2 }} />
                            <Grid container spacing={2}>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="Remarks"
                                  size="small"
                                  value={attendanceData[student.id]?.remarks || ''}
                                  onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                                  placeholder="Additional notes..."
                                />
                              </Grid>
                              <Grid item xs={12} md={6}>
                                <TextField
                                  fullWidth
                                  label="Reason"
                                  size="small"
                                  value={attendanceData[student.id]?.reason || ''}
                                  onChange={(e) => handleReasonChange(student.id, e.target.value)}
                                  placeholder="Reason for absence/late..."
                                />
                              </Grid>
                            </Grid>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={confirmDialog.open} onClose={() => setConfirmDialog({ open: false })}>
          <DialogTitle>{confirmDialog.title}</DialogTitle>
          <DialogContent>
            <Typography whiteSpace="pre-line">
              {confirmDialog.message}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={confirmDialog.onConfirm} variant="contained">
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </LocalizationProvider>
  );
};

export default TeacherAttendancePage;
