import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/ui/button";
import API from "../api/config";

const TodoList = () => {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [editingTodo, setEditingTodo] = useState(null);

  useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await API.get(`/todolist/todos/${currentUser.uid}`);
        setTasks(response.data);
      } catch (error) {
        console.error("Error fetching todos:", error);
      }
    };
    fetchTodos();
  }, [currentUser.uid]);

  const [formData, setFormData] = useState({
    task: "",
    description: "",
    dueDate: "",
    priority: "",
    list: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(formData);
    try {
      if (editingTodo) {
        const response = await API.put(
          `/todolist/update/${editingTodo._id}`,
          formData
        );
        if (response.data) {
          setTasks((prevTasks) =>
            prevTasks.map((task) =>
              task._id === editingTodo._id ? response.data : task
            )
          );
        }
        setEditingTodo(null);
        console.log("Todo updated successfully", response.data);
        console.log("Response from update:", response);
      } else {
        const response = await API.post("/todolist/create", {
          ...formData,
          user: currentUser.uid,
        });
        setTasks((prevTasks) => [...prevTasks, response.data.data]);
        console.log("Todo created successfully", response.data);
        console.log("Response from create:", response);
      }
      setFormData({
        task: "",
        description: "",
        dueDate: "",
        priority: "",
        list: "",
      });
    } catch (error) {
      console.error("Error creating todo:", error);
    }
  };

  const handleEditClick = (task) => {
    setEditingTodo(task);
    setFormData({
      task: task.task,
      description: task.description,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 16) : "",
      priority: task.priority,
      list: task.list,
    });
  };

  const handleDelete = async (id) => {
    try {
      const DeleteTodo = await API.delete(`/todolist/delete/${id}`);
      setTasks((prevTasks) => prevTasks.filter((task) => task._id !== id));
      console.log("Todo deleted successfully", DeleteTodo);
    } catch (error) {
      console.error("Error deleting todo:", error);
    }
  };

  return (
    <>
      <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <section className="relative z-0 bg-gradient-to-br from-[#232526]/80 via-[#2c5364]/80 to-[#0f2027]/80 rounded-2xl shadow-lg backdrop-blur-xl bg-gray-800/40  py-10 md:py-16">
          <h1 className="text-3xl font-bold text-center items-center mb-10">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200">
              Create ToDo List
            </span>
          </h1>
          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-6 space-y-0 text-center justify-items-center md:w-3/4 md:mx-auto bg-white/5 p-8 rounded-xl shadow-lg backdrop-blur-md border border-amber-200/10"
            autoComplete="off"
          >
            <div className="w-full">
              <label
                htmlFor="task"
                className="block text-left font-semibold mb-1 text-amber-200"
              >
                Task<span className="text-red-400">*</span>
              </label>
              <input
                id="task"
                name="task"
                type="text"
                value={formData.task}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border-2 border-amber-200/40 bg-transparent text-gray-100 focus:outline-none focus:border-amber-400 placeholder:text-amber-100/60"
                placeholder="Enter your task"
                required
              />
            </div>

            <div className="w-full">
              <label
                htmlFor="description"
                className="block text-left font-semibold mb-1 text-amber-200"
              >
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows="4"
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-lg border-2 border-amber-200/40 bg-transparent text-gray-100 focus:outline-none focus:border-amber-400 placeholder:text-amber-100/60 resize-none"
                placeholder="Add a detailed description of your task)"
                required
              />
            </div>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label
                  htmlFor="dueDate"
                  className="block text-left font-semibold mb-1 text-amber-200"
                >
                  Due Date<span className="text-red-400">*</span>
                </label>
                <input
                  id="dueDate"
                  name="dueDate"
                  type="datetime-local"
                  value={formData.dueDate}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-amber-200/40 bg-transparent text-gray-100 focus:outline-none focus:border-amber-400 [color-scheme:dark]"
                  required
                />
              </div>

              <div className="flex-1">
                <label
                  htmlFor="priority"
                  className="block text-left font-semibold mb-1 text-amber-200"
                >
                  Priority<span className="text-red-400">*</span>
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-amber-200/40 bg-transparent text-gray-100 focus:outline-none focus:border-amber-400"
                  required
                >
                  <option value="" disabled>
                    Select priority
                  </option>
                  <option value="low" className="bg-gray-800">
                    low
                  </option>
                  <option value="medium" className="bg-gray-800">
                    medium
                  </option>
                  <option value="high" className="bg-gray-800">
                    high
                  </option>
                </select>
              </div>

              <div className="flex-1">
                <label
                  htmlFor="category"
                  className="block text-left font-semibold mb-1 text-amber-200"
                >
                  Category
                </label>
                <select
                  id="list"
                  name="list"
                  value={formData.list}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-amber-200/40 bg-transparent text-gray-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="" disabled>
                    Select category
                  </option>
                  <option value="general" className="bg-gray-800">
                    general
                  </option>
                  <option value="groceries" className="bg-gray-800">
                    groceries
                  </option>
                  <option value="work" className="bg-gray-800">
                    work
                  </option>
                  <option value="house" className="bg-gray-800">
                    house
                  </option>
                  <option value="education" className="bg-gray-800">
                    education
                  </option>
                </select>
              </div>
            </div>
            <div className="flex justify-end items-center">
            <Button
              type="submit"
              onClick={handleSubmit}
              className="px-8 py-3 font-semibold rounded-lg bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200 text-gray-900 shadow-md hover:from-amber-700 hover:to-amber-300 transition-all duration-200"
            >
              {editingTodo ? "Update Task" : "Add Task"}
            </Button>
            </div>
          </form>
          <h2 className="text-3xl font-bold text-center mb-10">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-600 via-amber-400 to-amber-200">
              Your Tasks
            </span>
          </h2>
        <div className="space-y-4 md:w-3/4 mx-auto px-8">
          {/* Todo item template - will be mapped over actual todos later */}
          {tasks.filter(task => task).map((task) => {
            console.log("Current task in map:", task);
            return (
            <div
              key={task._id}
              className="bg-white/5 p-6 rounded-xl shadow-lg backdrop-blur-md border border-amber-200/10 flex flex-col md:flex-row gap-4 items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    className="w-5 h-5 rounded border-amber-200/40 bg-transparent checked:bg-amber-400 checked:border-transparent focus:ring-amber-400 focus:ring-offset-0"
                  />
                  <h3 className="text-xl font-semibold text-amber-200 truncate">
                    {task.task}
                  </h3>
                </div>
                <p className="mt-2 text-gray-300">{task.description}</p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm">
                  <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-200">
                    {task.dueDate}
                  </span>
                    <span className="px-3 py-1 rounded-full bg-red-400/20 text-red-200">
                      {task.priority}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-blue-400/20 text-blue-200">
                      {task.list}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 md:flex-col justify-end">
                  <button
                    onClick={() => handleEditClick(task)}
                    className="px-4 py-2 rounded-lg bg-amber-400/20 text-amber-200 hover:bg-amber-400/30 transition-colors duration-200"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task._id)}
                    className="px-4 py-2 rounded-lg bg-red-400/20 text-red-200 hover:bg-red-400/30 transition-colors duration-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
          }


        </div>
      </section>
    </div>
    </>
  );
};

export default TodoList;
