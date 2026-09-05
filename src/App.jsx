import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

function App() {
  const [entries, setEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [darkMode, setDarkMode] = useState(false);
  const [budgetLimit, setBudgetLimit] = useState(100000); // Default Budget limit
  const [formData, setFormData] = useState({
    projectName: '', category: 'Material', cost: '', entryDate: new Date().toISOString().split('T')[0]
  });

  const API_URL = "http://localhost:8081/api/costsheet";

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setEntries(data))
      .catch(err => console.error("Error fetching data:", err));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectName: formData.projectName,
        category: formData.category,
        cost: parseFloat(formData.cost),
        entryDate: formData.entryDate
      })
    })
    .then(res => res.json())
    .then(newEntry => {
      setEntries([...entries, newEntry]);
      setFormData({ projectName: '', category: 'Material', cost: '', entryDate: new Date().toISOString().split('T')[0] });
    })
    .catch(err => console.error("Error saving data:", err));
  };

  const handleDelete = (id) => {
    fetch(`${API_URL}/${id}`, { method: 'DELETE' })
    .then(() => {
      setEntries(entries.filter(entry => entry.entryId !== id));
    })
    .catch(err => console.error("Error deleting entry:", err));
  };

  const exportToCSV = () => {
    const headers = ["ID", "Project Name", "Category", "Cost (₹)", "Date"];
    const rows = entries.map(e => [e.entryId, `"${e.projectName}"`, e.category, e.cost, e.entryDate]);
    let csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Professional_Cost_Sheet.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.projectName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || entry.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const totalCostSum = filteredEntries.reduce((acc, curr) => acc + (curr.cost || curr.totalCost || 0), 0);
  const isOverBudget = totalCostSum > budgetLimit;

  // Prepare data for Charts (Category wise grouping)
  const categoryDataMap = entries.reduce((acc, curr) => {
    const cat = curr.category || 'Material';
    acc[cat] = (acc[cat] || 0) + (curr.cost || curr.totalCost || 0);
    return acc;
  }, {});

  const chartData = Object.keys(categoryDataMap).map(cat => ({
    name: cat,
    Cost: categoryDataMap[cat]
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className={`min-h-screen p-6 font-sans transition-colors duration-300 ${darkMode ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'}`}>
      <div className={`max-w-7xl mx-auto p-6 rounded-2xl shadow-2xl transition-colors duration-300 ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
        
        {/* Top Navbar Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 border-b pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-blue-600 flex items-center gap-2">
              📊 Enterprise Cost Management Suite
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Real-time Financial Analytics & Expense Tracking</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`}>
              <span className="font-semibold">Budget Limit: ₹</span>
              <input 
                type="number" 
                value={budgetLimit} 
                onChange={(e) => setBudgetLimit(parseFloat(e.target.value) || 0)} 
                className="w-24 bg-transparent font-bold focus:outline-none"
              />
            </div>
            <button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow transition">
              📥 Export Excel
            </button>
            <button onClick={() => setDarkMode(!darkMode)} className={`px-4 py-2 rounded-lg text-sm font-bold shadow transition ${darkMode ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-white'}`}>
              {darkMode ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>

        {/* Budget Warning Banner if Exceeded */}
        {isOverBudget && (
          <div className="mb-6 bg-red-500 text-white p-4 rounded-xl shadow-lg flex justify-between items-center animate-pulse">
            <span className="font-bold text-lg">⚠️ Warning: Total calculated cost (₹{totalCostSum}) has exceeded your set budget limit (₹{budgetLimit})!</span>
            <span className="bg-white text-red-600 px-3 py-1 rounded font-extrabold text-xs">CRITICAL OVERFLOW</span>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className={`p-4 rounded-xl shadow border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
            <h3 className="text-sm font-semibold opacity-80">Total Filtered Entries</h3>
            <p className="text-3xl font-black text-blue-500">{filteredEntries.length}</p>
          </div>
          <div className={`p-4 rounded-xl shadow border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-green-50 border-green-200'}`}>
            <h3 className="text-sm font-semibold opacity-80">Total Expense Amount</h3>
            <p className="text-3xl font-black text-green-500">₹{totalCostSum.toFixed(2)}</p>
          </div>
          <div className={`p-4 rounded-xl shadow border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-purple-50 border-purple-200'}`}>
            <h3 className="text-sm font-semibold opacity-80">Budget Status</h3>
            <p className={`text-xl font-black ${isOverBudget ? 'text-red-500' : 'text-purple-600'}`}>
              {isOverBudget ? 'Over Budget 🚨' : 'Safe Within Limit ✅'}
            </p>
          </div>
        </div>

        {/* Visual Analytics Charts Section */}
        {chartData.length > 0 && (
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-6 rounded-2xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`}>
            <div>
              <h3 className="text-md font-bold mb-4 text-center">Category-wise Cost Distribution (Bar Graph)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" stroke={darkMode ? '#fff' : '#000'} />
                    <YAxis stroke={darkMode ? '#fff' : '#000'} />
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', color: darkMode ? '#fff' : '#000' }} />
                    <Bar dataKey="Cost" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <h3 className="text-md font-bold mb-4 text-center">Expense Share (Breakdown Ratio)</h3>
              <div className="h-64 flex justify-center items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} dataKey="Cost" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: darkMode ? '#1f2937' : '#fff', color: darkMode ? '#fff' : '#000' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className={`grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-6 rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'}`}>
          <input type="text" name="projectName" placeholder="Project / Item Name" value={formData.projectName} onChange={handleChange} className={`border p-2.5 rounded-lg focus:outline-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white'}`} required />
          
          <select name="category" value={formData.category} onChange={handleChange} className={`border p-2.5 rounded-lg focus:outline-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white'}`}>
            <option value="Material">Material</option>
            <option value="Labor">Labor</option>
            <option value="Overhead">Overhead</option>
            <option value="Rent & Utilities">Rent & Utilities</option>
            <option value="Transport">Transport</option>
          </select>

          <input type="number" name="cost" placeholder="Cost Amount (₹)" value={formData.cost} onChange={handleChange} className={`border p-2.5 rounded-lg focus:outline-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white'}`} required />
          
          <input type="date" name="entryDate" value={formData.entryDate} onChange={handleChange} className={`border p-2.5 rounded-lg focus:outline-blue-500 ${darkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-white'}`} required />

          <button type="submit" className="bg-blue-600 text-white p-2.5 rounded-lg font-bold hover:bg-blue-700 transition shadow">Add Entry</button>
        </form>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input 
            type="text" 
            placeholder="Search by project name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`border p-2.5 rounded-lg focus:outline-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}`}
          />
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className={`border p-2.5 rounded-lg focus:outline-blue-500 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white'}`}
          >
            <option value="ALL">All Categories</option>
            <option value="Material">Material</option>
            <option value="Labor">Labor</option>
            <option value="Overhead">Overhead</option>
            <option value="Rent & Utilities">Rent & Utilities</option>
            <option value="Transport">Transport</option>
          </select>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-gray-700 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`${darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-800 text-white'}`}>
                <th className="p-3 border-b border-gray-700">ID</th>
                <th className="p-3 border-b border-gray-700">Project Name</th>
                <th className="p-3 border-b border-gray-700">Category</th>
                <th className="p-3 border-b border-gray-700">Cost (₹)</th>
                <th className="p-3 border-b border-gray-700">Date</th>
                <th className="p-3 border-b border-gray-700 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.entryId} className={`border-b transition ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'hover:bg-gray-50'}`}>
                  <td className="p-3">#{entry.entryId}</td>
                  <td className="p-3 font-medium">{entry.projectName}</td>
                  <td className="p-3"><span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold">{entry.category || 'Material'}</span></td>
                  <td className="p-3 font-bold text-green-600">₹{entry.cost || entry.totalCost}</td>
                  <td className="p-3 text-sm opacity-80">{entry.entryDate || '2026-09-05'}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => handleDelete(entry.entryId)} className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-600 transition shadow">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-6 text-center text-gray-500">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

export default App;