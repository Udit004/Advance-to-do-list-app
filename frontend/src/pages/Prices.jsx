import React from 'react';
import { Check } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const PricingCard = ({ title, price, features, isPopular, onGetStarted }) => (
  <div className={`relative rounded-2xl p-8 ${isPopular ? 'bg-gradient-to-b from-[#1a1c2e]/90 to-[#2a2d4c]/90 text-white backdrop-blur-lg border border-white/10' : 'bg-white/5 backdrop-blur-md border border-white/5 dark:bg-gray-900/50'}`}>
    {isPopular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full text-white text-sm font-medium">
        Most Popular
      </div>
    )}
    <div className="text-center">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <div className="mb-6">
        <span className="text-4xl font-bold">${price}</span>
        <span className="text-gray-400 dark:text-gray-300">/month</span>
      </div>
    </div>
    <ul className="space-y-4 mb-8">
      {features.map((feature, index) => (
        <li key={index} className="flex items-center gap-3">
          <Check className="text-green-500 flex-shrink-0 w-5 h-5" />
          <span className={`${isPopular ? 'text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>{feature}</span>
        </li>
      ))}
    </ul>
    <Button
      className={`w-full ${isPopular ? 'bg-white text-gray-900 hover:bg-gray-100' : 'bg-gradient-to-r from-[#1a1c2e] to-[#2a2d4c] text-white hover:opacity-90'}`}
      onClick={onGetStarted}
    >
      Get Started
    </Button>
  </div>
);

const Prices = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handlePayment = async (price) => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    try {
      // Ensure Razorpay SDK is loaded
      if (!window.Razorpay) {
        alert("Razorpay SDK failed to load. Please refresh the page.");
        return;
      }

      const amountInPaise = parseFloat(price) * 100;

      // Use the production API URL directly
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://advance-to-do-list-app.vercel.app';
      
      const response = await fetch(`${API_BASE_URL}/api/razorpay/initiate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPaise,
          userId: currentUser.uid,
          plan: 'Pro'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const { order } = data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Todo List App',
        description: 'Pro Plan Subscription',
        order_id: order.id,
        handler: async () => {
          navigate('/payment-success');
        },
        prefill: {
          name: currentUser.displayName || '',
          email: currentUser.email || '',
        },
        notes: {
          userId: currentUser.uid,
          plan: 'Pro',
        },
        theme: {
          color: '#3399cc',
        }
      };

      const rzp = new window.Razorpay(options);

      // Optional: Handle payment failure
      rzp.on('payment.failed', function (response) {
        console.error('Payment failed:', response.error);
        alert('Payment failed: ' + response.error.description);
      });

      rzp.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      alert('Failed to initiate payment. Please try again.');
    }
  };

  const plans = [
    {
      title: 'Basic',
      price: '0',
      features: [
        'Up to 5 todo lists',
        'Basic task management',
        'Daily reminders',
        'Mobile access',
        'Email support'
      ]
    },
    {
      title: 'Pro',
      price: '9.99',
      features: [
        'Unlimited todo lists',
        'Advanced task management',
        'Custom reminders',
        'Priority support',
        'Team collaboration',
        'Custom categories',
        'Data export'
      ],
      isPopular: true
    },
    {
      title: 'Enterprise',
      price: '29.99',
      features: [
        'Everything in Pro',
        'Enterprise support',
        'Custom integrations',
        'Advanced analytics',
        'SLA guarantee',
        'Dedicated account manager',
        'Custom branding'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a1c2e] via-[#2a2d4c] to-[#0f1225] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4">Simple, transparent pricing</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Choose the perfect plan for your needs. All plans include a 14-day free trial.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <PricingCard
              key={index}
              {...plan}
              onGetStarted={plan.title === 'Pro' ? () => handlePayment(plan.price) : () => alert('This plan is not purchasable directly. Contact support.')}
            />
          ))}
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-2xl font-semibold text-white mb-6">Frequently Asked Questions</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-3">Can I switch plans later?</h3>
              <p className="text-gray-300">Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-3">What payment methods do you accept?</h3>
              <p className="text-gray-300">We accept all major credit cards, UPI, wallets, and net banking via Razorpay.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-3">Is there a free trial?</h3>
              <p className="text-gray-300">Yes, all plans come with a 14-day free trial. No credit card required during the trial period.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 border border-white/5">
              <h3 className="text-lg font-semibold text-white mb-3">Do you offer refunds?</h3>
              <p className="text-gray-300">Yes, we offer a 30-day money-back guarantee if you're not satisfied with our service.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Prices;