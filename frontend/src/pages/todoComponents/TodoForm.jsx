// components/todo/TodoForm.jsx
import React, { useState, useEffect } from 'react';
import { useDebounce } from '../hooks/useDebounce';
import AIPriorityPredictor from './AIPriorityPredictor';
import API from '../../api/config';

const TodoForm = ({ editingTodo, onSubmit, onCancel, currentUser }) => {
  const [formData, setFormData] = useState({
    task: "",
    description: "",
    dueDate: "",
    priority: "",
    list: "",
  });
  const [predictedPriority, setPredictedPriority] = useState("");
  const [isPredicting, setIsPredicting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debounce for AI trigger
  const debouncedTask = useDebounce(formData.task, 700);
  const debouncedDescription = useDebounce(formData.description, 700);
  const debouncedDueDate = useDebounce(formData.dueDate, 700);

  useEffect(() => {
    if (editingTodo) {
      setFormData({
        task: editingTodo.task || "",
        description: editingTodo.description || "",
        dueDate: editingTodo.dueDate
          ? new Date(editingTodo.dueDate).toISOString().slice(0, 16)
          : "",
        priority: editingTodo.priority || "",
        list: editingTodo.list || "",
      });
      setPredictedPriority(editingTodo.priority || "");
    } else {
      setFormData({
        task: "",
        description: "",
        dueDate: "",
        priority: "",
        list: "",
      });
      setPredictedPriority("");
    }
  }, [editingTodo]);

  // ✅ Updated: AI Priority Prediction using task, description, dueDate
  const predictPriority = async (task, description, dueDate) => {
    try {
      setIsPredicting(true);

      const trimmedTask = task.trim();
      const trimmedDescription = description.trim();

      if (!trimmedTask || !dueDate) {
        setPredictedPriority("low");
        return "low";
      }

      const mlModelUrl = import.meta.env.MODE === 'development' 
        ? "http://127.0.0.1:5000/predict" 
        : import.meta.env.VITE_ML_MODEL_API_URL;

      const response = await API.post(mlModelUrl, {
        task: trimmedTask,
        description: trimmedDescription,
        due_date: dueDate.slice(0, 10) // format YYYY-MM-DD
      });

      const predicted = response.data.priority;
      setPredictedPriority(predicted);
      return predicted;
    } catch (error) {
      console.error("Priority prediction error:", error);
      setPredictedPriority("low");
      return "low";
    } finally {
      setIsPredicting(false);
    }
  };

  // ✅ Updated: Trigger AI prediction with all 3 fields
  useEffect(() => {
    if (!editingTodo && (debouncedTask || debouncedDescription) && debouncedDueDate) {
      predictPriority(debouncedTask, debouncedDescription, debouncedDueDate);
    }
  }, [debouncedTask, debouncedDescription, debouncedDueDate, editingTodo]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    let taskPriority = formData.priority;

    if (!taskPriority) {
      taskPriority = predictedPriority || "low";
    }

    const taskPayload = {
      ...formData,
      priority: taskPriority.toLowerCase(),
      isCompleted: editingTodo ? editingTodo.isCompleted : false,
    };

    // ✅ FIXED: Pass data to parent instead of making API call here
    await onSubmit(taskPayload, editingTodo);

    // Only reset form for new todos (not edits)
    if (!editingTodo) {
      setFormData({
        task: "",
        description: "",
        dueDate: "",
        priority: "",
        list: "",
      });
      setPredictedPriority("");
    }

  } catch (error) {
    console.error("Error submitting form:", error);
  } finally {
    setIsSubmitting(false);
  }
};

  const handleCancel = () => {
    setFormData({
      task: "",
      description: "",
      dueDate: "",
      priority: "",
      list: "",
    });
    setPredictedPriority("");
    onCancel?.();
  };

  return (
    <div className="p-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-2xl">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
          {editingTodo ? "✏️ Edit Task" : "➕ Create New Task"}
        </h2>
        <button
          onClick={handleCancel}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
          aria-label="Close form"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              name="task"
              value={formData.task}
              onChange={handleChange}
              placeholder="What needs to be done?"
              required
              className="w-full p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:border-purple-400 focus:outline-none transition-colors"
            />
          </div>
          
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              Due Date <span className="text-red-400">*</span>
            </label>
            <input
              name="dueDate"
              type="datetime-local"
              value={formData.dueDate}
              onChange={handleChange}
              required
              className="w-full p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:border-purple-400 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-2">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="3"
            placeholder="Add more details..."
            className="w-full p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 resize-none focus:border-purple-400 focus:outline-none transition-colors"
          />
        </div>

        {!editingTodo && (
          <AIPriorityPredictor 
            predictedPriority={predictedPriority} 
            isPredicting={isPredicting} 
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-300 font-medium mb-2">
              {editingTodo ? "Priority" : "Override Priority (optional)"}
            </label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:border-purple-400 focus:outline-none transition-colors"
            >
              {!editingTodo && <option value="">🤖 Use AI Prediction</option>}
              {editingTodo && <option value="">Select Priority</option>}
              <option value="low">🟢 Low Priority</option>
              <option value="medium">🟡 Medium Priority</option>
              <option value="high">🔴 High Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-2">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              name="list"
              value={formData.list}
              onChange={handleChange}
              required
              className="w-full p-4 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:border-purple-400 focus:outline-none transition-colors"
            >
              <option value="" disabled>Select category</option>
              <option value="general">📝 General</option>
              <option value="work">💼 Work</option>
              <option value="groceries">🛒 Groceries</option>
              <option value="house">🏠 House</option>
              <option value="education">📚 Education</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-4 bg-slate-600/50 hover:bg-slate-600/70 text-slate-300 font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                {editingTodo ? "Updating..." : "Creating..."}
              </div>
            ) : (
              editingTodo ? "Update Task" : "Create Task"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TodoForm;