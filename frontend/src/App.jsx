import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { ConfigProvider } from 'antd';
import { AuthProvider } from './context/AuthContext';
// import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import DashboardSidebarLayout from './components/DashboardSidebarLayout';

// Lazy load all page components
const Login = React.lazy(() => import('./pages/Login'));
const Signup = React.lazy(() => import('./pages/Signup'));
const ForgotPassword = React.lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/ResetPassword'));
const SmeDashboard = React.lazy(() => import('./pages/SmeDashboard'));
const SchoolDashboard = React.lazy(() => import('./pages/SchoolDashboard'));
const StudentCreationPage = React.lazy(() => import('./pages/students/AddStudents'));
const StudentsListPage = React.lazy(() => import('./pages/students/ViewStudents'));
const ViewStudentPage = React.lazy(() => import('./pages/students/ViewStudent'));
const EditStudentPage = React.lazy(() => import('./pages/students/EditStudent'));
const ClassManagementPage = React.lazy(() => import('./pages/classrooms/ViewClassroom'));
const CreateClassPage = React.lazy(() => import('./pages/classrooms/AddClassRoom'));
const StaffManagementPage = React.lazy(() => import('./pages/staff/StaffManagementPage'));
const CreateStaffPage = React.lazy(() => import('./pages/staff/CreateStaffPage'));
const FeeManagement = React.lazy(() => import('./pages/fees/FeeManagement'));
const StructureManagement = React.lazy(() => import('./pages/fees/StructureManagement'));
const PaymentManagement = React.lazy(() => import('./pages/fees/PaymentManagement'));
const NotFoundPage = React.lazy(() => import('./pages/NotFoundPage'));
const TemplateManagement = React.lazy(() => import('./pages/documents/TemplateManagement'));
const NotificationManagement = React.lazy(() => import('./pages/notifications/NotificationManagement'));
const AcademicYearManagementPage = React.lazy(() => import('./pages/academic/AcademicYearManagementPage'));
const TermManagementPage = React.lazy(() => import('./pages/academic/TermManagementPage'));
const ClassSubjectAssignmentManagementPage = React.lazy(() => import('./pages/academic/ClassSubjectAssignmentManagementPage'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPassword />} />

            {/* SME Dashboard with Layout */}
            <Route
              path="/sme-dashboard/*"
              element={
                <PrivateRoute>
                  <DashboardSidebarLayout userType="SME">
                    <Suspense fallback={<div>Loading...</div>}>
                      <Routes>
                        <Route index element={<SmeDashboard />} />
                        {/* Add other SME sub-routes here */}
                      </Routes>
                    </Suspense>
                  </DashboardSidebarLayout>
                </PrivateRoute>
              }
            />

            {/* School Dashboard with Layout */}
            <Route
              path="/school-dashboard/*"
              element={
                <PrivateRoute>
                  <DashboardSidebarLayout userType="School">
                    <Suspense fallback={<div>Loading...</div>}>
                      <Routes>
                        <Route index element={<SchoolDashboard />} />
                        <Route path="*" element={<NotFoundPage />} />
                        <Route path="add/students" element={<StudentCreationPage />} />
                        <Route path="students" element={<StudentsListPage />} />
                        <Route path="students/:id" element={<ViewStudentPage />} />
                        <Route path="students/:id/edit" element={<EditStudentPage />} />
                        <Route path="classrooms" element={<ClassManagementPage />} />
                        <Route path="classrooms/add" element={<CreateClassPage />} />
                        <Route path="staff" element={<StaffManagementPage />} />
                        <Route path="teachers" element={<StaffManagementPage />} />
                        <Route path="staff/add" element={<CreateStaffPage />} />
                        <Route path="staff/edit/:id" element={<CreateStaffPage />} />

                        {/* Fee Management Routes */}
                        <Route path="fees" element={<FeeManagement />} />
                        <Route path="fees/structures" element={<StructureManagement />} />
                        <Route path="fees/payments" element={<PaymentManagement />} />

                        <Route path="templates" element={<TemplateManagement />} />
                        <Route path="notifications" element={<NotificationManagement />} />
                        <Route path="academic-years" element={<AcademicYearManagementPage />} />
                        <Route path="terms" element={<TermManagementPage />} />
                        <Route path="subject-assignments" element={<ClassSubjectAssignmentManagementPage />} />

                        {/* Add other School sub-routes here */}
                      </Routes>
                    </Suspense>
                  </DashboardSidebarLayout>
                </PrivateRoute>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;