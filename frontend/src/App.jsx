import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import DashboardSidebarLayout from './components/DashboardSidebarLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import SmeDashboard from './pages/SmeDashboard';
import SchoolDashboard from './pages/SchoolDashboard';
import StudentCreationPage from './pages/students/AddStudents';
import StudentsListPage from './pages/students/ViewStudents';
import ClassManagementPage from './pages/classrooms/ViewClassroom';
import CreateClassPage from './pages/classrooms/AddClassRoom';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
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
                    <Route path="add/students" element={<StudentCreationPage />} />
                    <Route path="students" element={<StudentsListPage />} />
                    <Route path="classrooms" element={<ClassManagementPage />} />
                    <Route path="add/classrooms" element={<CreateClassPage />} />
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