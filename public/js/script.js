document.addEventListener('DOMContentLoaded', function () {
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');

    // Load tasks from the server
    fetch('/api/tasks')
        .then(response => response.json())
        .then(data => {
            if (data.length === 0) {
                console.log('No tasks to display.');
            }
            data.forEach(task => {
                addTaskToList(task);
            });
        })
        .catch(error => {
            console.error('Error fetching tasks:', error);
        });

    // Handle task addition
    taskForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const taskInput = document.getElementById('task-input');
        const description = taskInput.value.trim();

        if (description && description.length <= 255) {
            fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            })
            .then(response => response.json())
            .then(task => {
                addTaskToList(task);
                taskInput.value = '';
            })
            .catch(error => {
                console.error('Error adding task:', error);
            });
        } else {
            console.error('Invalid task description.');
        }
    });

    // Add a task to the list
    function addTaskToList(task) {
        const li = document.createElement('li');
        li.dataset.id = task.id;
        li.textContent = task.description;

        if (task.is_completed) {
            li.classList.add('completed');
        }

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', function () {
            deleteTask(task.id, li);
        });

        li.appendChild(deleteBtn);
        taskList.appendChild(li);
    }

    // Delete a task
    function deleteTask(id, li) {
        fetch(`/api/tasks/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Error: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                li.remove();
            }
        })
        .catch(error => {
            console.error('Error deleting task:', error);
        });
    }
    
});
