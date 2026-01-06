import json
import pandas as pd
from datetime import datetime
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.http import HttpResponse
from django.db import transaction

from tenants.models import Company
from .models import Student, StudentClass


class BulkImportStudentsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Bulk import students from Excel file"""
        company = request.company

        if not company or company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES.get('file')
        if not file:
            return Response({"error": "No file provided"}, status=status.HTTP_400_BAD_REQUEST)

        # Validate file extension
        if not file.name.endswith(('.xlsx', '.xls')):
            return Response({"error": "Only Excel files (.xlsx, .xls) are allowed"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Read Excel file
            df = pd.read_excel(file, engine='openpyxl')

            # Validate required columns
            required_columns = [
                'first_name*', 'last_name*', 'gender*', 'date_of_birth*',
                'student_class*', 'admission_date*', 'parent_name*', 'relationship*', 'parent_phone*'
            ]

            # Map column names (remove * for processing)
            column_mapping = {
                'first_name*': 'first_name',
                'last_name*': 'last_name',
                'gender*': 'gender',
                'date_of_birth*': 'date_of_birth',
                'student_class*': 'student_class',
                'admission_date*': 'admission_date',
                'parent_name*': 'parent_name',
                'relationship*': 'relationship',
                'parent_phone*': 'parent_phone'
            }

            # Check if columns exist (with or without *)
            actual_columns = list(df.columns)
            missing_required = []

            for req_col in required_columns:
                base_col = column_mapping[req_col]
                if req_col not in actual_columns and base_col not in actual_columns:
                    missing_required.append(req_col)

            if missing_required:
                return Response({
                    "error": f"Missing required columns: {', '.join(missing_required)}"
                }, status=status.HTTP_400_BAD_REQUEST)

            # Rename columns for processing
            df = df.rename(columns={k: v for k, v in column_mapping.items() if k in df.columns})

            # Process data
            success_count = 0
            errors = []
            imported_students = []

            with transaction.atomic():
                for index, row in df.iterrows():
                    try:
                        # Validate and get student_class
                        class_name = str(row.get('student_class', '')).strip()
                        if not class_name:
                            errors.append(f"Row {index + 2}: Student class is required")
                            continue

                        try:
                            student_class = StudentClass.objects.get(
                                name__iexact=class_name,
                                company=company
                            )
                        except StudentClass.DoesNotExist:
                            errors.append(f"Row {index + 2}: Class '{class_name}' not found")
                            continue

                        # Parse date fields
                        date_of_birth = None
                        if pd.notna(row.get('date_of_birth')):
                            try:
                                date_of_birth = pd.to_datetime(row['date_of_birth']).date()
                            except:
                                errors.append(f"Row {index + 2}: Invalid date format for date_of_birth")
                                continue

                        admission_date = None
                        if pd.notna(row.get('admission_date')):
                            try:
                                admission_date = pd.to_datetime(row['admission_date']).date()
                            except:
                                errors.append(f"Row {index + 2}: Invalid date format for admission_date")
                                continue

                        # Create student
                        student = Student(
                            company=company,
                            first_name=str(row.get('first_name', '')).strip(),
                            last_name=str(row.get('last_name', '')).strip(),
                            admission_number=str(row.get('admission_number', '')).strip() or None,
                            gender=str(row.get('gender', '')).strip().lower(),
                            date_of_birth=date_of_birth,
                            student_type=str(row.get('student_type', 'day')).strip().lower(),
                            student_class=student_class,
                            admission_date=admission_date,
                            parent_name=str(row.get('parent_name', '')).strip(),
                            relationship=str(row.get('relationship', '')).strip(),
                            parent_phone=str(row.get('parent_phone', '')).strip(),
                            nationality=str(row.get('nationality', '')).strip() or None,
                            roll_number=str(row.get('roll_number', '')).strip() or None,
                            parent_email=str(row.get('parent_email', '')).strip() or None,
                            address=str(row.get('address', '')).strip() or None,
                            hostel=str(row.get('hostel', '')).strip() or None,
                            blood_group=str(row.get('blood_group', '')).strip() or None,
                            allergies=str(row.get('allergies', '')).strip() or None,
                            medical_conditions=str(row.get('medical_conditions', '')).strip() or None,
                        )

                        student.save()
                        imported_students.append({
                            'id': student.id,
                            'name': f"{student.first_name} {student.last_name}",
                            'admission_number': student.admission_number
                        })
                        success_count += 1

                    except Exception as e:
                        errors.append(f"Row {index + 2}: {str(e)}")

            return Response({
                "message": f"Successfully imported {success_count} students",
                "success_count": success_count,
                "error_count": len(errors),
                "errors": errors[:50],  # Limit errors shown
                "imported_students": imported_students
            })

        except Exception as e:
            return Response({"error": f"Error processing file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class DownloadStudentTemplateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Download Excel template for student bulk import"""

        # Create sample data
        sample_data = {
            'first_name*': ['John', 'Jane', 'Mike'],
            'last_name*': ['Doe', 'Smith', 'Johnson'],
            'admission_number': ['ADM001', 'ADM002', 'ADM003'],
            'gender*': ['male', 'female', 'male'],
            'date_of_birth*': ['2005-05-15', '2006-03-22', '2004-11-08'],
            'student_type': ['day', 'boarding', 'day'],
            'student_class*': ['grade-1 - Section A (2024-2025)', 'grade-1 - Section C (2024-2025)', 'grade-1 - Section B (2024-2025)'],
            'admission_date*': ['2024-01-15', '2024-01-16', '2024-01-17'],
            'parent_name*': ['Robert Doe', 'Sarah Smith', 'David Johnson'],
            'relationship*': ['father', 'mother', 'father'],
            'parent_phone*': ['+254712345678', '+254787654321', '+254723456789'],
            'nationality': ['Kenyan', 'Kenyan', 'Kenyan'],
            'roll_number': ['1', '2', '3'],
            'parent_email': ['robert@example.com', 'sarah@example.com', 'david@example.com'],
            'address': ['123 Main St, Nairobi', '456 Oak Ave, Nairobi', '789 Pine Rd, Nairobi'],
            'hostel': ['', 'Hostel A', ''],
            'blood_group': ['O+', 'A+', 'B+'],
            'allergies': ['', 'Peanuts', ''],
            'medical_conditions': ['', '', 'Asthma']
        }

        df = pd.DataFrame(sample_data)

        # Create response
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = 'attachment; filename="student_import_template.xlsx"'

        # Write to Excel
        with pd.ExcelWriter(response, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Students', index=False)

            # Add instructions sheet
            instructions_data = {
                'Column': list(df.columns),
                'Required': ['Yes', 'Yes', 'No', 'Yes', 'Yes', 'No', 'Yes', 'Yes', 'Yes', 'Yes', 'Yes', 'No', 'No', 'No', 'No', 'No', 'No', 'No', 'No'],
                'Description': [
                    'Student first name',
                    'Student last name',
                    'Unique admission number (leave blank for auto-generation)',
                    'Gender: male or female',
                    'Date of birth in YYYY-MM-DD format',
                    'Student type: day or boarding',
                    'Class name as shown in the system (e.g., "Grade 1 - Section A")',
                    'Admission date in YYYY-MM-DD format',
                    'Parent/guardian full name',
                    'Relationship: father, mother, or guardian',
                    'Parent phone number with country code',
                    'Student nationality',
                    'Roll number in class',
                    'Parent email address',
                    'Home address',
                    'Hostel name (only for boarding students)',
                    'Blood group (e.g., O+, A-, B+)',
                    'Known allergies',
                    'Medical conditions or special needs'
                ]
            }

            instructions_df = pd.DataFrame(instructions_data)
            instructions_df.to_excel(writer, sheet_name='Instructions', index=False)

        return response
