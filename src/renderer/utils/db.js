import fse from 'fs-extra';
import path from 'path';
import os from 'os';
import sq3 from 'sqlite3';
import logger from './logger';

// 将数据存至系统用户目录，防止用户误删程序
export const docDir = path.join(os.homedir(), 'easy-invoices');
export const dbPath = path.join(docDir, 'data.sqlite3');
fse.ensureFileSync(dbPath);

const sqlite3 = sq3.verbose();
const db = new sqlite3.Database(dbPath);
db.serialize(() => {
  /**
   * 物品表 GOODS
   * name 品名
   * buy_price 进价
   * sell_price 售价
   * total 数量
   * remark 备注
   * create_time 创建时间
   * update_time 修改时间
   */
  db.run(`CREATE TABLE GOODS(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    buy_price REAL NOT NULL,
    sell_price REAL NOT NULL,
    total INTEGER NOT NULL,
    remark TEXT NOT NULL,
    create_time INTEGER NOT NULL,
    update_time INTEGER NOT NULL
    )`, err => {
    logger(err);
  });

  /**
   * 进出明细表 GOODS_DETAIL_LIST
   * goods_id 物品id
   * type 类型 (+,-)
   * number 操作数量
   * remark 备注
   * create_time 操作时间
   */
  db.run(`CREATE TABLE GOODS_DETAIL_LIST(
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goods_id TEXT NOT NULL, 
    type TEXT NOT NULL,
    number INTEGER NOT NULL,
    remark TEXT NOT NULL,
    create_time INTEGER NOT NULL,
    FOREIGN KEY (goods_id) REFERENCES GOODS(id)
    )`, err => {
    logger(err);
  });
})
;

export default db;
