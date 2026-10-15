# 参与标本馆

## 投稿新视频

先提交“视频投稿”Issue。只接受投稿者原创或已经获得明确展示授权的素材。投稿至少需要原始链接、创作者或权利人、许可依据、收录理由，以及一个名场面时间点。

## 修改目录

1. 为新标本选择稳定的短 ID，例如 airport-printer-opera，不要使用随机后缀。
2. 把轻量预览放入 media/<id>.mp4，海报放入 assets/posters/<id>.webp。
3. 在 catalog.json 添加完整标本卡。
4. 如果它是已有视频的二创，同时更新父条目的 children 和子条目的 parents。
5. 运行本地检查：

       python3 scripts/validate_catalog.py
       python3 -m unittest discover -s tests -v

6. 在 PR 中附上投稿 Issue，并说明本仓库为什么有权展示该媒体。

## 媒体规格

- 预览优先使用浏览器可直接播放的 H.264/AAC MP4；
- 建议最长 30 秒、单文件不超过 20 MiB；
- 海报使用 WebP 或 JPEG；
- 不提交高码率原片、剪辑工程缓存或来源不明的转载包。

## 更正

出处、作者或许可记录有误时，请提交“考据更正”Issue。权利争议会优先停止线上展示，再根据可核验材料处理。
