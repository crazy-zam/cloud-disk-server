const fs = require('fs');

class FileService {
  createDir(req, file) {
    const filePath = this.getPath(req, file);
    return new Promise((resolve, reject) => {
      try {
        if (!fs.existsSync(filePath)) {
          fs.mkdirSync(filePath);
          return resolve({ message: 'File was created' });
        } else {
          return reject({ message: 'File already exist' });
        }
      } catch (e) {
        return reject({ message: `File error: ${e}` });
      }
    });
  }
  deleteFile(req, file) {
    const path = this.getPath(req, file);
    fs.rmSync(path, { recursive: true });
  }
  getPath(req, file) {
    return (
      req.filePath +
      path.sep +
      'files' +
      path.sep +
      file.user +
      path.sep +
      file.path
    );
  }
}

module.exports = new FileService();
