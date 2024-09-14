// public/js/script.js
document.addEventListener('DOMContentLoaded', function () {
    const taskForm = document.getElementById('task-form');
    const taskList = document.getElementById('task-list');
    
    // Load tasks from the server
    fetch('/api/tasks')
        .then(response => response.json())
        .then(data => {
            data.forEach(task => {
                addTaskToList(task);
            });
        });

    // Handle task addition
    taskForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const taskInput = document.getElementById('task-input');
        const description = taskInput.value.trim();

        if (description) {
            fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description })
            })
            .then(response => response.json())
            .then(task => {
                addTaskToList(task);
                taskInput.value = '';
            });
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
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                taskList.removeChild(li);
            }
        });
    }
});
