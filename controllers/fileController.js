const path = require('path');
const fs = require('fs');
const Uuid = require('uuid');

const User = require('../models/User');
const File = require('../models/File');
const fileService = require('../services/fileService');

class FileController {
  async createDir(req, res) {
    try {
      const { name, type, parent } = req.body;
      const file = new File({ name, type, parent, user: req.user.id });
      const parentFile = await File.findOne({ _id: parent });
      if (!parentFile) {
        file.path = name;
        await fileService.createDir(req, file);
      } else {
        file.path = `${parentFile.path}\\${file.name}`;
        await fileService.createDir(req, file);
        parentFile.childs.push(file._id);
        await parentFile.save();
      }
      await file.save();
      return res.json(file);
    } catch (e) {
      console.log(e);
      return res.status(401).json({ message: `Error: ${e}` });
    }
  }
  async getFiles(req, res) {
    try {
      const { sort } = req.query;
      const files = await File.find({
        user: req.user.id,
        parent: req.query.parent,
      }).sort({ [sort]: 1 });

      return res.json(files);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: `Can get files: ${e}` });
    }
  }

  async getDir(req, res) {
    try {
      const { dirid } = req.query;
      const dir = await File.find({
        user: req.user.id,
        _id: dirid,
      });

      return res.json(dir);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: `Can get files: ${e}` });
    }
  }

  async uploadFile(req, res) {
    try {
      const file = req.files.file;
      const parent = await File.findOne({
        user: req.user.id,
        _id: req.body.parent,
      });
      const user = await User.findOne({ _id: req.user.id });
      if (user.usedSpace + file.size > user.diskSpace) {
        return res.status(400).json({ message: 'There no space on the disk' });
      }

      user.usedSpace = user.usedSpace + file.size;

      let path;
      if (parent) {
        path = `${req.filePath}\\files\\${user._id}\\${parent.path}\\${file.name}`;
      } else {
        path = `${req.filePath}\\files\\${user._id}\\${file.name}`;
      }

      if (fs.existsSync(path)) {
        return res.status(400).json({ message: 'File already exist' });
      }

      file.mv(path);
      const type = file.name.split('.').pop();
      let filePath = file.name;
      if (parent) {
        filePath = parent.path + '\\' + file.name;
      }
      const dbFile = new File({
        name: file.name,
        type,
        size: file.size,
        path: filePath,
        parent: parent ? parent._id : null,
        user: user._id,
      });
      if (parent) {
        parent.childs.push(dbFile._id);
        await parent.save();
      }

      await dbFile.save();
      await user.save();

      res.json(path);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: 'Upload error' });
    }
  }

  async downloadFile(req, res) {
    try {
      const file = await File.findOne({ _id: req.query.id, user: req.user.id });
      const path = fileService.getPath(req, file);
      if (fs.existsSync(path)) {
        return res.download(path, file.name);
      }
      return res.status(500).json({ message: 'Download error, missed file' });
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: 'Download error' });
    }
  }

  deleteFile = async (req, res) => {
    try {
      const file = await File.findOne({ _id: req.query.id, user: req.user.id });
      if (!file) {
        return res.status(400).json({ message: 'File not found' });
      }
      const user = await User.findOne({ _id: req.user.id });
      fileService.deleteFile(req, file);
      const parentFile = await File.findOne({ _id: file.parent });

      if (!!parentFile) {
        parentFile.childs = parentFile.childs.filter(
          (id) => `${id}` != `${file._id}`,
        );
        parentFile.save();
      }
      file.childs.forEach((id) => this.deleteChild(req, res, id, user));
      await file.remove();
      user.usedSpace = user.usedSpace - file.size;
      await user.save();
      return res.status(200).json({ message: 'File was deleted' });
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: 'Delete error' });
    }
  };

  deleteChild = async (req, res, id, user) => {
    try {
      const file = await File.findOne({ _id: id, user: user._id });
      if (!file) return;
      file.childs.forEach((id) => this.deleteChild(id, user));
      await file.remove();
      user.usedSpace = user.usedSpace - file.size;
      await user.save();
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: 'Delete error' });
    }
  };

  async searchFile(req, res) {
    try {
      const searchName = req.query.search;
      let files = await File.find({ user: req.user.id });
      files = files.filter((file) => file.name.includes(searchName));
      return res.json(files);
    } catch (e) {
      console.log(e);
      return res.status(400).json({ message: 'Search error' });
    }
  }
  async uploadAvatar(req, res) {
    try {
      const file = req.files.file;

      const user = await User.findOne({ _id: req.user.id });
      const avatarName = Uuid.v4() + '.jpg';
      file.mv(path.resolve(req.filePath, 'static', avatarName));
      user.avatar = avatarName;
      await user.save();
      res.json(user);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: 'Upload avatar error' });
    }
  }
  async deleteAvatar(req, res) {
    try {
      const user = await User.findOne({ _id: req.user.id });
      const file = fs.unlinkSync(
        path.resolve(req.filePath, 'static', user.avatar),
      );
      user.avatar = null;
      await user.save();
      res.json(user);
    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: 'Delete avatar error' });
    }
  }
}

module.exports = new FileController();
