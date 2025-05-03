import API from './config';

// Todo API services
const TodoService = {
  // Get all todos for a user
  getTodosByUser: (userId) => {
    return API.get(`/todolist/todos/${userId}`);
  },

  // Create a new todo
  createTodo: (todoData) => {
    return API.post('/todolist/create', todoData);
  },

  // Toggle todo completion status
  toggleTodoStatus: (todoId) => {
    return API.patch(`/todolist/toggle/${todoId}`);
  },

  // Update todo priority
  updateTodoPriority: (todoId, priority) => {
    return API.patch(`/todolist/priority/${todoId}`, { priority });
  },

  // Delete a todo
  deleteTodo: (todoId) => {
    return API.delete(`/todolist/delete/${todoId}`);
  }
};

export default TodoService;
