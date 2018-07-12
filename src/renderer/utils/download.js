import fs from 'fs';
import fse from 'fs-extra';
import xlsx from 'node-xlsx';
import path from 'path';
import os from 'os';
import day from 'dayjs';
import { ipcRenderer } from 'electron';
import logger from './logger';

const tmpPath = path.join(os.tmpdir(), 'easy-invoices');
fse.ensureDirSync(tmpPath);
/**
 * 导出excel
 * @param {String} filename 文件名
 * @param {Object} excelOption 表格配置([{name:<String>,data:<Array>}])
 * @return {Promise} 导出回调
 */
const excel = (filename, excelOption) => {
  return new Promise((resolve, reject) => {
    const buffer = xlsx.build(excelOption);
    const fileName = `${day().format('YYYY-MM-DD_HH-mm-ss')}_${filename}.xlsx`;
    const filePath = path.join(tmpPath, fileName);
    logger('tmp:' + filePath);
    fs.writeFileSync(filePath, buffer);
    ipcRenderer.send('download', filePath);
    ipcRenderer.once('downstate', (event, arg) => {
      if (arg === 'completed' || arg === 'cancelled') {
        resolve(arg);
      } else {
        reject(arg);
      }
      fse.remove(filePath);
    });
  });
};

export default {
  excel,
};

