// controllers/taskController.js
const db = require('../models/db');

exports.getAllTasks = (req, res) => {
    db.query('SELECT * FROM tasks', (err, results) => {
        if (err) throw err;
        res.json(results);
    });
};

exports.addTask = (req, res) => {
    const description = req.body.description;
    db.query('INSERT INTO tasks (description) VALUES (?)', [description], (err, result) => {
        if (err) throw err;
        res.json({ id: result.insertId, description, is_completed: 0 });
    });
};

exports.deleteTask = (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM tasks WHERE id = ?', [id], (err, result) => {
        if (err) throw err;
        res.json({ success: true });
    });
};
