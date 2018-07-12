<template>
    <div>
        <Form :label-width="90" inline @keydown.native.enter.prevent="getDataList('search')">
            <FormItem label="品名">
                <Select v-model="search.goods_id" style="width:200px;" placeholder="输入关键字进行快捷选择" clearable
                        filterable>
                    <Option v-for="(item,index) in goodsList" :value="item.id" :key="index">{{item.name}}
                    </Option>
                </Select>
            </FormItem>
            <FormItem label="操作时间">
                <DatePicker :options="datePickerOption" type="daterange"
                            style="width: 200px" v-model="search.dateRange" split-panels :editable="false"></DatePicker>
            </FormItem>
            <FormItem :label-width="10">
                <Button type="primary" icon="ios-search" @click="getDataList('search')" title="搜索"></Button>
                <Button style="margin-left:5px;" type="primary" icon="plus-round" @click="add" title="创建"></Button>
                <Button style="margin-left:5px;" type="primary" icon="ios-upload-outline" @click="downloadExcel"
                        title="导出" :loading="downloadExcelLoading"></Button>
            </FormItem>
        </Form>
        <Table border :columns="dataList_table_column" :data="dataList" :loading="tableLoading"></Table>
        <Page :total="dataListTotalCount" :current="searchParams.pageIndex"
              :page-size="searchParams.pageSize" @on-change="getDataList" @on-page-size-change="getDataListOnPageChange"
              :page-size-opts="[10,20,30,40,50]" show-total
              show-sizer show-elevator transfer></Page>
        <Modal v-model="modalShow" :mask-closable="false" title="创建" @on-cancel="modalShow = false">
            <div>
                <Form ref="formVali" :model="modalParams" :rules="ruleValidate" label-position="right"
                      :label-width="130" @keydown.native.enter.prevent="enterConfirm">
                    <FormItem label="品名" prop="goods_id">
                        <Select v-model="modalParams.goods_id" style="width:250px;" placeholder="必选，输入关键字进行快捷选择"
                                filterable @on-change="modalSelectGoods">
                            <Option v-for="(item,index) in goodsList" :value="item.id" :key="index">{{item.name}}
                            </Option>
                        </Select>
                    </FormItem>
                    <FormItem label="操作" prop="type" inline>
                        <Select v-model="modalParams.type" style="width:50px;" placeholder="">
                            <Option value="+">+</Option>
                            <Option value="-" v-if="this.modalParams.total">-</Option>
                        </Select>
                        <InputNumber v-model="modalParams.number" :min="1" :precision="0"
                                     :max="modalParams.type === '-' ? this.modalParams.total : Number.MAX_VALUE"></InputNumber>
                    </FormItem>
                    <FormItem label="备注" prop="remark">
                        <Input v-model="modalParams.remark" type="textarea" :rows="4" placeholder="非必填，长度 200 以内"
                               style="width: 250px"></Input>
                    </FormItem>
                </Form>
            </div>
            <div slot="footer">
                <Button @click="modalShow = false">
                    取消
                </Button>
                <Button type="primary" @click="addConfirm" :loading="btnLoading">确认
                </Button>
            </div>
        </Modal>
    </div>
</template>
<script>
import { datePickerOption } from '../../utils/option';
import filter from '../../utils/filter';
import download from '../../utils/download';

export default {
  data() {
    return {
      // loading
      downloadExcelLoading: false,
      btnLoading: false,
      tableLoading: false,
      // 日期控件配置
      datePickerOption,
      // ----选值
      goodsList: [],
      // ----常用
      search: {
        goods_id: '',
        dateRange: [ null, null ],
        pageIndex: 1,
        pageSize: 10,
      },
      searchParams: {},
      dataList: [],
      dataListTotalCount: 0,
      dataList_table_column: [
        {
          title: '品名',
          key: 'name',
          align: 'center',
          minWidth: 200,
        },
        {
          title: '操作',
          key: 'number',
          align: 'center',
          minWidth: 150,
          render: (h, params) => {
            return h('span', params.row.type + ' ' + params.row.number);
          },
        },
        {
          title: '操作时间',
          key: 'create_time',
          align: 'center',
          minWidth: 150,
          render: (h, params) => {
            return h('span', filter.dateFilter(params.row.create_time));
          },
        },
        {
          title: '备注',
          key: 'remark',
          align: 'center',
          minWidth: 300,
          render: (h, params) => {
            const remark = params.row.remark;
            if (remark) {
              return h('Tooltip', {
                class: {
                  'table-tooltip': true,
                },
                props: {
                  delay: 800,
                },
              }, [
                h('div', remark),
                h('div', {
                  style: {
                    'white-space': 'normal',
                  },
                  slot: 'content',
                }, remark),
              ]);
            }

          },
        },
        {
          title: ' ',
          key: 'action',
          width: 80,
          align: 'center',
          fixed: 'right',
          render: (h, params) => {
            return h('div', [
              h('Poptip', {
                props: {
                  type: 'error',
                  confirm: true,
                  title: '若删除，该操作将回滚',
                  placement: 'top-end',
                  transfer: true,
                  'ok-text': '删除',
                },
                on: {
                  'on-ok': () => {
                    this.del(params.row);
                  },
                },
              }, [
                h('Button', {
                  props: {
                    type: 'error',
                    size: 'small',
                    icon: 'trash-b',
                  },
                  attrs: {
                    title: '删除',
                  },
                  style: {
                    'margin-left': '5px',
                  },
                }),
              ]),
            ]);
          },
        },
      ],
      modalShow: false,
      modalParams: {
        goods_id: '',
        name: '',
        type: '+',
        number: 1,
        total: 0,
        remark: '',
      },
      ruleValidate: {
        goods_id: [
          { required: true, message: '请选择 品名' },
        ],
        remark: [
          { max: 200, message: '备注 长度 200 以内' },
        ],
      },
      downloadExcelSQL: '',
    };
  },
  methods: {
    // 初始化物品
    initGoodsDataList() {
      const rowSQL = 'SELECT * from GOODS';
      this.$logger(rowSQL);
      this.$db.all(rowSQL, (err, res) => {
        if (err) {
          this.$logger(err);
          this.$Notice.error({
            title: '搜索失败',
            desc: err,
          });
        } else {
          this.goodsList = res;
        }
      });
    },
    // 搜索
    getDataList(method) {
      this.tableLoading = true;
      if (method === 'search') {
        this.searchParams = JSON.parse(JSON.stringify(this.search));
      }
      if (typeof method === 'number') {
        this.searchParams.pageIndex = method;
      }
      const searchParams = this.searchParams;
      let whereSQL = 'WHERE ';
      searchParams.goods_id ? whereSQL += `goods_id = '${searchParams.goods_id}' ` : whereSQL += '1 = 1 ';
      searchParams.dateRange[ 0 ] ? whereSQL += `AND GOODS_DETAIL_LIST.create_time >= ${new Date(searchParams.dateRange[ 0 ]).getTime()} ` : null;
      searchParams.dateRange[ 1 ] ? whereSQL += `AND GOODS_DETAIL_LIST.create_time <= ${new Date(searchParams.dateRange[ 1 ]).getTime() + 24 * 60 * 60 * 1000 - 1} ` : null;
      const pageSQL = `LIMIT ${searchParams.pageSize} OFFSET ${(searchParams.pageIndex - 1) * searchParams.pageSize} `;
      const orderSQL = 'ORDER BY GOODS_DETAIL_LIST.id DESC ';
      // 导出sql
      this.downloadExcelSQL = `SELECT
      GOODS_DETAIL_LIST.id,GOODS_DETAIL_LIST.goods_id,GOODS_DETAIL_LIST.type,GOODS_DETAIL_LIST.number,GOODS_DETAIL_LIST.create_time,GOODS_DETAIL_LIST.remark,GOODS.name,GOODS.total
      from GOODS_DETAIL_LIST LEFT OUTER JOIN GOODS ON GOODS_DETAIL_LIST.goods_id = GOODS.id ` + whereSQL + orderSQL;
      const rowSQL = this.downloadExcelSQL + pageSQL;
      const countSQL = 'SELECT COUNT(id) AS totalCount from GOODS_DETAIL_LIST ' + whereSQL;
      this.$logger(rowSQL);
      this.$db.all(rowSQL, (err, res) => {
        if (err) {
          this.$logger(err);
          this.$Notice.error({
            title: '搜索失败',
            desc: err,
          });
        } else {
          if (!res.length && searchParams.pageIndex !== 1) {
            this.getDataList(searchParams.pageIndex - 1);
          } else {
            this.dataList = res;
          }
        }
        this.tableLoading = false;
      });
      this.$logger(countSQL);
      this.$db.get(countSQL, (err, res) => {
        if (err) {
          this.$logger(err);
          this.$Notice.error({
            title: '搜索失败',
            desc: err,
          });
        } else {
          this.dataListTotalCount = res.totalCount;
        }
      });
    },
    // pageSize改变
    getDataListOnPageChange(pageSize) {
      this.search.pageSize = pageSize;
      this.getDataList('search');
    },
    // 新增
    add() {
      this.$refs.formVali.resetFields();
      this.modalParams = this.$options.data().modalParams;
      this.modalShow = true;
    },
    // 选择物品回调
    modalSelectGoods(val) {
      if (val) {
        const SQL = `SELECT total from GOODS WHERE id = '${val}'`;
        this.$logger(SQL);
        this.$db.get(SQL, (err, res) => {
          if (err) {
            this.$logger(err);
            this.$Notice.error({
              title: '搜索失败',
              desc: err,
            });
          } else {
            this.modalParams.total = res.total;
          }
        });
      }
    },
    // 新增确认
    addConfirm() {
      this.$refs.formVali.validate(valid => {
        if (valid) {
          this.btnLoading = true;
          const modalParams = this.modalParams;
          this.$db.serialize(() => {
            this.$db.run('BEGIN');
            // 往物品total中做运算
            const computeSQL = `UPDATE GOODS SET total = ${modalParams.total + modalParams.type + modalParams.number} WHERE id = '${modalParams.goods_id}'`;
            this.$logger(computeSQL);
            this.$db.run(computeSQL, err => {
              if (err) {
                this.$logger(err);
                this.$db.run('ROLLBACK');
              }
            });
            // 往明细记录中增加记录
            const insertSQL = `INSERT INTO GOODS_DETAIL_LIST (goods_id,type,number,remark,create_time)
          VALUES ('${modalParams.goods_id}','${modalParams.type}','${modalParams.number}','${modalParams.remark}','${Date.now()}')`;
            this.$logger(insertSQL);
            this.$db.run(insertSQL, err => {
              if (err) {
                this.$logger(err);
                this.$db.run('ROLLBACK');
              }
            });
            this.$db.run('COMMIT');
            this.modalShow = false;
            this.$Message.success({
              content: '新增成功',
            });
            this.getDataList(1);
            this.btnLoading = false;
          });
        }
      });
    },
    enterConfirm() {
      this.addConfirm();
    },
    //  删除
    del(row) {
      this.$db.serialize(() => {
        this.$db.run('BEGIN');
        // 回滚运算
        const computeSQL = `UPDATE GOODS SET total = ${row.total + (row.type === '+' ? '-' : '+') + row.number} WHERE id = '${row.goods_id}'`;
        this.$logger(computeSQL);
        this.$db.run(computeSQL, err => {
          if (err) {
            this.$logger(err);
            this.$db.run('ROLLBACK');
            this.$Notice.error({
              title: '删除失败',
              desc: err,
            });
          }
        });
        const deleteSQL = `DELETE FROM GOODS_DETAIL_LIST WHERE id = ${row.id}`;
        this.$logger(deleteSQL);
        this.$db.run(deleteSQL, err => {
          if (err) {
            this.$logger(err);
            this.$db.run('ROLLBACK');
            this.$Notice.error({
              title: '删除失败',
              desc: err,
            });
          }
        });
        this.$db.run('COMMIT');
        this.$Message.success({
          content: '删除成功',
        });
        this.getDataList();
      });
    },
    // 导出表格
    downloadExcel() {
      this.downloadExcelLoading = true;
      this.$db.all(this.downloadExcelSQL, (err, res) => {
        if (err) {
          this.$logger(err);
          this.$Notice.error({
            title: '搜索失败',
            desc: err,
          });
        } else {
          const data = [
            [ '品名', '操作', '操作时间', '备注' ],
          ];
          for (const item of res) {
            data.push([ item.name, item.type + item.number, filter.dateFilter(item.create_time), item.remark ]);
          }
          const name = '进出明细';
          download.excel(name, [
            {
              name,
              data,
            },
          ]).then(arg => {
            this.downloadExcelLoading = false;
            if (arg === 'completed') {
              this.$Message.success({
                content: '导出成功',
              });
            } else {
              this.$Message.warning({
                content: '导出取消',
              });
            }
          }).catch(err => {
            this.downloadExcelLoading = false;
            this.$Notice.error({
              title: '导出失败',
              desc: err,
            });
          });
        }
      });
    },
  },
  created() {
    const goods_id = this.$route.query.goods_id;
    if (goods_id) {
      this.search.goods_id = goods_id;
    }
    this.initGoodsDataList();
    this.getDataList('search');
  },
};

</script>
<style lang="less">
</style>
