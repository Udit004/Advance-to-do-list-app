// app.js
const express = require('express');
const bodyParser = require('body-parser');
const taskRoutes = require('./routes/tasks');


const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

app.use('/api', taskRoutes);

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
