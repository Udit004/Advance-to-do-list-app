import React from 'react';

const PaymentSuccess = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#1a1c2e] via-[#2a2d4c] to-[#0f1225] text-gray-100">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        <h2 className="text-3xl font-bold text-green-500 mb-4">Payment Successful!</h2>
        <p className="text-lg mb-6">Thank you for your purchase. Your access has been updated.</p>
        <button
          onClick={() => window.location.href = '/projects'}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Go to Projects
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;