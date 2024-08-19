const fs = require('fs');
const path = require('path');

const baseDir = './dataset';  // Thay đổi thành đường dẫn tới thư mục chứa các subfolders

function getImages(dir) {
  const result = {};
  
  // Đọc danh sách các subfolders
  const subfolders = fs.readdirSync(dir).filter(file => {
    return fs.statSync(path.join(dir, file)).isDirectory();
  });
  
  subfolders.forEach(folder => {
    const folderPath = path.join(dir, folder);
    
    // Đọc danh sách các files trong subfolder
    const files = fs.readdirSync(folderPath).filter(file => {
      return fs.statSync(path.join(folderPath, file)).isFile() && (file.toUpperCase().endsWith('.JPG') || file.toUpperCase().endsWith('.JPEG') || file.toUpperCase().endsWith('.HEIC'));
    });
    
    result[folder] = files;
  });
  
  return result;
}

const imagesData = getImages(baseDir);

// Ghi dữ liệu vào file JSON
fs.writeFileSync('./dataset/images.json', JSON.stringify(imagesData, null, 2), 'utf-8');

console.log('File images.json đã được tạo thành công!');
