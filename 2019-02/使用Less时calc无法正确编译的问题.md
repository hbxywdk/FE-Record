##### 编译Less文件时这样写：
```
  width: calc(100% - 30px);
```
##### 会被编辑成：
```
  width: calc(100%);
```
##### 写为如下形式可解决：
```
  width: calc(~"100% - 30px");
```
##### 如写入变量：
```
  @a: 30px;
  width: calc(~"100% - " + @a);
  或
  width: calc(~"100% - " @a);
  或
  width: calc(~"100% - @{a}");
```