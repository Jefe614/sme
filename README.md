# SME - School Management Enterprise

A comprehensive school management system built with Django REST Framework and React.js, designed to streamline educational administration and enhance communication between schools, teachers, students, and parents.

## 🚀 Features

### Academic Management
- **Academic Years & Terms**: Flexible academic calendar management with term-based scheduling
- **Subjects & Classes**: Comprehensive subject assignment and class management
- **Grading Systems**: Support for multiple grading systems (8-4-4, CBC, Custom)

### Student Management
- **Student Profiles**: Complete student information including personal details, medical info, and academic records
- **Class Management**: Student enrollment and class assignments with capacity tracking
- **Bulk Operations**: Import/export student data with Excel support

### Staff Management
- **Staff Profiles**: Detailed staff information with roles, departments, and qualifications
- **Attendance Tracking**: Daily attendance monitoring for teaching and non-teaching staff
- **Teacher Assignments**: Subject and class teacher assignments

### Financial Management
- **Fee Structures**: Flexible fee configuration with multiple fee types and payment options
- **Payment Tracking**: Comprehensive fee payment management with receipt generation
- **Discounts & Scholarships**: Fee waiver and discount management system

### Examination System
- **Exam Management**: Create and manage various exam types (CAT, Mid-term, End-term)
- **Marks Entry**: Secure marks entry with validation and teacher remarks
- **Report Cards**: Automated report card generation with grading

### Communication & Notifications
- **SMS Integration**: Automated SMS notifications via Africa's Talking
- **Email Notifications**: Template-based email communication
- **Parent Portal**: Dedicated parent access for fees, attendance, and results

### Attendance Management
- **Student Attendance**: Daily attendance tracking with detailed reporting
- **Staff Attendance**: Comprehensive staff attendance management
- **Analytics**: Attendance statistics and trend analysis

### Document Management
- **Templates**: Customizable document templates for various school documents
- **Generation**: Automated document generation with dynamic content

## 🛠 Tech Stack

### Backend
- **Framework**: Django 4.2.24 with Django REST Framework
- **Database**: PostgreSQL 15 with django-tenants for multi-tenancy
- **Authentication**: JWT (JSON Web Tokens)
- **Task Queue**: Celery with Redis
- **SMS Service**: Africa's Talking API
- **File Storage**: Local file system with cloud storage support

### Frontend
- **Framework**: React 19.1.1 with Vite
- **UI Library**: Material-UI (MUI) with Tailwind CSS
- **Charts**: Chart.js and Recharts for data visualization
- **HTTP Client**: Axios for API communication
- **State Management**: React Context API

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database Admin**: pgAdmin4
- **Background Jobs**: Redis for caching and Celery tasks
- **Development**: ESLint, Prettier for code quality

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Jefe614/sme.git
cd sme
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
# Database
POSTGRES_DB=sme_db
POSTGRES_USER=sme_user
POSTGRES_PASSWORD=your_password

# Django
SECRET_KEY=your-secret-key
DEBUG=True
DJANGO_SETTINGS_MODULE=sme_school_app.settings

# Africa's Talking (for SMS)
AFRICAS_TALKING_USERNAME=your_username
AFRICAS_TALKING_API_KEY=your_api_key

# Redis
REDIS_URL=redis://redis:6379/0

# Frontend
VITE_API_BASE_URL=http://localhost:8000/api
```

### 3. Start with Docker
```bash
docker-compose up --build
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **pgAdmin**: http://localhost:5050 (admin@sme.com / admin123)

### 4. Manual Setup (Alternative)

#### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## 📖 Usage

### Admin Dashboard
- Access the admin panel at `/admin` for system configuration
- Create school tenants and manage global settings

### School Management
- **Academic Setup**: Configure academic years, terms, subjects, and classes
- **Staff Management**: Add teachers, administrators, and support staff
- **Student Enrollment**: Register students with complete profiles
- **Fee Management**: Set up fee structures and payment tracking

### Teacher Portal
- Mark attendance for assigned classes
- Enter exam marks and generate reports
- Access student performance analytics

### Parent Portal
- View children's attendance and academic performance
- Access fee payment history and outstanding balances
- Receive notifications about school activities

## 🔌 API Documentation

The API follows RESTful conventions and is documented with OpenAPI/Swagger.

### Authentication
```bash
POST /api/auth/login/
{
  "username": "admin",
  "password": "password"
}
```

### Key Endpoints

#### Academic Management
- `GET/POST /api/academic/years/` - Academic years
- `GET/POST /api/academic/terms/` - Terms
- `GET/POST /api/academic/subjects/` - Subjects
- `GET/POST /api/academic/classes/` - Classes

#### Student Management
- `GET/POST /api/students/` - Student CRUD
- `GET/POST /api/students/{id}/attendance/` - Student attendance

#### Staff Management
- `GET/POST /api/staff/` - Staff CRUD
- `GET/POST /api/staff/{id}/attendance/` - Staff attendance

#### Financial Management
- `GET/POST /api/fees/structures/` - Fee structures
- `GET/POST /api/fees/payments/` - Fee payments

#### Examination System
- `GET/POST /api/exams/` - Exam management
- `GET/POST /api/exams/marks/` - Marks entry

## 🏗 Project Structure

```
sme/
├── backend/
│   ├── sme_school_app/
│   │   ├── core/          # Main app with models and business logic
│   │   ├── parent/        # Parent portal functionality
│   │   ├── teachers/      # Teacher-specific features
│   │   ├── tenants/       # Multi-tenant configuration
│   │   └── sme_school_app/# Django settings and configuration
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/           # API service functions
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── context/       # React context providers
│   │   └── utils/         # Utility functions
│   ├── package.json
│   └── Dockerfile
├── docker-compose.yml
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 for Python code
- Use ESLint configuration for JavaScript/React
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@sme.com or join our Slack channel.

## 🙏 Acknowledgments

- Built with Django and React communities
- Special thanks to contributors and educators who provided valuable feedback
- Icons by Material-UI and React Icons
