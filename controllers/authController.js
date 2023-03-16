const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const User = require('../models/User.js');
const fileService = require('../services/fileService');
const File = require('../models/File');

class AuthController {
  async registerUser(req, res) {
    try {
      const { email, password } = req.body;
      const candidate = await User.findOne({ email });
      if (candidate) {
        return res
          .status(400)
          .json({ message: `User with email ${email} already exist` });
      }
      const hashPassword = await bcrypt.hash(password, 8);
      const user = new User({ email, password: hashPassword });
      await user.save();
      await fileService.createDir(req, new File({ user: user.id, name: '' }));
      return res.json({ message: 'User was created' });
    } catch (e) {
      console.log(e);
      res.send({ message: 'Server error' });
    }
  }

  async loginUser(req, res) {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      3;
      console.log(user);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      const isPassValid = bcrypt.compareSync(password, user.password);
      if (!isPassValid) {
        return res.status(400).json({ message: 'Wrong password' });
      }
      const token = jwt.sign({ id: user.id }, process.env.secretKey, {
        expiresIn: '1h',
      });
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          diskSpace: user.diskSpace,
          usedSpace: user.usedSpace,
          avatar: user.avatar,
        },
      });
    } catch (e) {
      res.send({ message: `Server error: ${e}` });
    }
  }

  async authUser(req, res) {
    try {
      const user = await User.findOne({ _id: req.user.id });
      console.log(user);
      const token = jwt.sign({ id: user.id }, process.env.secretKey, {
        expiresIn: '1h',
      });
      return res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          diskSpace: user.diskSpace,
          usedSpace: user.usedSpace,
          avatar: user.avatar,
        },
      });
    } catch (e) {
      res.send({ message: `Server error: ${e}` });
    }
  }

  async deleteUser(req, res) {
    try {
      await User.deleteOne({ _id: req.user.id });
      await File.deleteMany({ user: req.user.id });
      fs.rmSync(req.filePath + '//files//' + req.user.id, {
        recursive: true,
      });
      res.status(200).json({ message: 'User was deleted' });
    } catch (e) {
      res.send({ message: `Server error: ${e}` });
    }
  }
}

module.exports = new AuthController();
