import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import API from '../api/config';

const useTodoStore = create(
  devtools(
    (set, get) => ({
      // State
      tasks: [],
      filter: 'all',
      editingTodo: null,
      searchTerm: '',
      loading: false,
      showForm: false,
      error: null,

      // Simple computed selectors (not getters)
      getTotalTasks: () => get().tasks.length,
      getCompletedTasks: () => get().tasks.filter(task => task.isCompleted).length,
      getFilteredTasks: () => {
        const { tasks, filter, searchTerm } = get();
        return tasks.filter(task => {
          const term = searchTerm.toLowerCase();
          
          // Filter by completion status
          const matchFilter =
            filter === "completed"
              ? task.isCompleted
              : filter === "pending"
              ? !task.isCompleted
              : true;
          
          // Filter by search term
          const matchSearch =
            (task.task && task.task.toLowerCase().includes(term)) ||
            (task.description && task.description.toLowerCase().includes(term)) ||
            (task.list && task.list.toLowerCase().includes(term));

          return matchFilter && matchSearch;
        });
      },

      // Basic setters
      setTasks: (tasks) => set({ tasks }, false, 'setTasks'),
      setFilter: (filter) => set({ filter }, false, 'setFilter'),
      setEditingTodo: (editingTodo) => set({ editingTodo }, false, 'setEditingTodo'),
      setSearchTerm: (searchTerm) => set({ searchTerm }, false, 'setSearchTerm'),
      setLoading: (loading) => set({ loading }, false, 'setLoading'),
      setShowForm: (showForm) => set({ showForm }, false, 'setShowForm'),
      setError: (error) => set({ error }, false, 'setError'),

      // Async actions
      fetchTasks: async (currentUser) => {
        if (!currentUser || !currentUser.uid) {
          set({ loading: false });
          return;
        }
        
        try {
          set({ loading: true, error: null });
          console.log('Fetching tasks for user:', currentUser.uid);
          const response = await API.get(`/todos/${currentUser.uid}?excludeProjectTodos=true`);
          console.log('Fetched tasks:', response.data);
          set({ tasks: response.data, loading: false });
        } catch (error) {
          console.error("Error fetching tasks:", error);
          set({ 
            tasks: [], 
            loading: false, 
            error: 'Failed to fetch tasks' 
          });
        }
      },

      createTodo: async (taskData, currentUser) => {
        if (!currentUser?.uid) {
          console.error("User not authenticated");
          set({ error: 'User not authenticated' });
          return false;
        }

        try {
          set({ error: null });
          console.log('Creating todo:', taskData);
          const response = await API.post('/todos/create', {
            ...taskData,
            user: currentUser.uid
          });
          console.log('Created todo:', response.data);
          
          set((state) => ({
            tasks: [...state.tasks, response.data],
            showForm: false
          }));
          return true;
        } catch (error) {
          console.error("Error creating todo:", error);
          set({ error: 'Failed to create task' });
          return false;
        }
      },

      updateTodo: async (taskData, originalTodo, currentUser) => {
        if (!currentUser?.uid) {
          console.error("User not authenticated");
          set({ error: 'User not authenticated' });
          return false;
        }

        try {
          set({ error: null });
          console.log('Updating todo:', originalTodo._id, taskData);
          const response = await API.put(`/todos/update/${originalTodo._id}`, {
            ...taskData,
            user: currentUser.uid
          });
          console.log('Updated todo:', response.data);
          
          set((state) => ({
            tasks: state.tasks.map(task =>
              task._id === originalTodo._id ? response.data : task
            ),
            editingTodo: null,
            showForm: false
          }));
          return true;
        } catch (error) {
          console.error("Error updating todo:", error);
          set({ error: 'Failed to update task' });
          return false;
        }
      },

      deleteTodo: async (id) => {
        try {
          set({ error: null });
          console.log('Deleting todo:', id);
          await API.delete(`/todos/delete/${id}`);
          set((state) => ({
            tasks: state.tasks.filter(task => task._id !== id)
          }));
          return true;
        } catch (error) {
          console.error("Error deleting todo:", error);
          set({ error: 'Failed to delete task' });
          return false;
        }
      },

      toggleTodoComplete: async (id, isChecked) => {
        try {
          set({ error: null });
          console.log('Toggling todo:', id, isChecked);
          const response = await API.patch(`/todos/toggle/${id}`, { isCompleted: isChecked });
          console.log('Toggled todo response:', response.data);
          
          set((state) => ({
            tasks: state.tasks.map(task =>
              task._id === id ? (response.data.data || response.data) : task
            )
          }));
          return true;
        } catch (error) {
          console.error("Error toggling todo:", error);
          set({ error: 'Failed to toggle task completion' });
          return false;
        }
      },

      // UI Actions
      startEditing: (task) => {
        set({ 
          editingTodo: task, 
          showForm: true 
        });
      },

      startCreating: () => {
        set({ 
          editingTodo: null, 
          showForm: true 
        });
      },

      cancelForm: () => {
        set({ 
          editingTodo: null, 
          showForm: false 
        });
      },

      // AI Creator specific actions
      addGeneratedTask: async (generatedTask, currentUser) => {
        if (!generatedTask || !currentUser?.uid) {
          set({ error: 'Invalid task or user data' });
          return false;
        }

        try {
          set({ error: null });
          console.log('Adding generated task:', generatedTask);
          
          // Map AI's category to your schema's list enum
          const categoryMap = {
            personal: 'general',
            work: 'work',
            college: 'education',
            other: 'general'
          };

          const mappedCategory = categoryMap[generatedTask.category?.toLowerCase()] || 'general';

          const taskData = {
            task: generatedTask.title,
            description: generatedTask.description || '',
            dueDate: generatedTask.dueDate || '',
            priority: ['low', 'medium', 'high'].includes(generatedTask.priority?.toLowerCase())
              ? generatedTask.priority.toLowerCase()
              : 'medium',
            list: mappedCategory,
            user: currentUser.uid,
            isCompleted: false
          };

          console.log('Mapped task data:', taskData);
          const response = await API.post('/todos/create', taskData);
          console.log('Created generated task:', response.data);
          
          set((state) => ({
            tasks: [...state.tasks, response.data]
          }));
          return true;
        } catch (error) {
          console.error("Error adding generated task to todo list:", error);
          set({ error: 'Failed to add task to todo list. Please try again.' });
          return false;
        }
      },

      // Reset store
      reset: () => {
        set({
          tasks: [],
          filter: 'all',
          editingTodo: null,
          searchTerm: '',
          loading: false,
          showForm: false,
          error: null
        });
      }
    }),
    {
      name: 'todo-store', // name for devtools
    }
  )
);

export default useTodoStore;