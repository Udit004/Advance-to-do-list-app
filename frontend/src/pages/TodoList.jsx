import React, { useEffect, useState } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
import axios from "axios";

const TodoList = () => {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch todos when user changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        fetchTodos(currentUser.uid);
      }
    });
    return () => unsub();
  }, []);

  // Function to fetch todos
  const fetchTodos = async (userId) => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/todolist/todos/${userId}`);
      setTodos(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching todos:", err);
      setError("Failed to load your todos. Please try again.");
      setLoading(false);
    }
  };

  // Function to add a new todo
  const handleAddTodo = async (e) => {
    e.preventDefault();

    if (!newTask.trim()) {
      setError("Task cannot be empty");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post("http://localhost:5000/api/todolist/create", {
        task: newTask,
        description: description,
        dueDate: dueDate,
        priority: priority,
        user: user.uid
      });

      // Add the new todo to the list
      setTodos([...todos, response.data.data]);

      // Clear the form
      setNewTask("");
      setDescription("");
      setDueDate("");
      setPriority("medium");
      setLoading(false);
    } catch (err) {
      console.error("Error adding todo:", err);
      setError("Failed to add todo. Please try again.");
      setLoading(false);
    }
  };

  // Function to toggle todo completion status
  const handleToggleStatus = async (todoId) => {
    try {
      const response = await axios.patch(`http://localhost:5000/api/todolist/toggle/${todoId}`);

      // Update the todo in the list
      setTodos(todos.map(todo =>
        todo._id === todoId ? response.data.data : todo
      ));
    } catch (err) {
      console.error("Error toggling todo status:", err);
      setError("Failed to update todo status. Please try again.");
    }
  };

  // Function to delete a todo
  const handleDeleteTodo = async (todoId) => {
    try {
      await axios.delete(`http://localhost:5000/api/todolist/delete/${todoId}`);

      // Remove the todo from the list
      setTodos(todos.filter(todo => todo._id !== todoId));
    } catch (err) {
      console.error("Error deleting todo:", err);
      setError("Failed to delete todo. Please try again.");
    }
  };

  // Function to update todo priority
  const handlePriorityChange = async (todoId, newPriority) => {
    try {
      const response = await axios.patch(`http://localhost:5000/api/todolist/priority/${todoId}`, {
        priority: newPriority
      });

      // Update the todo in the list
      setTodos(todos.map(todo =>
        todo._id === todoId ? response.data.data : todo
      ));
    } catch (err) {
      console.error("Error updating priority:", err);
      setError("Failed to update priority. Please try again.");
    }
  };

  if (!user) {
    return (
      <div className="container mt-5 text-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Please log in to view your todos</p>
      </div>
    );
  }

  return (
    <div className="container mt-5 todo-container">
      <div className="row">
        <div className="col-md-8 offset-md-2">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">📝 My To-Do List</h2>
            </div>

            <div className="card-body">
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              {/* Add Todo Form */}
              <form onSubmit={handleAddTodo} className="mb-4">
                <div className="mb-3">
                  <label htmlFor="taskInput" className="form-label">New Task</label>
                  <input
                    type="text"
                    className="form-control"
                    id="taskInput"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder="What needs to be done?"
                    required
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="descriptionInput" className="form-label">Description (optional)</label>
                  <textarea
                    className="form-control"
                    id="descriptionInput"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add details about this task..."
                    rows="2"
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label htmlFor="dueDateInput" className="form-label">Due Date</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    id="dueDateInput"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="prioritySelect" className="form-label">Priority</label>
                  <select
                    className="form-select"
                    id="prioritySelect"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Adding...
                    </>
                  ) : (
                    "Add Task"
                  )}
                </button>
              </form>

              <hr />

              {/* Todo List */}
              <h4 className="mb-3">Your Tasks</h4>

              {loading ? (
                <div className="text-center my-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : todos.length === 0 ? (
                <div className="alert alert-info" role="alert">
                  You don't have any tasks yet. Add one above!
                </div>
              ) : (
                <div className="todo-scroll-container" style={{
                  maxHeight: '400px',
                  overflowY: 'auto',
                  borderRadius: '0.25rem',
                  padding: '0.5rem',
                  marginRight: '-0.5rem',
                  boxShadow: 'inset 0 0 5px rgba(0,0,0,0.1)'
                }}>
                  <ul className="list-group">
                    {todos.map((todo) => (
                      <li
                        key={todo._id}
                        className={`list-group-item d-flex justify-content-between align-items-center todo-item ${
                          todo.isCompleted ? "list-group-item-success" : ""
                        }`}
                      >
                        <div className="d-flex align-items-center">
                          <input
                            className="form-check-input me-3"
                            type="checkbox"
                            checked={todo.isCompleted}
                            onChange={() => handleToggleStatus(todo._id)}
                            id={`todo-${todo._id}`}
                          />
                          <div>
                            <label
                              className={`form-check-label ${todo.isCompleted ? "text-decoration-line-through" : ""}`}
                              htmlFor={`todo-${todo._id}`}
                            >
                              {todo.task}
                            </label>
                            {todo.description && (
                              <p className="text-muted small mb-0">{todo.description}</p>
                            )}
                            {todo.dueDate && (
                              <p className="text-muted small mb-0">
                                <strong>Due:</strong> {new Date(todo.dueDate).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="d-flex flex-column align-items-end">
                          <div className="d-flex mb-2">
                            <span className={`badge ${todo.isCompleted ? "bg-success" : "bg-secondary"} me-2`}>
                              {todo.isCompleted ? "Completed" : "Pending"}
                            </span>
                            <span className={`badge ${
                              todo.priority === 'high' ? 'bg-danger' :
                              todo.priority === 'medium' ? 'bg-warning' :
                              'bg-info'
                            } me-2`}>
                              {todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1)} Priority
                            </span>
                          </div>

                          <div className="d-flex">
                            <div className="dropdown me-2">
                              <button
                                className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                type="button"
                                id={`priorityDropdown-${todo._id}`}
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                Priority
                              </button>
                              <ul className="dropdown-menu" aria-labelledby={`priorityDropdown-${todo._id}`}>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handlePriorityChange(todo._id, 'low')}
                                  >
                                    Low
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handlePriorityChange(todo._id, 'medium')}
                                  >
                                    Medium
                                  </button>
                                </li>
                                <li>
                                  <button
                                    className="dropdown-item"
                                    onClick={() => handlePriorityChange(todo._id, 'high')}
                                  >
                                    High
                                  </button>
                                </li>
                              </ul>
                            </div>

                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteTodo(todo._id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TodoList;
