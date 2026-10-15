# 赛博抽象标本馆

[![Validate and deploy Pages](https://github.com/ZaneZhang-67/absurd-video-museum/actions/workflows/pages.yml/badge.svg)](https://github.com/ZaneZhang-67/absurd-video-museum/actions/workflows/pages.yml)

> 不囤视频，保存互联网偶然发疯的证据。

这是一个可考据、可检索、可分叉的抽象视频标本馆。每份馆藏不仅包含可播放的轻量预览，还记录出处、权利状态、名场面时间点、抽象指数和二创谱系。

线上展馆：<https://zanezhang-67.github.io/absurd-video-museum/>

## 它比视频文件夹多了什么

- **标本卡**：来源、作者、日期、标签和语境不会随着转发链消失。
- **名场面坐标**：直接跳到改变人类精神状态的那一秒。
- **抽象矩阵**：分别记录逻辑断层、表演浓度、二创潜力与语境崩塌。
- **梗谱系**：用父子关系追踪一个梗如何变异，而不把二创冒充原作。
- **命运选片**：首页随机抽取标本。
- **社区考据**：用 Issue 投稿、用 PR 补证据，所有修订都有历史。

## 本地参观

    python3 -m http.server 8000

然后访问 <http://localhost:8000>。页面没有构建依赖，现代浏览器即可运行。

## 投稿

请使用[视频投稿表](https://github.com/ZaneZhang-67/absurd-video-museum/issues/new?template=submit-video.yml)。只接受投稿者原创或已获得明确展示授权的素材；必须同时提供可核验出处和权利说明。

参与方式见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 数据格式

馆藏目录位于 [catalog.json](catalog.json)，结构定义位于 [schema/video-catalog.schema.json](schema/video-catalog.schema.json)。修改目录后运行：

    python3 scripts/validate_catalog.py
    python3 -m unittest discover -s tests -v

校验器会检查本地媒体、日期、评分、时间点、重复 ID，以及双向梗谱系是否一致。GitHub Actions 会对每个 PR 执行相同检查。

## 存储策略

Git 仓库只保存经过授权的轻量预览、海报、字幕与元数据。高码率原片应放在 GitHub Releases、Internet Archive 或投稿者控制的对象存储中，再从标本卡引用。这样克隆仓库不需要下载整个互联网。

## 目录

    assets/       网站样式、交互和海报
    media/        可直接播放的轻量预览
    schema/       馆藏 JSON Schema
    scripts/      目录校验工具
    tests/        校验器失败契约测试
    catalog.json  馆藏索引

## 许可

网站代码使用 [MIT License](LICENSE)。媒体不因进入仓库而自动采用 MIT；每条标本的 rights 字段才是权利依据。开馆原创样片的许可见 [MEDIA-LICENSE.md](MEDIA-LICENSE.md)。
