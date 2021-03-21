const got = require('@/utils/got');
const cheerio = require('cheerio');
const {HttpsProxyAgent} = require('hpagent');


const baseUrl = 'https://www.thisav.com/videos';
const siteTitle = '--thisav';

const catrgoryMap = {
    mr: { title: '最新', suffix: '?o=mr' },
    bw: { title: '观看中', suffix: '?o=bw' },
    mv: { title: '最受欢迎', suffix: '?o=mv' },
    tr: { title: '最高评分', suffix: '?o=tr' },
    mc: { title: '评论最多', suffix: '?o=mc' },
    tf: { title: '热门收藏', suffix: '?o=tf' },
    hd: { title: '最新高清', suffix: '?o=hd' }
};

// 专门定义一个function用于加载文章内容
async function load(link) {
    // 异步请求文章
    // const response = await got.get(link);
    const response = await got({
        method: 'get',
        url: link,
        headers: {
            Referer: link,
        },
        // agent: {
        //     https: new HttpsProxyAgent({
        //         keepAlive: true,
        //         keepAliveMsecs: 1000,
        //         maxSockets: 256,
        //         maxFreeSockets: 256,
        //         scheduling: 'lifo',
        //         proxy: 'http://127.0.0.1:1087'
        //     })
        // }
    });
    // 加载文章内容
    const $ = cheerio.load(response.data);
    // 提取文章内容
    const mpdurl = $('source');
    const description = "<script src=\"https://cdn.thisav.com/player/video-js-shaka/player-skin.js?1\"></script><script src=\"https://cdn.thisav.com/player/video-js-shaka/player.full.js?1\"></script><script src='https://cdn.thisav.com/player/video-js-banner/videojs.banner.js?4'></script><link href=\"https://cdn.thisav.com/player/video-js-banner/videojs.banner.css?10\"rel=\"stylesheet\"><script src='https://cdn.thisav.com/player/video-js-resolution/videojs-resolution-switch.js?1'></script><link href=\"https://cdn.thisav.com/player/video-js-resolution/videojs-resolution-switch.css\"rel=\"stylesheet\"><div style=\"width:640px\"><video id=\"my-video\"class=\"video-js vjs-big-play-centered\"controls preload=\"none\"width=\"640\"height=\"360\">" + mpdurl + "<p class=\"vjs-no-js\">To view this video please enable JavaScript,and consider upgrading to a web browser that supports HTML5 video</a></p></video><script>(function(){var vplayer=videojs('my-video',{techOrder:['shaka','html5'],plugins:{videoJsResolutionSwitcher:{default:'high',dynamicLabel:true,},},});var onLoadedMetadata=function(){}if(vplayer.readyState()<1){vplayer.one(\"loadedmetadata\",onLoadedMetadata)}else{onLoadedMetadata()}function reloadVideo(){console.log('reload');setTimeout(function(){vplayer.tech_.shakaPlayer.load(vplayer.options_.sources[0].src)},500)}vplayer.on('vast.adEnd',reloadVideo)})();</script></div>";
    // const description = "<iframe src=\"https://www.xvideos.com/embedframe/54528853\" frameborder=0 width=510 height=400 scrolling=no allowfullscreen=allowfullscreen></iframe>"
    // 返回解析的结果
    return { description };
// 调用外部浏览器方法 弃用
    // // 使用 RSSHub 提供的 puppeteer 工具类，初始化 Chrome 进程
    // const browser = await require('@/utils/puppeteer')();
    // // 创建一个新的浏览器页面
    // const page = await browser.newPage();
    // // 访问指定的链接
    // await page.goto(link);
    // // 渲染目标网页
    // const html = await page.evaluate(
    //     () =>
    //         // 选取渲染后的 HTML
    //         document.querySelector('#my-video').innerHTML
    // );
    // // 关闭浏览器进程
    // browser.close();
    // const $ = cheerio.load(html); // 使用 cheerio 加载返回的 HTML
    // const description = $; // 使用 cheerio 选择器，选择所有 <div class="item"> 元素，返回 cheerio node 对象数组
    // return { description };
}

module.exports = async (ctx) => {
    // 默认 正常规定 然后获取列表页面
    const type = ctx.params.type || 'mr';
    const listPageUrl = baseUrl + catrgoryMap[type].suffix;
    const response = await got({
        method: 'get',
        url: listPageUrl,
        headers: {
            Referer: listPageUrl,
        },
        // agent: {
        //     https: new HttpsProxyAgent({
        //         keepAlive: true,
        //         keepAliveMsecs: 1000,
        //         maxSockets: 256,
        //         maxFreeSockets: 256,
        //         scheduling: 'lifo',
        //         proxy: 'http://127.0.0.1:1087'
        //     })
        // }
    });

    const $ = cheerio.load(response.data);

    // console.log(type+":"+listPageUrl);
    // 获取当前页面的 list
    const list = $('.box>.video_box');
    const result = await Promise.all(
        // 遍历每一篇文章
        list
            .map(async (item) => {
                const $ = cheerio.load(list[item]); // 将列表项加载成 html
                const $rel_url = $('a').attr('href'); // 获取 每一项的url

                // 获取绝对路径
                // console.log(/(http|https):\/\/([\w.]+\/?)\S*/.test($rel_url))
                const $item_url = /(http|https):\/\/([\w.]+\/?)\S*/.test($rel_url) ? $rel_url : baseUrl + $rel_url;

                const $title = $('img').attr('title'); // 获取每个的标题
                const $thumb = $('img').attr('src');
                // const date_txt = $('span').text().match(/[1-9]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])/); // 匹配 yyyy-mm-dd格式时间
                // const $pubdate = new Date(date_txt.input).toUTCString(); // 正则匹配发布时间 然后转换成时间
                const $pubdate = new Date().toUTCString(); // 正则匹配发布时间 然后转换成时间

                // console.log(item + ":" + $item_url + ":" + $title + ":" + $pubdate);
                // 列表上提取到的信息
                // 标题 链接
                const single = {
                    title: $title,
                    pubDate: $pubdate,
                    link: $item_url,
                    guid: $item_url,
                };

                // 对于列表的每一项, 单独获取 时间与详细内容
                const other =  await ctx.cache.tryGet($item_url, async () => await load($item_url));
                other.description = '<img src="' + $thumb + '">\n' + other.description;
                // console.log(other)
                // console.log('DONE'+$title +":"+$item_url)

                // 合并解析后的结果集作为该篇文章最终的输出结果
                return Promise.resolve(Object.assign({}, single, other));
            })
            .get()
    );

    ctx.state.data = {
        title: catrgoryMap[type].title + siteTitle,
        link: baseUrl,
        description: catrgoryMap[type].title + siteTitle,
        item: result,
    };
};
