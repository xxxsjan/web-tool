




/*
     FILE ARCHIVED ON 0:54:02 一月 21, 2015 AND RETRIEVED FROM THE
     INTERNET ARCHIVE ON 7:52:32 十月 26, 2015.
     JAVASCRIPT APPENDED BY WAYBACK MACHINE, COPYRIGHT INTERNET ARCHIVE.

     ALL OTHER CONTENT MAY ALSO BE PROTECTED BY COPYRIGHT (17 U.S.C.
     SECTION 108(a)(3)).
*/
/**
 * Cookie 工具类
 */

var CookieUtility = {};

/**
 * 获取 Cookie
 *
 * @param string name :: Cookie 名称
 * @return string/null :: 未获取到时返回 null
 * @version 1.0
 */
CookieUtility.getCookie = function(name) {
    var array = document.cookie.match(new RegExp("(^| )" + name + "=([^;]*)(;|$)"));
    if(array != null) {
        return unescape(array[2]);
    }
    return null;
}

/**
 * 设置 Cookie
 *
 * @param string name :: Cookie 名称
 * @param string value :: Cookie 值，只能是字符串，因为 Javascript 的 Cookie 只能以字符串的形式保存
 * @param int expire :: Cookie 保存的时间，单位：秒，不设置时关闭浏览器立即失效
 * @param string path :: Cookie 有效路径，如：/dir
 * @param string domain :: Cookie 的 domain 域，如：domain.com
 * @version 1.0
 */
CookieUtility.setCookie = function(name, value, expire, path, domain) {
    var expireString = "";
    if (expire != undefined) {
        var date = new Date();
        date.setTime(date.getTime() + expire * 1000);
        expireString = "expires=" + date.toGMTString() + ";";
    }

    var pathString = "";
    if (path != undefined) {
        pathString = "path=" + path + ";";
    }

    var domainString = "";
    if (domain != undefined) {
        domainString = "domain=" + domain + ";";
    }

    document.cookie = name + "=" + escape(value) + ";" + expireString + pathString + domainString;
}

/**
 * 删除 Cookie
 *
 * @param string name :: Cookie 名称
 * @version 1.0
 */
CookieUtility.delCookie = function(name) {
    var date = new Date();
    date.setTime(date.getTime() - 1);
    var value = getCookie(name);
    if(value != null) {
        document.cookie = name + "=" + value + ";expires=" + date.toGMTString();
    }
}