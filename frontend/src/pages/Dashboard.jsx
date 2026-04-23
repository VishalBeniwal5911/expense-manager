import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

const CATEGORIES = ['Food', 'Travel', 'Bills', 'Shopping', 'Health', 'Entertainment', 'Other'];

const categoryEmoji = {
  Food: '🍔', Travel: '✈️', Bills: '📄', Shopping: '🛍️',
  Health: '💊', Entertainment: '🎬', Other: '💼'
};

const categoryClass = {
  Food: 'cat-food', Travel: 'cat-travel', Bills: 'cat-bills',
  Shopping: 'cat-shopping', Health: 'cat-health',
  Entertainment: 'cat-entertainment', Other: 'cat-other'
};

function Dashboard() {
  const [expenses, setExpenses] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0]
  });
  const [adding, setAdding] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchExpenses = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/expenses', { headers });
      setExpenses(res.data);
    } catch {
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExpenses(); }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.title || !form.amount) return setError('Title and Amount are required');
    setAdding(true);
    setError('');
    try {
      await axios.post('http://localhost:5000/api/expense', form, { headers });
      setForm({ title: '', amount: '', category: 'Food', date: new Date().toISOString().split('T')[0] });
      await fetchExpenses();
    } catch {
      setError('Failed to add expense');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/expense/${id}`, { headers });
      setExpenses(prev => prev.filter(e => e._id !== id));
    } catch {
      setError('Failed to delete');
    }
  };

  const filtered = filter === 'All' ? expenses : expenses.filter(e => e.category === filter);
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  const filteredTotal = filtered.reduce((sum, e) => sum + e.amount, 0);

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <>
      <Navbar />
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>📊 My Expenses</h2>
          <p>Track and manage all your daily expenses in one place</p>
        </div>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💸</div>
            <div className="stat-info">
              <h3>₹{total.toFixed(2)}</h3>
              <p>Total Spent</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <h3>{expenses.length}</h3>
              <p>Total Transactions</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📅</div>
            <div className="stat-info">
              <h3>₹{expenses.length ? (total / expenses.length).toFixed(0) : 0}</h3>
              <p>Average per Expense</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏷️</div>
            <div className="stat-info">
              <h3>{[...new Set(expenses.map(e => e.category))].length}</h3>
              <p>Categories Used</p>
            </div>
          </div>
        </div>

        {error && <div className="error-msg" style={{ marginBottom: 20 }}>{error}</div>}

        <div className="main-grid">
          {/* Add Expense Form */}
          <div className="form-card">
            <h3>➕ Add New Expense</h3>
            <form onSubmit={handleAdd}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  name="title"
                  placeholder="e.g. Lunch at restaurant"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label>Amount (₹)</label>
                <input
                  type="number"
                  name="amount"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select name="category" value={form.category} onChange={handleChange}>
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{categoryEmoji[c]} {c}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                />
              </div>
              <button type="submit" className="btn-add" disabled={adding}>
                {adding ? 'Adding...' : '➕ Add Expense'}
              </button>
            </form>
          </div>

          {/* Expense List */}
          <div className="expense-list-card">
            <div className="expense-list-header">
              <h3>📑 Expense History
                {filter !== 'All' && (
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.85rem' }}>
                    &nbsp;— ₹{filteredTotal.toFixed(2)} total
                  </span>
                )}
              </h3>
              <select
                className="filter-select"
                value={filter}
                onChange={e => setFilter(e.target.value)}
              >
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{categoryEmoji[c]} {c}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="loading">⏳ Loading expenses...</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">🧾</span>
                <p>{filter === 'All' ? 'No expenses yet. Add your first one!' : `No expenses in ${filter} category.`}</p>
              </div>
            ) : (
              filtered.map(exp => (
                <div key={exp._id} className="expense-item">
                  <div className="expense-left">
                    <div className="expense-emoji">{categoryEmoji[exp.category]}</div>
                    <div className="expense-info">
                      <h4>{exp.title}</h4>
                      <span>
                        {new Date(exp.date).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                        <span className={`category-badge ${categoryClass[exp.category]}`}>
                          {exp.category}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="expense-right">
                    <div className="expense-amount">−₹{exp.amount.toFixed(2)}</div>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(exp._id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;