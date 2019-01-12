const express = require('express');

let app = express();

app.use(express.static('www'));

app.listen(9000);

console.log('server is running on port 9000');