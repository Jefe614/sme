import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FaLock } from 'react-icons/fa';
import { resetPassword } from '../api/auth';

export default function ResetPassword() {
  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { uid, token } = useParams();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      await resetPassword(uid, token, {
        password: formData.password,
        confirm_password: formData.confirmPassword
      });
      setMessage('Password reset successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError(err.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-primary-light to-primary">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-xl shadow-lg w-96"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-primary">Reset Password</h2>
        <p className="text-gray-600 text-center mb-6">
          Enter your new password below.
        </p>

        {message && <p className="text-green-600 mb-4 text-center">{message}</p>}
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

        <div className="relative mb-4">
          <FaLock className="absolute top-3 left-3 text-primary-light" />
          <input
            name="password"
            type="password"
            placeholder="New Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full pl-10 p-3 border border-primary-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition bg-white text-primary-dark"
          />
        </div>

        <div className="relative mb-6">
          <FaLock className="absolute top-3 left-3 text-primary-light" />
          <input
            name="confirmPassword"
            type="password"
            placeholder="Confirm New Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            className="w-full pl-10 p-3 border border-primary-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition bg-white text-primary-dark"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark transition-colors text-white p-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? 'Resetting...' : 'Reset Password'}
        </button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="text-primary hover:text-primary-dark text-sm underline"
          >
            Back to Login
          </button>
        </div>
      </form>
    </div>
  );
}
