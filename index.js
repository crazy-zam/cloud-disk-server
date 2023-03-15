const express = require('express');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const config = require('config');
const bodyParser = require('body-parser');
const authRouter = require('./routes/auth.routes.js');
const fileRouter = require('./routes/file.routes.js');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || config.get('serverPort');
const filePathMiddleware = require('./middleware/filePath.middleware');
const path = require('path');

app.use(fileUpload({ defCharset: 'utf8', defParamCharset: 'utf8' }));
app.use(cors());
app.use(filePathMiddleware(path.resolve(__dirname)));
// app.use(filePathMiddleware(path.resolve(__dirname, 'files')));
app.use(express.static('static'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRouter);
app.use('/api/file', fileRouter);

const start = async () => {
  try {
    await mongoose.connect(config.get('dbUrl'), {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    app.listen(PORT, () => {
      console.log('Server started on port ', PORT);
    });
  } catch (e) {}
};

start();
