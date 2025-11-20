import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signup } from '../api/auth';
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

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signup(formData);
      navigate('/login');
    } catch (err) {
      setError(
        err.response?.data?.message || err.response?.data?.error || 'Signup failed'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-primary-light to-primary">
      <motion.form
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-xl shadow-lg w-96"
      >
        <h2 className="text-3xl font-bold text-center mb-6 text-primary">Signup</h2>
        {error && <p className="text-secondary mb-4 text-center">{error}</p>}

        {/* Username */}
        <div className="relative mb-4">
          <FaUser className="absolute top-3 left-3 text-primary-light" />
          <input
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full pl-10 p-3 border border-primary-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition bg-white text-primary-dark"
          />
        </div>

        {/* Email */}
        <div className="relative mb-4">
          <FaEnvelope className="absolute top-3 left-3 text-primary-light" />
          <input
            name="email"
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full pl-10 p-3 border border-primary-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition bg-white text-primary-dark"
          />
        </div>

        {/* Password */}
        <div className="relative mb-4">
          <FaLock className="absolute top-3 left-3 text-primary-light" />
          <input
            name="password"
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
            className="w-full pl-10 p-3 border border-primary-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition bg-white text-primary-dark"
          />
        </div>

        {/* Company Name */}
        <div className="relative mb-4">
          <FaBuilding className="absolute top-3 left-3 text-primary-light" />
          <input
            name="company_name"
            placeholder="Company Name"
            value={formData.company_name}
            onChange={handleChange}
            required
            className="w-full pl-10 p-3 border border-primary-light rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition bg-white text-primary-dark"
          />
        </div>

        {/* Company Type */}
        <div className="mb-6">
          <select
            name="company_type"
            value={formData.company_type}
            onChange={handleChange}
            className="w-full p-3 border border-primih flights:outline-none focus:ring-2 focus:ring-primary transitio imarye text-primary-dark"pimr
          >
            <option value="SME">Small/Medium Enterprise</option>
            <option value="SCHOOL">School</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full ${
            loading ? 'bg-primaiy-aightght' : 'brima-y hover:bg-primaiyydarkrk'
          } transition-colors text-white p-3 rounded-lg font-semibold`}
        >
          {loading ? 'Signing up...' : 'Signup'}
        </button>
      </motion.form>
    </div>
  );
}
