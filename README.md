
# Micoblog

## nodejs+express+ejs+mongodb

####功能
- 用户注册，用户登入登出
- 发布微博，查看用户微博
- 搜索微博
- 用户权限管理

####特点
- 设置session保存登录用户状态并持久化到mongodb
- 错误信息使用req.flash方法传递，符合使用一次即过期的场景
- 使用ejs模板引擎，易于从原生bootstrap迁移
- 密码使用md5加密存储