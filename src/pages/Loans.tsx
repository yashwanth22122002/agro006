import React, { useState, useEffect } from 'react';
import { CreditCard, DollarSign, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const loanTypes = [
  {
    title: 'Crop Loan',
    description: 'Short-term loan for seasonal agricultural operations',
    interest: '7%',
    maxAmount: 500000,
    termMonths: 12,
  },
  {
    title: 'Equipment Financing',
    description: 'Long-term loan for agricultural machinery and equipment',
    interest: '8.5%',
    maxAmount: 2000000,
    termMonths: 36,
  },
  {
    title: 'Land Development',
    description: 'Loan for land improvement and development activities',
    interest: '9%',
    maxAmount: 1500000,
    termMonths: 24,
  },
];

interface Loan {
  id: number;
  amount: number;
  interest_rate: number;
  term_months: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  created_at: string;
}

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [selectedLoan, setSelectedLoan] = useState(loanTypes[0]);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchLoans();
  }, []);

  const fetchLoans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/loans', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch loans');
      const data = await response.json();
      setLoans(data);
    } catch (err) {
      setError('Failed to load loans');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          interest_rate: parseFloat(selectedLoan.interest),
          term_months: selectedLoan.termMonths,
          type: selectedLoan.title
        })
      });

      if (!response.ok) throw new Error('Failed to submit loan request');
      
      setAmount('');
      fetchLoans();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      case 'paid': return 'text-blue-600 bg-blue-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Agricultural Loans</h1>
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {loanTypes.map((loan) => (
          <div 
            key={loan.title} 
            className={`bg-white rounded-xl shadow-sm p-6 cursor-pointer border-2 ${
              selectedLoan.title === loan.title ? 'border-green-600' : 'border-transparent'
            }`}
            onClick={() => setSelectedLoan(loan)}
          >
            <DollarSign className="h-8 w-8 text-green-600" />
            <h3 className="text-lg font-semibold mt-4">{loan.title}</h3>
            <p className="text-gray-600 mt-2">{loan.description}</p>
            <div className="mt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Interest Rate</span>
                <span className="font-semibold">{loan.interest}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Maximum Amount</span>
                <span className="font-semibold">₹{loan.maxAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Term</span>
                <span className="font-semibold">{loan.termMonths} months</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Apply for {selectedLoan.title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan Amount (₹)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min="1000"
              max={selectedLoan.maxAmount}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              'Submit Application'
            )}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">My Loan Applications</h2>
        <div className="space-y-4">
          {loans.length === 0 ? (
            <p className="text-gray-500 text-center">No loan applications yet</p>
          ) : (
            loans.map((loan) => (
              <div key={loan.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">₹{loan.amount.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">
                    Applied on {new Date(loan.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(loan.status)}`}>
                    {loan.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}