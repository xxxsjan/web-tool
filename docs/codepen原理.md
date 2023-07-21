# codepen原理

浏览器是通过自带的引擎来解决 html，css 和 js 资源的，处理过程在页面载入的时候就曾经开始。

如果咱们想要动静地运行这些资源，对于 html 和 css 咱们能够用 DOM 操作的形式，对于 js 咱们能够用 eval 或者 new Function()。

然而这些操作都偏简单且不平安（eval 和 new Function()很容易出事），那么有没有什么方法能够既优雅不便，又能平安地动静运行呢？

咱们看看赫赫有名的 Codepen 是怎么做的。

我在 Codepen 外面简略地写了一个按钮，绑定了款式和点击事件，能够看到红色区域曾经展现出咱们想要的后果。

关上控制台自吸察看后能够发现，整个红色区域是一个 iframe，当中的 html 内容就是咱们刚刚所编辑的代码。

不难想象，它的运行原理有点相似于 document.write，把内容间接写入到某一个 html 文件中，

而后把它以 iframe 的形式内嵌到其余网页当中，实现代码预览的逻辑。

那么应用 iframe 有什么益处呢？iframe 能够独立成为一个和宿主隔离的沙箱环境，

在当中运行的代码在大部分状况下不会影响宿主，能无效地保障平安。

配合 HTML5 新增的 sandbox 属性，能够给 iframe 定义更为精密的权限，比方是否容许它运行脚本，是否容许它弹窗等等。

二、实现形式

要实现相似 Codepen 的成果，最重要的一步就是如何把代码注入到 iframe 当中。

因为咱们须要应用到操控 iframe 的相干 API，浏览器出于平安的思考，咱们只能应用同域的 iframe 链接，否则将会报跨域的谬误。

首先筹备好一个 index.html 和 iframe.html，应用一个动态资源服务器把它们跑起来，假如均跑在 localhost:8080。

而后咱们在 index.html 外面插入一个 iframe，其链接就是 localhost:8080/iframe.html，代码如下：

`<iframe src="/iframe.html" frameborder="0"></iframe>`

接下来咱们能够应用 iframe.contentDocument 来获取 iframe 的内容，而后操作它：

```html
<script>
    const iframe = document.querySelector('iframe');
    const iframeDoc = iframe.contentDocument;
    iframeDoc.open();  
    iframeDoc.write(`
        <body>
        <style>button { color: red }</style>
        <button>Click</button>
        <script>
            document.querySelector('button').addEventListener('click',() => {
                console.log('on-click!')
            })
        <\/script>
        </body>
    `);
    iframeDoc.close();  
</script>

```

运行结束后，咱们能够在 localhost:8080/index.html 外面看到和前文 Codepen 所展现的一样的成果：

后续咱们只须要找个输入框，把所写的代码保留成变量，而后调用 iframeDoc.write() 就能够动静地把代码写入到 iframe 并实时运行了。

三、控制台输入及平安

察看 Codepen 的页面，能够看到有一个 Console 的面板，它能够把 iframe 当中的 console 信息间接输入。

这是怎么实现的呢？答案很简略，咱们能够在 iframe 页面中劫持 console 等 API，

在保留原有的控制台输入的性能的前提下，把相干的信息通过 postMessage 的形式把它们输入给父页面，

父页面监听到 message 当前把信息整顿后输入到页面上，实现 Console 面板。

在 iframe.html 中，咱们在body以外写入一段 js 代码（因为父页面调用 iframeDoc.write() 会笼罩 body内的全部内容）：

```js
function rewriteConsole(type) {
    const origin = console[type];
    console[type] = (...args) => {
        window.parent.postMessage({ from: 'codeRunner', type, data: args }, '*');
        origin.apply(console, args);
    };
}
rewriteConsole('log');
rewriteConsole('info');
rewriteConsole('debug');
rewriteConsole('warn');
rewriteConsole('error');
rewriteConsole('table');
```

此外咱们会给 iframe 设置 sandbox 属性来限度其局部权限，

然而这里有一个套娃的隐患，就是如果在 iframe 外面执行 window.parent.document 相干 API 的话，

能够让 iframe 去改写父页面的内容，甚至改写 sandbox 属性，这必定是不平安的，

因而咱们须要在 iframe 中把这相干 API 给屏蔽掉：

```js
Object.defineProperty(window, 'disableParent', {
    get() {
        throw new Error('无奈调用 window.parent 属性！');
    },
    set() {},
});
```

在调用父页面的 iframeDoc.write(code) 之前，咱们须要先把用户输出的自定义代码 code 进行一次 replace，

把当中的所有 parent.document 改成 window.disableParent。当用户调用 parent.document 相干 API 时，

理论在 iframe 运行的是 window.disableParent，

届时将会间接报错无奈调用 window.parent 属性！，无效防止了套娃的安全隐患
