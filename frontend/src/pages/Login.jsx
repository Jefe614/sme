import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { FaUser, FaLock } from 'react-icons/fa';

export default function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
const { handleLogin } = useContext(AuthContext);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await handleLogin(formData);
      const { company } = res.data;

      navigate(company.company_type === 'SME' ? '/sme-dashboard' : '/school-dashboard');
    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-primary-light to-primary">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-xl shadow-lg w-96"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-primary">Login</h2>
        {error && <p className="text-secondary mb-4 text-center">{error}</p>}

        <div className="relative mb-4">
          <FaUser className="absolute top-3 left-3 text-primary-light" />
          <input
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            className="w-full pl-10 p-3 border border-primary-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition bg-white text-primary-dark"
          />
        </div>

        <div className="relative mb-6">
          <FaLock className="absolute top-3 left-3 text-primary-light" />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full pl-10 p-3 border border-primary-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition bg-white text-primary-dark"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary hover:bg-primary-dark transition-colors text-white p-3 rounded-lg font-semibold"
        >
          Login
        </button>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-primary hover:text-primary-dark text-sm underline"
          >
            Forgot Password?
          </button>
        </div>
      </form>
    </div>
  );
}
