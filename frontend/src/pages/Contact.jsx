import React from "react";

const Contact = () => {
  return (
    <div className="container mx-auto px-4 mt-12 mb-16">
      <div className="max-w-3xl mx-auto bg-white dark:bg-dark-800 rounded-xl shadow-md p-8">
        <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">📞 Contact Us</h2>
        <p className="text-slate-700 dark:text-slate-300 mb-4 text-lg">Have feedback, questions, or just want to connect?</p>
        <p className="text-slate-700 dark:text-slate-300 mb-6">
          Email us at <a href="mailto:support@zenlist.com" className="text-primary-600 dark:text-primary-400 hover:underline transition-colors">support@zenlist.com</a>
        </p>
        <div className="mt-8 p-6 bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg">
          <h3 className="text-xl font-semibold mb-3 text-slate-900 dark:text-white">We'd love to hear from you</h3>
          <p className="text-slate-600 dark:text-slate-400">Your feedback helps us improve ZenList and make it better for everyone.</p>
        </div>
      </div>
    </div>
  );
};

export default Contact;
