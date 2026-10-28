# ATSVisionTrainer 在线文档

五语言 MkDocs 静态文档，对应 Windows V1.0.0 / Build 2026.11。

## Vercel 部署

导入本仓库，Framework Preset 选 Other，Root Directory 保持仓库根目录。仓库中的 vercel.json 已配置空构建命令及静态输出目录，无需安装依赖。

部署后检查首页、语言切换、搜索高亮和章节链接，再按需绑定自有子域名。

## 内容维护

正文与训练项目的五语言帮助共用来源；请在训练项目中维护并核对参数，然后使用 .venv-docs/Scripts/python.exe tools/export_online_help.py --output <新目录> 重新导出。导出后同步网站内容至本仓库，再提交推送。在线导出不修改软件自带的 help_site。
