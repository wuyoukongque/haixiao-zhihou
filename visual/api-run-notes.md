# 火山生图 API 调试记录

## 当前状态

脚本：

`scripts/generate_seedream_masterpack.py`

测试资产：

`cover_tide`

接口：

`https://ark.cn-beijing.volces.com/api/v3/images/generations`

鉴权：

`ARK_API_KEY`

## 已确认

- API Key 可以用于访问方舟接口。
- 请求已到达火山方舟服务。
- 失败原因不是网络问题，也不是脚本无法读提示词。

## 当前失败原因

账号尚未开通对应模型服务，或模型 ID 与控制台开通模型不一致。

已测试：

| 模型 ID | 结果 |
|---|---|
| `doubao-seedream-4-5-251128` | `ModelNotOpen` |
| `doubao-seedream-4-0-250828` | `ModelNotOpen` |
| `doubao-seedream-3-0-t2i-250415` | `InvalidEndpointOrModel.NotFound` |

## 下一步

需要在火山方舟控制台确认：

1. 当前 API Key 所属项目是否已开通图片生成模型。
2. 已开通的具体模型 ID。
3. 如果使用的是自定义 Endpoint，需要使用 Endpoint ID，而不是基础模型 ID。
4. 如果之前成功使用的是非方舟图片服务，需要提供当时的 API 地址或代码片段。

拿到正确模型 ID 后，可运行：

```bash
ARK_API_KEY="..." ARK_IMAGE_MODEL="正确模型ID" \
python3 scripts/generate_seedream_masterpack.py --asset cover_tide --variants 1
```

