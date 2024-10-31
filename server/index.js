const express = require('express');
const app = express();
const cors = require('cors');

app.use(cors())

app.listen(8081, () => {
    console.log('server listening on port 8081')
});

app.get('/', (req, res) => {
    res.send('Hello from our server!')
})