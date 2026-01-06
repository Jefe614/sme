import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEnvelope } from 'react-icons/fa';
import { forgotPassword } from '../api/auth';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await forgotPassword({ email });
      setMessage('If an account with this email exists, a password reset link has been sent.');
    } catch (err) {
      console.error("Forgot password error:", err);
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
        <h2 className="text-3xl font-bold text-center mb-6 text-primary">Forgot Password</h2>
        <p className="text-gray-600 text-center mb-6">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {message && <p className="text-green-600 mb-4 text-center">{message}</p>}
        {error && <p className="text-red-600 mb-4 text-center">{error}</p>}

        <div className="relative mb-6">
          <FaEnvelope className="absolute top-3 left-3 text-primary-light" />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full pl-10 p-3 border border-primary-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition bg-white text-primary-dark"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-dark transition-colors text-white p-3 rounded-lg font-semibold disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
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
