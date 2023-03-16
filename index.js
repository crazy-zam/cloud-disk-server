const express = require('express');
const fileUpload = require('express-fileupload');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const authRouter = require('./routes/auth.routes.js');
const fileRouter = require('./routes/file.routes.js');
const cors = require('cors');
const app = express();
const filePathMiddleware = require('./middleware/filePath.middleware');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
process.env.PWD = process.cwd();

app.use(fileUpload({ defCharset: 'utf8', defParamCharset: 'utf8' }));
app.use(cors());
app.use(filePathMiddleware(path.resolve(process.env.PWD)));
app.use('/static', express.static(path.resolve(process.env.PWD, 'static')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/api/auth', authRouter);
app.use('/api/file', fileRouter);

const PORT = process.env.PORT;

const start = async () => {
  try {
    await mongoose.connect(process.env.dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    app.listen(PORT, () => {
      console.log('Server started on port ', PORT);
    });
  } catch (e) {
    console.log(e);
  }
};

start();
