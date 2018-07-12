<template>
    <div>
        <Form :label-width="90" inline @keydown.native.enter.prevent="getDataList('search')">
            <FormItem label="品名">
                <Input v-model="search.name" style="width: 203px" clearable></Input>
            </FormItem>
            <FormItem :label="item.label" v-for="(item,index) in searchInputNumberType" :key="index">
                <InputNumber v-model="search[item.min]" :min="0"
                             :max="search[item.max] ? search[item.max] :Number.MAX_VALUE"></InputNumber>
                —
                <InputNumber v-model="search[item.max]" :min="search[item.min] ? search[item.min] :0"></InputNumber>
                <Button type="text" shape="circle" icon="close-round" size="small" title="清空该项输入"
                        @click="clearInputNumber(item.max,item.min)"></Button>
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
        <Modal v-model="modalShow" :mask-closable="false" :title="modalTitle" @on-cancel="modalShow = false">
            <div>
                <Form ref="formVali" :model="modalParams" :rules="ruleValidate" label-position="right"
                      :label-width="130" @keydown.native.enter.prevent="enterConfirm(modalParams.id)">
                    <FormItem label="品名" prop="name">
                        <Input v-model="modalParams.name" placeholder="必填，长度 100 以内"
                               style="width: 250px"></Input>
                    </FormItem>
                    <FormItem label="进价" prop="buy_price">
                        <Input v-model.number="modalParams.buy_price" placeholder="非必填，小数位不超过2位的正整数"
                               style="width: 250px"></Input>
                    </FormItem>
                    <FormItem label="售价" prop="sell_price">
                        <Input v-model.number="modalParams.sell_price" placeholder="非必填，小数位不超过2位的正整数"
                               style="width: 250px"></Input>
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
                <Button type="primary" v-if="!modalParams.id" @click="addConfirm" :loading="modalBtnLoading">确认
                </Button>
                <Button type="primary" v-if="modalParams.id" @click="editConfirm" :loading="modalBtnLoading">确认
                </Button>
            </div>
        </Modal>
    </div>
</template>
<script>
import filter from '../../utils/filter';
import download from '../../utils/download';

export default {
  data() {
    return {
      // loading
      downloadExcelLoading: false,
      modalBtnLoading: false,
      tableLoading: false,
      // ----特殊枚举
      searchInputNumberType: [
        {
          label: '数量',
          max: 'totalMax',
          min: 'totalMin',
        },
        {
          label: '进价',
          max: 'buyPriceMax',
          min: 'buyPriceMin',
        },
        {
          label: '售价',
          max: 'sellPriceMax',
          min: 'sellPriceMin',
        },
      ],
      // ----常用
      search: {
        name: '',
        totalMax: null,
        totalMin: null,
        buyPriceMax: null,
        buyPriceMin: null,
        sellPriceMax: null,
        sellPriceMin: null,
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
          title: '数量',
          key: 'total',
          align: 'center',
          minWidth: 150,
        },
        {
          title: '进价',
          key: 'buy_price',
          align: 'center',
          minWidth: 150,
        },
        {
          title: '售价',
          key: 'sell_price',
          align: 'center',
          minWidth: 150,
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
          title: '创建时间',
          key: 'create_time',
          align: 'center',
          minWidth: 150,
          render: (h, params) => {
            return h('span', filter.dateFilter(params.row.create_time));
          },
        },
        {
          title: '修改时间',
          key: 'update_time',
          align: 'center',
          minWidth: 150,
          render: (h, params) => {
            return h('span', filter.dateFilter(params.row.update_time));
          },
        },
        {
          title: ' ',
          key: 'action',
          width: 130,
          align: 'center',
          fixed: 'right',
          render: (h, params) => {
            return h('div', [
              h('Button', {
                props: {
                  type: 'primary',
                  size: 'small',
                  icon: 'ios-list-outline',
                },
                attrs: {
                  title: '查看进出明细',
                },
                on: {
                  click: () => {
                    this.direct(params.row);
                  },
                },
              }),
              h('Button', {
                props: {
                  type: 'primary',
                  size: 'small',
                  icon: 'edit',
                },
                attrs: {
                  title: '修改',
                },
                style: {
                  'margin-left': '5px',
                },
                on: {
                  click: () => {
                    this.edit(params.row);
                  },
                },
              }),
              h('Poptip', {
                props: {
                  type: 'error',
                  confirm: true,
                  title: '若删除，将一并删除该物品明细',
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
        name: '',
        buy_price: '',
        sell_price: '',
        total: 0,
        remark: '',
      },
      ruleValidate: {
        name: [
          { required: true, message: '请输入 品名' },
          { max: 100, message: '品名 长度 100 以内' },
        ],
        buy_price: [
          { pattern: /^(([1-9][0-9]*)|(([0]\.\d{1,2}|[1-9][0-9]*\.\d{1,2})))$/, message: '进价 只能为 小数位不超过2位的正整数' },
        ],
        sell_price: [
          { pattern: /^(([1-9][0-9]*)|(([0]\.\d{1,2}|[1-9][0-9]*\.\d{1,2})))$/, message: '进价 只能为 小数位不超过2位的正整数' },
        ],
        remark: [
          { max: 200, message: '备注 长度 200 以内' },
        ],
      },
      downloadExcelSQL: '',
    };
  },
  computed: {
    modalTitle() {
      return this.modalParams.id ? '修改' : '创建';
    },
  },
  methods: {
    // 清空该项输入
    clearInputNumber(max, min) {
      this.search[ max ] = null;
      this.search[ min ] = null;
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
      let whereSQL = `WHERE name LIKE '%${searchParams.name}%' `;
      searchParams.totalMin !== null ? whereSQL += `AND total >= ${searchParams.totalMin} ` : null;
      searchParams.totalMax !== null ? whereSQL += `AND total <= ${searchParams.totalMax} ` : null;
      searchParams.buyPriceMin !== null ? whereSQL += `AND buy_price >= ${searchParams.buyPriceMin} ` : null;
      searchParams.buyPriceMax !== null ? whereSQL += `AND buy_price <= ${searchParams.buyPriceMax} ` : null;
      searchParams.sellPriceMin !== null ? whereSQL += `AND sell_price >= ${searchParams.sellPriceMin} ` : null;
      searchParams.sellPriceMax !== null ? whereSQL += `AND sell_price <= ${searchParams.sellPriceMax} ` : null;
      const pageSQL = `LIMIT ${searchParams.pageSize} OFFSET ${(searchParams.pageIndex - 1) * searchParams.pageSize} `;
      const orderSQL = 'ORDER BY id DESC ';
      // 导出sql
      this.downloadExcelSQL = 'SELECT * from GOODS ' + whereSQL + orderSQL;
      const rowSQL = this.downloadExcelSQL + pageSQL;
      const countSQL = 'SELECT COUNT(id) AS totalCount from GOODS ' + whereSQL;
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
            // 该页没数据，又不是第一页，就往上一页翻
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
    // 新增确认
    addConfirm() {
      this.$refs.formVali.validate(valid => {
        if (valid) {
          this.modalBtnLoading = true;
          const modalParams = this.modalParams;
          // 检测品名是否存在
          const SQL = `SELECT COUNT(id) AS totalCount from GOODS WHERE name = '${modalParams.name}'`;
          this.$db.get(SQL, (err, res) => {
            if (err) {
              this.$logger(err);
              this.$Notice.error({
                title: '搜索失败',
                desc: err,
              });
            } else {
              if (res.totalCount) {
                this.$Message.warning({
                  content: '品名已存在',
                });
                this.modalBtnLoading = false;
              } else {
                const SQL = `INSERT INTO GOODS (name,total,buy_price,sell_price,remark,create_time,update_time)
          VALUES ('${modalParams.name}','${modalParams.total}','${modalParams.buy_price}','${modalParams.sell_price}','${modalParams.remark}','${Date.now()}','')`;
                this.$logger(SQL);
                this.$db.run(SQL, err => {
                  if (err) {
                    this.$logger(err);
                    this.$Notice.error({
                      title: '新增失败',
                      desc: err,
                    });
                  } else {
                    this.modalShow = false;
                    this.$Message.success({
                      content: '新增成功',
                    });
                    this.getDataList(1);
                  }
                  this.modalBtnLoading = false;
                });
              }
            }
          });
        }
      });
    },
    // 跳转
    direct(row) {
      this.$router.push({
        path: '/detailList',
        query: {
          goods_id: row.id,
        },
      });
    },
    // 编辑
    edit(row) {
      this.$refs.formVali.resetFields();
      this.modalParams = {
        id: row.id,
        name: row.name,
        buy_price: row.buy_price,
        sell_price: row.sell_price,
        remark: row.remark,
      };
      this.modalShow = true;
    },
    // 编辑确认
    editConfirm() {
      this.$refs.formVali.validate(valid => {
        if (valid) {
          this.modalBtnLoading = true;
          const modalParams = this.modalParams;
          // 检测品名是否存在
          const SQL = `SELECT id from GOODS WHERE name = '${modalParams.name}'`;
          this.$db.get(SQL, (err, res) => {
            if (err) {
              this.$logger(err);
              this.$Notice.error({
                title: '搜索失败',
                desc: err,
              });
            } else {
              if (res && res.id !== modalParams.id) {
                this.$Message.warning({
                  content: '品名已存在',
                });
                this.modalBtnLoading = false;
              } else {
                const SQL = `UPDATE GOODS SET
          name='${modalParams.name}'
          ,buy_price='${modalParams.buy_price}'
          ,sell_price='${modalParams.sell_price}'
          ,remark='${modalParams.remark}'
          ,update_time='${Date.now()}'
          WHERE id = ${modalParams.id}`;
                this.$logger(SQL);
                this.$db.run(SQL, err => {
                  if (err) {
                    this.$logger(err);
                    this.$Notice.error({
                      title: '编辑失败',
                      desc: err,
                    });
                  } else {
                    this.modalShow = false;
                    this.$Message.success({
                      content: '编辑成功',
                    });
                    this.getDataList();
                  }
                  this.modalBtnLoading = false;
                });
              }
            }
          });
        }
      });
    },
    enterConfirm(id) {
      if (id) {
        this.editConfirm();
      } else {
        this.addConfirm();
      }
    },
    //  删除
    del(row) {
      this.$db.serialize(() => {
        this.$db.run('BEGIN');
        // 删除所有明细
        const deleteDetailSQL = `DELETE FROM GOODS_DETAIL_LIST WHERE goods_id = ${row.id}`;
        this.$logger(deleteDetailSQL);
        this.$db.run(deleteDetailSQL, err => {
          if (err) {
            this.$logger(err);
            this.$db.run('ROLLBACK');
            this.$Notice.error({
              title: '删除失败',
              desc: err,
            });
          }
        });
        const deleteSQL = `DELETE FROM GOODS WHERE id = ${row.id}`;
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
            [ '品名', '数量', '进价', '售价', '备注', '创建时间', '修改时间' ],
          ];
          for (const item of res) {
            data.push([ item.name, item.total, item.buy_price, item.sell_price, item.remark, filter.dateFilter(item.create_time), filter.dateFilter(item.update_time) ]);
          }
          const name = '物品管理';
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
    this.getDataList('search');
  },
};

</script>
<style lang="less">
</style>
