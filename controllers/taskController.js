const db = require('../models/db');

// Get all tasks
exports.getAllTasks = (req, res) => {
    db.query('SELECT * FROM tasks', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
};

// Add a task
exports.addTask = (req, res) => {
    const description = req.body.description;
    db.query('INSERT INTO tasks (description) VALUES (?)', [description], (err, result) => {
        if (err) throw err;
        res.json({ id: result.insertId, description, is_completed: 0 });
    });
};

// Delete a task by ID
exports.deleteTask = (req, res) => {
    const id = req.params.id;  // The id from the route parameter
    db.query('DELETE FROM tasks WHERE id = ?', [id], (err, result) => {
        if (err) throw err;
        if (result.affectedRows > 0) {
            res.json({ success: true });
        } else {
            res.status(404).json({ success: false, message: 'Task not found' });
        }
    });
};
