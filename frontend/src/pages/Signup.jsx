import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api/auth';
import { AuthContext } from '../context/AuthContext';
import { FaUser, FaEnvelope, FaLock, FaBuilding } from 'react-icons/fa';
import { motion } from 'framer-motion';

export default function Signup() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    company_name: '',
    company_type: 'SME',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { loginUser } = useContext(AuthContext);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signup(formData);

      // Store tenantDomain in localStorage for future API calls
      if (res.data.company?.domain) {
        localStorage.setItem('tenantDomain', res.data.company.domain);
      }

      // Store user + company + token in context
      loginUser({
        user: res.data.user,
        company: res.data.company,
        token: res.data.token,
      });

      // Redirect based on company type
      if (res.data.company.company_type === 'SME') {
        navigate('/sme-dashboard');
      } else {
        navigate('/school-dashboard');
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Signup failed';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-purple-100 to-purple-200">
      <motion.form
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-xl shadow-lg w-96"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-purple-600">
          Signup
        </h2>
        {error && <p className="text-red-500 mb-4 text-center">{error}</p>}

        {/* Username */}
        <div className="relative mb-4">
          <FaUser className="absolute top-3 left-3 text-gray-400" />
          <input
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full pl-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>

        {/* Email */}
        <div className="relative mb-4">
          <FaEnvelope className="absolute top-3 left-3 text-gray-400" />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full pl-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>

        {/* Password */}
        <div className="relative mb-4">
          <FaLock className="absolute top-3 left-3 text-gray-400" />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full pl-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>

        {/* Company Name */}
        <div className="relative mb-4">
          <FaBuilding className="absolute top-3 left-3 text-gray-400" />
          <input
            name="company_name"
            placeholder="Company Name"
            value={formData.company_name}
            onChange={handleChange}
            required
            className="w-full pl-10 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          />
        </div>

        {/* Company Type */}
        <div className="mb-6">
          <select
            name="company_type"
            value={formData.company_type}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
          >
            <option value="SME">Small/Medium Enterprise</option>
            <option value="SCHOOL">School</option>
          </select>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full ${
            loading ? 'bg-purple-400' : 'bg-purple-600 hover:bg-purple-700'
          } transition-colors text-white p-3 rounded-lg font-semibold`}
        >
          {loading ? 'Signing up...' : 'Signup'}
        </button>
      </motion.form>
    </div>
  );
}
