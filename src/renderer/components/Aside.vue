<style lang="less">
    @import "../assets/less/global.less";

    aside {
        position: relative;
        background-color: @aside-color;
        box-shadow: 0 0 7px #000;
        .layout-menu-left {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 40px;
        }
        .aside-drop-menu {
            position: absolute;
            height: 40px;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            .ivu-dropdown {
                .ivu-dropdown-rel {
                    cursor: pointer;
                }
            }
        }
    }

    .aboutText {
        p {
            line-height: 26px;
        }
    }

    .psText {
        margin-top: 20px;
    }

</style>

<template>
    <aside>
        <Menu ref="menu" @on-select="selectMenu"
              theme="dark" width="100%" :active-name="activeMenuName" accordion class="layout-menu-left">
            <Menu-item v-for="(menu, index) in MENU" :name="menu.path" :key="index">
                <Tooltip :content="menu.title" placement="right" :delay="800">
                    <Icon :type="menu.icon" :size="20"></Icon>
                </Tooltip>
            </Menu-item>
        </Menu>
        <div class="aside-drop-menu">
            <Dropdown trigger="click" placement="top-start" @on-click="dropMenuClick">
                <Icon type="navicon-round" :size="26" color="white"></Icon>
                <DropdownMenu slot="list">
                    <!--<DropdownItem name="upgrade">
                        <Icon type="ios-cloud-download-outline" :size="14"></Icon>
                        检查更新
                    </DropdownItem>-->
                    <DropdownItem name="about">
                        关于
                    </DropdownItem>
                </DropdownMenu>
            </Dropdown>
        </div>
        <Modal
                v-model="modalShow"
                title="关于">
            <div class="aboutText">
                <p><strong>easy-invoices {{version}}</strong></p>
                <p>专注于桌面端单机版简易进销存业务，初心是帮助我父母提高工作效率。</p>
                <p>该软件免费使用，并开源于<a href="javascript:void(0)"
                                  @click="openUrl('https://github.com/CaanDoll/easy-invoices')">github</a>，目前只构建了windows版本。
                </p>
                <p>如果您有意见或更好的建议，请联系我。</p>
                <p>我的邮箱：<strong>caandoll@aliyun.com</strong></p>
            </div>
            <div class="psText">
                <p>PS：数据存放在<a href="javascript:void(0)"
                              @click="openPath(docDir)">{{dbPath}}</a>。若有重装系统等操作，请记得备份，并在重装后放至相同目录</p>
            </div>
            <div slot="footer">
                <Button @click="modalShow = false">
                    关闭
                </Button>
            </div>
        </Modal>

    </aside>
</template>

<script>
import MENU from '../menu';
import packageJson from '../../../package.json';
import { docDir, dbPath } from '../utils/db';

export default {
  data() {
    return {
      MENU,
      activeMenuName: '',
      modalShow: false,
      version: packageJson.version,
      docDir,
      dbPath,
    };
  },
  methods: {
    selectMenu(path) {
      this.$router.push({ path });
    },
    dropMenuClick(name) {
      switch (name) {
        case 'upgrade':
          console.log('check upgrade');
          break;
        case 'about':
          this.modalShow = true;
          break;
        default:
          null;
      }
    },
    openUrl(url) {
      this.$electron.shell.openExternal(url);
    },
    openPath(path) {
      this.$electron.shell.openItem(path);
    },
  },
  watch: {
    $route() {
      this.activeMenuName = this.$route.path;
      this.$nextTick(() => {
        this.$refs.menu.updateActiveName();
      });
    },
  },
  created() {
    this.activeMenuName = this.$route.path;
    this.$nextTick(() => {
      this.$refs.menu.updateActiveName();
    });
  },
};
</script>
