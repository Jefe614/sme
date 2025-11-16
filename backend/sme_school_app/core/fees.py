from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.core.paginator import Paginator, EmptyPage
from django.db.models import Count, Sum, Q
from django_tenants.utils import tenant_context
from datetime import datetime
from django.utils import timezone


from tenants.models import Company

from .models import FeePayment, FeeStructure, FeeDiscount, Student
from .serializers import FeePaymentSerializer, FeeStructureSerializer, FeeDiscountSerializer


class FeeStructureAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.company

        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        fee_structures = FeeStructure.objects.filter(company=company).order_by('-created_at')

        # Search filter
        q = request.query_params.get("q")
        if q:
            fee_structures = fee_structures.filter(
                Q(name__icontains=q) |
                Q(description__icontains=q)
            )

        # Filter by fee type
        fee_type = request.query_params.get('fee_type')
        if fee_type:
            fee_structures = fee_structures.filter(fee_type=fee_type)

        # Filter by academic year
        academic_year = request.query_params.get('academic_year')
        if academic_year:
            fee_structures = fee_structures.filter(academic_year=academic_year)

        # Filter by active status
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            if is_active.lower() == 'true':
                fee_structures = fee_structures.filter(is_active=True)
            elif is_active.lower() == 'false':
                fee_structures = fee_structures.filter(is_active=False)

        # Pagination
        page_size = request.query_params.get("pageSize", 10)
        page_number = request.query_params.get("current", 1)

        try:
            page_size = int(page_size)
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_size = 10
            page_number = 1

        paginator = Paginator(fee_structures, page_size)

        try:
            page = paginator.page(page_number)
        except EmptyPage:
            page = paginator.page(1)
            page_number = 1

        return Response({
            "message": "Fee structures fetched successfully",
            "data": FeeStructureSerializer(page, many=True).data,
            "pagination": {
                "current": page_number,
                "pageSize": page_size,
                "total": paginator.count,
                "totalPages": paginator.num_pages,
            },
        })

    def post(self, request):
        company = request.company

        # if not company:
        #     return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        # if company.company_type != "SCHOOL":
        #     return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        formData = request.data
        print("Received formData:", formData)

        # Parse date fields
        def parse_date(date_str):
            if date_str:
                try:
                    return datetime.strptime(date_str, "%Y-%m-%d").date()
                except (ValueError, TypeError):
                    return None
            return None

        due_date = parse_date(formData.get("due_date"))

        fee_structure_data = {
            "company": company,
            "name": formData.get("name", "").strip(),
            "description": formData.get("description", "").strip(),
            "fee_type": formData.get("fee_type", "tuition"),
            "amount": formData.get("amount"),
            "currency": formData.get("currency", "KES"),
            "grade_level": formData.get("grade_level", "").strip() or None,
            "student_type": formData.get("student_type", "").strip() or None,
            "academic_year": formData.get("academic_year", "").strip(),
            "term": formData.get("term", "annual"),
            "due_date": due_date,
            "is_optional": formData.get("is_optional", False),
            "late_fee_penalty": formData.get("late_fee_penalty", 0.00),
            "installment_allowed": formData.get("installment_allowed", False),
            "max_installments": formData.get("max_installments", 1),
            "is_active": formData.get("is_active", True),
        }

        # Required fields validation
        required_fields = ['name', 'amount', 'academic_year', 'term']
        missing_fields = [field for field in required_fields if not fee_structure_data.get(field)]
        if missing_fields:
            return Response({
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with tenant_context(company):
                fee_structure = FeeStructure(**fee_structure_data)
                fee_structure.save()
                return Response({
                    "message": "Fee structure created successfully",
                    "data": FeeStructureSerializer(fee_structure).data
                }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        company = request.company

        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with tenant_context(company):
                fee_structure = FeeStructure.objects.get(id=pk, company=company)
        except FeeStructure.DoesNotExist:
            return Response({"error": "Fee structure not found"}, status=status.HTTP_404_NOT_FOUND)

        formData = request.data

        # Parse date fields if provided
        def parse_date(date_str):
            if date_str:
                try:
                    return datetime.strptime(date_str, "%Y-%m-%d").date()
                except (ValueError, TypeError):
                    return None
            return None

        # Update fields
        update_fields = [
            'name', 'description', 'fee_type', 'amount', 'currency', 'grade_level',
            'student_type', 'academic_year', 'term', 'due_date', 'is_optional',
            'late_fee_penalty', 'installment_allowed', 'max_installments', 'is_active'
        ]

        for field in update_fields:
            if field in formData:
                if field == 'due_date':
                    setattr(fee_structure, field, parse_date(formData[field]))
                else:
                    setattr(fee_structure, field, formData[field])

        try:
            fee_structure.save()
            return Response({
                "message": "Fee structure updated successfully",
                "data": FeeStructureSerializer(fee_structure).data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        company = request.company

        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with tenant_context(company):
                fee_structure = FeeStructure.objects.get(id=pk, company=company)
                fee_structure.delete()
                return Response({"message": "Fee structure deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except FeeStructure.DoesNotExist:
            return Response({"error": "Fee structure not found"}, status=status.HTTP_404_NOT_FOUND)


class FeePaymentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.company

        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        fee_payments = FeePayment.objects.filter(
            student__company=company
        ).select_related('student', 'fee_structure').order_by('-payment_date')

        # Search filter
        q = request.query_params.get("q")
        if q:
            fee_payments = fee_payments.filter(
                Q(student__first_name__icontains=q) |
                Q(student__last_name__icontains=q) |
                Q(student__admission_number__icontains=q) |
                Q(receipt_number__icontains=q)
            )

        # Filter by payment status
        payment_status = request.query_params.get('payment_status')
        if payment_status:
            fee_payments = fee_payments.filter(payment_status=payment_status)

        # Filter by payment method
        payment_method = request.query_params.get('payment_method')
        if payment_method:
            fee_payments = fee_payments.filter(payment_method=payment_method)

        # Filter by date range
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        if start_date and end_date:
            try:
                fee_payments = fee_payments.filter(
                    payment_date__gte=start_date,
                    payment_date__lte=end_date
                )
            except (ValueError, TypeError):
                pass

        # Filter by student
        student_id = request.query_params.get('student_id')
        if student_id:
            fee_payments = fee_payments.filter(student_id=student_id)

        # Pagination
        page_size = request.query_params.get("pageSize", 10)
        page_number = request.query_params.get("current", 1)

        try:
            page_size = int(page_size)
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_size = 10
            page_number = 1

        paginator = Paginator(fee_payments, page_size)

        try:
            page = paginator.page(page_number)
        except EmptyPage:
            page = paginator.page(1)
            page_number = 1

        return Response({
            "message": "Fee payments fetched successfully",
            "data": FeePaymentSerializer(page, many=True).data,
            "pagination": {
                "current": page_number,
                "pageSize": page_size,
                "total": paginator.count,
                "totalPages": paginator.num_pages,
            },
        })

    def post(self, request):
        print(f"FeePayment POST called with method: {request.method}")
        print(f"Headers: {dict(request.headers)}")
        print(f"Request company: {getattr(request, 'company', None)}")

        company = request.company

        if not company:
            print("No company found in request")
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        if company.company_type != "SCHOOL":
            print(f"Company type is {company.company_type}, not SCHOOL")
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        print(f"Company found: {company} with type: {company.company_type}")
        formData = request.data
        print(f"Form data: {formData}")

        # Validate required fields
        required_fields = ['student', 'amount_paid', 'payment_date', 'payment_method']
        missing_fields = [field for field in required_fields if not formData.get(field)]
        if missing_fields:
            return Response({
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with tenant_context(company):
                # Validate student exists and belongs to this company
                print(f"Looking for student ID: {formData.get('student')} in company: {company}")
                student = Student.objects.get(id=formData.get('student'), company=company)
                print(f"Found student: {student}")

                # Parse payment date
                payment_date = formData.get('payment_date')
                if isinstance(payment_date, str):
                    payment_date = datetime.strptime(payment_date, "%Y-%m-%d").date()
                else:
                    payment_date = timezone.now().date()

                print(f"Payment date parsed: {payment_date}")

                # Validate fee structure if provided
                fee_structure_id = formData.get('fee_structure')
                fee_structure = None
                if fee_structure_id:
                    try:
                        fee_structure = FeeStructure.objects.get(id=fee_structure_id, company=company)
                        print(f"Found fee structure: {fee_structure}")
                    except FeeStructure.DoesNotExist:
                        return Response({"error": f"Fee structure with ID {fee_structure_id} not found"}, status=status.HTTP_400_BAD_REQUEST)

                fee_payment_data = {
                    "company": company,
                    "student": student,
                    "fee_structure": fee_structure,  # Use the actual object, not ID
                    "amount_paid": formData.get('amount_paid'),
                    "due_amount": formData.get('due_amount', formData.get('amount_paid')),  # Default to amount_paid if not specified
                    "payment_date": payment_date,
                    "payment_method": formData.get('payment_method'),
                    "payment_status": formData.get('payment_status', 'completed'),
                    "transaction_id": formData.get('transaction_id', '').strip() or None,
                    "is_installment": formData.get('is_installment', False),
                    "notes": formData.get('notes', '').strip() or None,
                    "paid_by": formData.get('paid_by', '').strip() or None,
                }

                print(f"Fee payment data: {fee_payment_data}")

                try:
                    fee_payment = FeePayment(**fee_payment_data)
                    print(f"Created FeePayment object: {fee_payment}")
                    print(f"About to call save()...")
                    fee_payment.save()
                    print(f"Saved FeePayment with receipt: {fee_payment.receipt_number}")

                    return Response({
                        "message": "Fee payment recorded successfully",
                        "data": FeePaymentSerializer(fee_payment).data
                    }, status=status.HTTP_201_CREATED)
                except Exception as save_error:
                    print(f"Exception during save: {type(save_error).__name__}: {str(save_error)}")
                    import traceback
                    print(f"Full traceback: {traceback.format_exc()}")
                    return Response({"error": f"Failed to save payment: {str(save_error)}"}, status=status.HTTP_400_BAD_REQUEST)

        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        company = request.company

        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with tenant_context(company):
                fee_payment = FeePayment.objects.get(id=pk, student__company=company)
        except FeePayment.DoesNotExist:
            return Response({"error": "Fee payment not found"}, status=status.HTTP_404_NOT_FOUND)

        formData = request.data

        # Parse payment date if provided
        if 'payment_date' in formData:
            payment_date = formData.get('payment_date')
            if isinstance(payment_date, str):
                try:
                    payment_date = datetime.strptime(payment_date, "%Y-%m-%d").date()
                    fee_payment.payment_date = payment_date
                except (ValueError, TypeError):
                    pass

        # Update other fields
        update_fields = [
            'amount_paid', 'due_amount', 'payment_method', 'payment_status',
            'transaction_id', 'is_installment', 'notes', 'paid_by'
        ]

        for field in update_fields:
            if field in formData:
                setattr(fee_payment, field, formData[field])

        # Update balance if amount_paid or due_amount changed
        if 'amount_paid' in formData or 'due_amount' in formData:
            fee_payment.balance = fee_payment.due_amount - fee_payment.amount_paid

        try:
            fee_payment.save()
            return Response({
                "message": "Fee payment updated successfully",
                "data": FeePaymentSerializer(fee_payment).data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        company = request.company

        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with tenant_context(company):
                fee_payment = FeePayment.objects.get(id=pk, student__company=company)
                fee_payment.delete()
                return Response({"message": "Fee payment deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except FeePayment.DoesNotExist:
            return Response({"error": "Fee payment not found"}, status=status.HTTP_404_NOT_FOUND)


class FeeDiscountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.company

        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        fee_discounts = FeeDiscount.objects.filter(
            student__company=company
        ).select_related('student', 'fee_structure').order_by('-created_at')

        # Search filter
        q = request.query_params.get("q")
        if q:
            fee_discounts = fee_discounts.filter(
                Q(student__first_name__icontains=q) |
                Q(student__last_name__icontains=q) |
                Q(student__admission_number__icontains=q) |
                Q(reason__icontains=q)
            )

        # Filter by discount type
        discount_type = request.query_params.get('discount_type')
        if discount_type:
            fee_discounts = fee_discounts.filter(discount_type=discount_type)

        # Filter by active status
        is_active = request.query_params.get('is_active')
        if is_active is not None:
            if is_active.lower() == 'true':
                fee_discounts = fee_discounts.filter(is_active=True)
            elif is_active.lower() == 'false':
                fee_discounts = fee_discounts.filter(is_active=False)

        # Pagination
        page_size = request.query_params.get("pageSize", 10)
        page_number = request.query_params.get("current", 1)

        try:
            page_size = int(page_size)
            page_number = int(page_number)
        except (TypeError, ValueError):
            page_size = 10
            page_number = 1

        paginator = Paginator(fee_discounts, page_size)

        try:
            page = paginator.page(page_number)
        except EmptyPage:
            page = paginator.page(1)
            page_number = 1

        return Response({
            "message": "Fee discounts fetched successfully",
            "data": FeeDiscountSerializer(page, many=True).data,
            "pagination": {
                "current": page_number,
                "pageSize": page_size,
                "total": paginator.count,
                "totalPages": paginator.num_pages,
            },
        })

    def post(self, request):
        company = request.company

        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        formData = request.data

        # Validate required fields
        required_fields = ['student', 'discount_type', 'discount_value', 'start_date']
        missing_fields = [field for field in required_fields if not formData.get(field)]
        if missing_fields:
            return Response({
                "error": f"Missing required fields: {', '.join(missing_fields)}"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            with tenant_context(company):
                # Validate student exists and belongs to this company
                student = Student.objects.get(id=formData.get('student'), company=company)

                # Parse dates
                def parse_date(date_str):
                    if date_str:
                        try:
                            return datetime.strptime(date_str, "%Y-%m-%d").date()
                        except (ValueError, TypeError):
                            return None
                    return None

                start_date = parse_date(formData.get('start_date'))
                end_date = parse_date(formData.get('end_date'))

                if not start_date:
                    return Response({"error": "Invalid start date"}, status=status.HTTP_400_BAD_REQUEST)

                fee_discount_data = {
                    "company": company,
                    "student": student,
                    "fee_structure_id": formData.get('fee_structure') or None,
                    "discount_type": formData.get('discount_type'),
                    "discount_value": formData.get('discount_value'),
                    "reason": formData.get('reason', '').strip() or None,
                    "approved_by": formData.get('approved_by', '').strip() or None,
                    "start_date": start_date,
                    "end_date": end_date,
                    "is_active": formData.get('is_active', True),
                }

                fee_discount = FeeDiscount(**fee_discount_data)
                fee_discount.save()

                return Response({
                    "message": "Fee discount created successfully",
                    "data": FeeDiscountSerializer(fee_discount).data
                }, status=status.HTTP_201_CREATED)

        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        company = request.company

        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with tenant_context(company):
                fee_discount = FeeDiscount.objects.get(id=pk, student__company=company)
        except FeeDiscount.DoesNotExist:
            return Response({"error": "Fee discount not found"}, status=status.HTTP_404_NOT_FOUND)

        formData = request.data

        # Parse dates if provided
        def parse_date(date_str):
            if date_str:
                try:
                    return datetime.strptime(date_str, "%Y-%m-%d").date()
                except (ValueError, TypeError):
                    return None
            return None

        # Update fields
        update_fields = [
            'discount_type', 'discount_value', 'reason', 'approved_by', 'is_active'
        ]

        for field in update_fields:
            if field in formData:
                setattr(fee_discount, field, formData[field])

        # Update dates if provided
        if 'start_date' in formData:
            start_date = parse_date(formData['start_date'])
            if start_date:
                fee_discount.start_date = start_date

        if 'end_date' in formData:
            end_date = parse_date(formData['end_date'])
            fee_discount.end_date = end_date

        try:
            fee_discount.save()
            return Response({
                "message": "Fee discount updated successfully",
                "data": FeeDiscountSerializer(fee_discount).data
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        company = request.company

        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with tenant_context(company):
                fee_discount = FeeDiscount.objects.get(id=pk, student__company=company)
                fee_discount.delete()
                return Response({"message": "Fee discount deleted successfully"}, status=status.HTTP_204_NO_CONTENT)
        except FeeDiscount.DoesNotExist:
            return Response({"error": "Fee discount not found"}, status=status.HTTP_404_NOT_FOUND)


class FeeReportingAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        company = request.company

        if not company:
            return Response({"error": "No tenant found in request"}, status=status.HTTP_400_BAD_REQUEST)

        if company.company_type != "SCHOOL":
            return Response({"error": "Tenant must be a school company"}, status=status.HTTP_400_BAD_REQUEST)

        # Get summary statistics
        total_payments = FeePayment.objects.filter(
            student__company=company, payment_status='completed'
        ).aggregate(
            total_amount=Sum('amount_paid'),
            count=Count('id')
        )

        # Monthly payments for the last 6 months
        from django.db.models.functions import TruncMonth
        monthly_data = FeePayment.objects.filter(
            student__company=company,
            payment_status='completed'
        ).annotate(
            month=TruncMonth('payment_date')
        ).values('month').annotate(
            total=Sum('amount_paid'),
            count=Count('id')
        ).order_by('month')

        # Payment methods breakdown
        payment_methods = FeePayment.objects.filter(
            student__company=company, payment_status='completed'
        ).values('payment_method').annotate(
            total=Sum('amount_paid'),
            count=Count('id')
        )

        # Outstanding balances
        outstanding = FeePayment.objects.filter(
            student__company=company, payment_status='completed'
        ).aggregate(
            total_due=Sum('due_amount'),
            total_paid=Sum('amount_paid')
        )

        outstanding_amount = max(
            (outstanding['total_due'] or 0) - (outstanding['total_paid'] or 0), 0
        )

        return Response({
            "message": "Fee report generated successfully",
            "summary": {
                "total_collected": total_payments['total_amount'] or 0,
                "total_payments": total_payments['count'] or 0,
                "outstanding_balance": outstanding_amount,
            },
            "monthly_trend": list(monthly_data),
            "payment_methods": list(payment_methods),
        })
