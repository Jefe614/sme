import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaMoneyBillWave, FaChartLine, FaUsers } from 'react-icons/fa';

export default function SmeDashboard() {
  const { logout } = useContext(AuthContext);

  const cards = [
    { title: 'Cash In', value: 'KSh 50,000', icon: <FaMoneyBillWave /> },
    { title: 'Expenses', value: 'KSh 20,000', icon: <FaChartLine /> },
    { title: 'Customers', value: '120', icon: <FaUsers /> },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">SME Dashboard</h1>
        <button onClick={logout} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors">Logout</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card, idx) => (
          <motion.div
            key={idx}
            className="bg-white rounded-xl shadow-lg p-6 flex items-center space-x-4 hover:shadow-xl transition-shadow border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.2 }}
          >
            <div className="text-primary text-3xl">{card.icon}</div>
            <div>
              <p className="text-gray-600">{card.title}</p>
              <p className="text-xl font-bold text-gray-900">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
