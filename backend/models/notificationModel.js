const mongoose = require('mongoose');
const notificatonshema = new mongoose.Schema({
    user:{
        type: String,
        required: true
    },
    todoId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'todo',
        required: false
    },
    message:{
        type: String,
        required: true
    },
    type:{
        type: String,
        enum: ['due_soon', 'overdue', 'custom', 'new_todo', 'todo_updated', 'todo_completed', 'todo_deleted'],
        default: 'custom'
    },
    createdAt:{
        type: Date,
        default: Date.now
    },
    read:{
        type: Boolean,
        default: false
    },
    createdAt:{
        type: Date,
        default: Date.now
    }
});


notificatonshema.index({ user: 1, todoId: 1, type: 1 }, { unique: true, partialFilterExpression: { type: { $ne: 'todo_completed' } } });

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificatonshema);
module.exports = Notification;