import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// import { ConfigProvider } from 'antd';
import { AuthProvider } from './context/AuthContext';
// import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import DashboardSidebarLayout from './components/DashboardSidebarLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SmeDashboard from './pages/SmeDashboard';
import SchoolDashboard from './pages/SchoolDashboard';
import StudentCreationPage from './pages/students/AddStudents';
import StudentsListPage from './pages/students/ViewStudents';
import ViewStudentPage from './pages/students/ViewStudent';
import EditStudentPage from './pages/students/EditStudent';
import ClassManagementPage from './pages/classrooms/ViewClassroom';
import CreateClassPage from './pages/classrooms/AddClassRoom';
import StaffManagementPage from './pages/staff/StaffManagementPage';
import CreateStaffPage from './pages/staff/CreateStaffPage';
import FeeManagement from './pages/fees/FeeManagement';
import StructureManagement from './pages/fees/StructureManagement';
import PaymentManagement from './pages/fees/PaymentManagement';
import NotFoundPage from './pages/NotFoundPage';
import TemplateManagement from './pages/documents/TemplateManagement';
import NotificationManagement from './pages/notifications/NotificationManagement';

function App() {
  return (
        <AuthProvider>
          <Router>
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
                      <Routes>
                        <Route index element={<SmeDashboard />} />
                        {/* Add other SME sub-routes here */}
                      </Routes>
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
                  <Routes>
                    <Route index element={<SchoolDashboard />} />
                    <Route path ="*" element={<NotFoundPage />} />
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



                    {/* Add other School sub-routes here */}
                  </Routes>
                </DashboardSidebarLayout>
              </PrivateRoute>
            } 
          />
          </Routes>
        </Router>
      </AuthProvider>
  );
}

export default App;
