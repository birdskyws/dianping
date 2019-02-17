(function(){
function mix(a,b){for(var k in b){a[k]=b[k];}return a;}
var _0 = "app-main-search@1.2.16/js/tpl/dsp-ad.js";
var _1 = "app-main-search@1.2.16/js/tpl/favorite-add.js";
var _2 = "app-main-search@1.2.16/js/tpl/favorite-delete.js";
var _3 = "app-main-search@1.2.16/js/tpl/favshop.js";
var _4 = "app-main-search@1.2.16/js/tpl/map.js";
var _5 = "app-main-search@1.2.16/js/tpl/nearby.js";
var _6 = "app-main-search@1.2.16/js/track/track.js";
var _7 = "app-main-search@1.2.16/js/v2.js";
var _8 = "jquery@~1.9.2";
var _9 = "request@~0.2.0";
var _10 = "cookie@~0.2.0";
var _11 = "map-iframe-dp@~0.1.0";
var _12 = "mbox@^1.0.0";
var _13 = "tpl@~0.2.1";
var _14 = "hippo@^1.2.28";
var _15 = "app-main-search@1.2.16/js/inputfilter.js";
var _16 = "app-main-search@1.2.16/js/lazyload.js";
var _17 = "app-main-search@1.2.16/js/favorite.js";
var _18 = "app-main-search@1.2.16/js/bottom_links.js";
var _19 = "app-main-search@1.2.16/js/lx.js";
var _20 = "app-main-search@1.2.16/js/lx-bid.js";
var _21 = "class@^2.0.5";
var _22 = "main-authbox@^1.0.0";
var _23 = "app-main-search@1.2.16/index.js";
var entries = [_0,_1,_2,_3,_4,_5,_6,_7];
var asyncDepsToMix = {};
var globalMap = asyncDepsToMix;
define(_23, [_8,_9,_10,_11,_12,_13,_14,_15,_16,_17,_18,_19,_20,_4,_5], function(require, exports, module, __filename, __dirname) {
/**
 * 搜索页改版
 * @authors gilliam.zhao@dianpinxian
 * @date    2014-10-15 17:39:38
 * @version $Id$
 */

var $ = require("jquery");
var Ajax = require('request').Ajax;
var cookie = require("cookie");
var Map = require("map-iframe-dp");
var Mbox = require("mbox");
var lazyLoad = require("./js/lazyload");
var InputFilter = require("./js/inputfilter");
var tpl = require("tpl");
var JSONP = require("request").JSONP;
var favorite = require("./js/favorite");
var template = {
    map: require("./js/tpl/map"),
    nearby: require("./js/tpl/nearby")
};
var hippo = require("hippo");

var bottomLinks = require('./js/bottom_links');

var LXWrap = require('./js/lx');
const LXBid = require('./js/lx-bid')

// var dspAd = require("./js/dsp_ad");

var canSend = true,
    sltSpotNav;

// 搜索悬浮
var setHeadFix = function() {
    window.onscroll = function() {
        if ($(window).scrollTop() > $('#shop-all-list').offset().top) {
            $('.page-header').addClass('page-header-fixed');
            $('.page-header').css({'height': '56px'});
            $('.search-suggest').css({
                'top': '45px',
                'left': $('.search-bar').offset().left
            });
        } else {
            $('.page-header').removeClass('page-header-fixed');
            $('.page-header').css({'height': '70px'});
            $('.search-suggest').removeClass('search-suggest-fixed');
            $('.search-suggest').css({
                'top': $('.search-bar').offset().top + $('.search-bar').height() - 1,
                'left': $('.search-bar').offset().left
            })
        }
    };

    $('#page-header').find(".J-search-input").on("focus", function(){
        if ($('#page-header').hasClass('page-header-fixed')){
            $('.search-suggest').addClass('search-suggest-fixed');
            $('.search-suggest').css({
                'top': '45px',
                'left': $('.search-bar').offset().left
            });
        }
    })
}

// 获取当前地点
var getCurDom = function(curIndex) {
    var doms = $('#J_nt_items').find('.nc-items'),
        curId = $(doms[curIndex]).attr('id');

    // document.cookie = 'iniNav=' + curIndex; // 初始化nav

    for (var i = 0; i < doms.length; i++) {
        if (!$(doms[i]).attr('id').match(curId)) {
            var curEle = $(doms[i]).find('.cur'),
                curLink;

            if (curEle.length != 0) {
                curLink = curEle.attr('href').split('#');
                curEle.attr('href', curLink[0]);
                curEle.removeClass('cur');
            }

            more(doms[i]);
        }
    }

    var subDoms = $('#J_nt_items').find('.nc-sub');
    for (var i = 0; i < subDoms.length; i++) {
        var fstEle = $($(subDoms[i]).children()[0]),
            fstLink;

        if (fstEle.text() == "不限"){
            var fstLink = fstEle.attr('href').split('#');
            fstEle.attr('href', fstLink[0]);
        }
    }
}

// nav_tabs切换
var switchNavTabs = function(hashs) {
    $('#J_nav_tabs a').each(function(index) {
        $(this).on('click', function() {
            var self = $(this),
                i = self.index(),
                curSubId;

            document.cookie = 'showNav=' + self.attr('href'); // 当前tab 添加至cookie
            $('#J_nav_tabs .cur').removeClass('cur');
            self.addClass('cur');
            $('#J_nt_items .nc-items').addClass('Hide');
            $('#J_nt_items .nc-items:eq(' + i + ')').removeClass('Hide');
            curSubId = $('#J_nt_items .nc-items:eq(' + i + ')').attr('id') + '-sub';

            if (curSubId) {
                var elem = $('#' + curSubId).find('a'),
                    isHide = false,
                    hasCur = -1;

                if (elem) {
                    for (var i = 0; i < elem.length; i++) {
                        if (elem[i].className == 'cur') {
                            hasCur = i;
                            if (elem[i].getElementsByTagName('span')[0].innerText == '不限') {
                                isHide = true;
                                break;
                            }
                        }
                    }
                }

                if (!isHide || $('#J_nt_items .nc-items:eq(' + i + ')').find('.cur') != 0) {
                    $('#' + curSubId).removeClass('Hide')
                }

                if (hasCur == -1 && !$('#' + curSubId).hasClass('hide')) $('#' + curSubId).addClass('Hide');
            }
        });

    });
};

// nav展开
var navPackDown = function() {
    $('.J_packdown').on('click', function() {
        var that = $(this),
            container = that.parent(),
            doms = container.find('a');
        if (doms.hasClass("Hide")) {
            doms.removeClass("Hide");
        }
        $('<a href="javascript:;" class="J_packup more">收起<i class="icon-arr-packup"></i></a>').appendTo(container);
        that.remove();
        navPackUp();
    });
}

// nav收起
var navPackUp = function() {
    $('.J_packup').on('click', function() {
        var that = $(this),
            container = that.parent()[0];
        more(container, 'down');
        that.remove();
        navPackDown();
    });
};

// 排序hover
var filterHover = function() {
    $('.filt-service .fs-slt').each(function(index) {
        var that = $(this);
        that.on('mouseenter', function() {
            var operate = that.find('.slt-list');
            operate.css('display', 'block');
        });
        that.on('mouseleave', function() {
            var operate = that.find('.slt-list');
            operate.css('display', 'none');
        });
    });
};

// shoplist hover
var shoplistHover = function() {
    $('.shop-all-list li').each(function(index) {
        var that = $(this);
        that.on('mouseenter', function() {
            var operate = that.find('.J_operate');
            operate.removeClass('Hide');
        });
        that.on('mouseleave', function() {
            var operate = that.find('.J_operate');
            operate.addClass('Hide');
        });
    })
};

// 团购扩展
var dealPackDown = function(cityid) {
    $('.si-deal').find('.J_more').on('click', function(e) {
        e.stopPropagation();

        var that = $(this),
            container = that.parent();

        if (!container.hasClass('si-tag')) {
            getMoreDeal(container, cityid);
            container.addClass('si-tag');
        }

        container.addClass('si-deal-more');

        $('<a href="javascript:;" class="J_packup more">收起<i class="icon-arr-packup"></i></a>').appendTo(container);
        that.remove();
        dealPackUp(cityid);
    });
}

// 团购收起
var dealPackUp = function(cityid) {
    $('.si-deal').find('.J_packup').on('click', function(e) {
        e.stopPropagation();

        var that = $(this),
            container = that.parent()[0];
        $(container).removeClass('si-deal-more');
        if ($('.si-deal')[0].getAttribute('deal-type') == 'DEAL_GOOD') {
            $('<a href="javascript:;" class="J_more more">更多' + ($(container).find('a').length - 2) + '单商品<i class="icon-arr-extend"></i></a>').appendTo(container);
        } else {
            $('<a href="javascript:;" class="J_more more">更多' + ($(container).find('a').length - 2) + '单团购<i class="icon-arr-extend"></i></a>').appendTo(container);
        }     
        that.remove();
        dealPackDown(cityid);
    });
};

// 跳转新页面 设置滚屏高度
var setScrollTop = function() {
    var scrollCookieName = 'navCtgScroll';

    if (getCookie(scrollCookieName) != null) {
        var sTop = parseInt(getCookie(scrollCookieName));
        $(window).scrollTop(sTop);
    }

    $('.nav-category a').on('click', function(e) {
        var that = $(this);
        document.cookie = 'navCtgScroll=' + $(window).scrollTop();
    });

    $('.filter-box a').on('click', function(e) {
        var that = $(this);
        document.cookie = 'navCtgScroll=' + $(window).scrollTop();
    });
}

// 团购更多优惠标签
var getMoreDeal = function(con, cityid) {
    var dealNodes = con.find('.J_dinfo');
    arrDeal = [],
    arrPrice = [];

    for (var i = 1; i < dealNodes.length; i++) {

        if (!!$(dealNodes[i]).attr('data-deal-id')) {
            arrDeal.push($(dealNodes[i]).attr('data-deal-id'));
            arrPrice.push($(dealNodes[i]).attr('data-deal-price'));
        }
    }

    addDealTag(cityid, arrDeal, arrPrice);
    con.addClass('si-tag');
}

// 团购优惠标签
var getFirDeal = function(cityid) {
    var dealCon = $('.svr-info'),
        arrDeal = [], arrPrice = [];

    for (var i = 0; i < dealCon.length; i++) {
        var curDeal = $($(dealCon[i]).find('.J_dinfo')[0]);

        if (!!curDeal.attr('data-deal-id')) {
            arrDeal.push(curDeal.attr('data-deal-id'));
            arrPrice.push(curDeal.attr('data-deal-price'));
        }
    }

    addDealTag(cityid, arrDeal, arrPrice);
};

// 获取团购标签数据
var addDealTag = function(cityid, arrDeal, arrPrice) {
    var strPromoId = arrDeal.join(',');
    var strPromoPrice = arrPrice.join(',');

    if (canSend) {
        canSend = false;
        new Ajax({
            url: '/ajax/json/shopremote/search',
            method: 'post',
            data: {
                'do': 'gettppromo',
                'cityid': cityid,
                'dealgroupids': strPromoId,
                'dealgroupprices' : strPromoPrice
            }
        }).on('success', function(rsp) {
            if (rsp.code == 100) {
                var key;
                for (key in rsp.msg) {

                    if ($('a[data-deal-id="' + key + '"]').find('.tag').length == 0) {
                        $('a[data-deal-id="' + key + '"]').find('.tit').after('<span class="tag">' + rsp.msg[key] + '</span>');
                    }
                }
                canSend = true;
            }
        }).send();
    }
}

// 人均费用排序
var perSort = function() {
    var bar = $('.J_bar-range'),
        rangeMin = bar.find('.J_range-min'),
        rangeMax = bar.find('.J_range-max'),
        rangeBtn = bar.find('.J_range-btn'),
        rangeReset = bar.find('.J_range-reset'),
        rangeInput = bar.find('.num').find('input'),
        urlTpl = rangeBtn.attr('data-url');

    new InputFilter(rangeMin, "price-int");
    new InputFilter(rangeMax, "price-int");

    bar.on("click", function(e) {
        e.stopPropagation();
    });
    rangeBtn.on('click', function() {
        var min = rangeMin.val(),
            max = rangeMax.val(),
            url = '';

        location.href = urlTpl.replace(/\{(\d+)\}/g, function(all, key) {
            return [
                (min ? ("x" + min) : "") + (max ? ("y" + max) : "")
            ][key];
        });
    });

    rangeInput.on('keydown', function(e) {
        if (e.keyCode == 13) {
            var min = rangeMin.val(),
                max = rangeMax.val(),
                url = '';

            location.href = urlTpl.replace(/\{(\d+)\}/g, function(all, key) {
                return [
                    (min ? ("x" + min) : "") + (max ? ("y" + max) : "")
                ][key];
            });
        }
    });

    rangeReset.on("click", function() {
        rangeMin.val("");
        //$(".J_range-min").value="";
        rangeMax.val("");
    });
};

// 地图
var initMboxMap = function(self, config) {
    var mapObj = {
        map: null,
        container: null,
        gmap: null,
        center: null,
        parkData: null,
        markerList: [],
        zoom: 16
    };

    var poi = self.attr("data-poi"),
        address = self.attr("data-address"),
        shopName = self.attr("data-sname"),
        shopId = self.attr("data-shopid"),
        cityId = config.cityId;

    var clearMboxObj = function() {
        mapObj.map = null;
        mapObj.container = null;
        mapObj.markerList.length = 0;
    };

    var initMap = function(cont, callback, config) {
        new Map(cont, {
            pois: [{
                poi: poi
            }],
            css: {
                width: 740,
                height: 383
            },
            scaleLevel: mapObj.zoom,
            cityId: cityId
        }, function(map, container) {});
    };

    var
    /*routepattern = config.mapType == 1 ? "http://ditu.google.cn/maps?daddr=@{it.addr}&dirflg=r&saddr=@{it.city}" : "http://apis.map.qq.com/uri/v1/routeplan?type=bus&from=@{it.city}&to=@{it.addr}",
        routeaddr = tpl.render(routepattern, {
            addr: encodeURIComponent(address),
            city: encodeURIComponent(config.cityCnName + "市")
        }),*/
        cont = $(tpl.render(template.map, {
        address: address,
        shopname: shopName,
        url: '/shop/' + shopId
    }));

    new Mbox({
        winCls: "",
        contCls: "",
        closable: false,
        content: cont
    }).on("show", function() {
        initMap(cont.find(".J-map-cont"), function() {});
    }).on("close", clearMboxObj).open();
};

// 右侧榜单
var relatedList = function(config) {
    var sIDs = config.shopIDs.join(',');

    new Ajax({
        url: '/ajax/json/shopremote/search',
        method: 'post',
        data: {
            'do': 'getcorr',
            't': config.shopType,
            'cityId': config.cityID,
            's': sIDs,
            'limit': '3'
        }
    }).on('success', function(rsp) {
        if (rsp.code == 200) {
            if (rsp.msg.html !== '' && rsp.msg.count) {
                var $voteList = $('.J_votelist');
                $voteList.html(rsp.msg.html);
                // 灵犀打点 - 相关榜单
                // LXWrap($voteList, 'rank', true);
                LXWrap($voteList, LXBid.relativeViewBid, true, true);
            } else {
                $(".J_votelist").remove();
            }
        }
    }).send();
};

// 相关团购
var relatedTuan = function() {
    function fetchAndFill(url, el) {
        new JSONP({
            url: url
        }).on("success", function(rsp) {
            if (rsp.length && rsp[0]) {
                rsp = rsp[0];
            } else {
                $(".J_aside-tuan").remove();
                return false;
            }
            if (typeof rsp === "string") {
                rsp = [rsp];
            }
            var list = [];
            var rspResult = Array.prototype.join.call(rsp, "").replace(/<script[^>]*>(.+)<\/script>/g, function(a, b) {
                list.push(b);
                return ""
            });

            el.html(rspResult);

            //灵犀打点 - 团购推荐
            LXWrap(el, 'tuandeal', true);

            for (var i = 0; i <= list.length; i++) {
                new Function(list[i])();
                //list[i]();
            }
        }).send();
    }

    var el = $(".J_aside-tuan");
    if(el && el.length !== 0){
        var url = $(el).attr("data-url");
        fetchAndFill(url, el);
    }
};

// 中间附近
var initMboxNearby = function(self) {
    var shopName = self.attr('data-sname'),
        urlTpl = self.attr('data-url'),
        cont = $(tpl.render(template.nearby, {
            shopName: shopName
        }));
    new Mbox({
        //winCls: "",
        //contCls: "",
        css: {
            value: {
                width: '255px'
            }
        },
        closable: false,
        content: cont
    }).on("show", function() {
        $(".J_nearby-save").on("click", function() {
            var inputV = $(".J_nearby-input").val();
            if (inputV != '') {
                var url = urlTpl.replace("{keyword}", ('_' + inputV));
            } else {
                var url = urlTpl.replace("{keyword}", '');
            }
            Mbox.closeAll();
            location.href = url;
        });
        $(".J_nearby-del").on("click", function() {
            Mbox.closeAll();
        });

        $(".J_nearby-input").on("keydown", function(e) {
            if (e.keyCode == 13) {
                var inputV = $(".J_nearby-input").val();
                if (inputV != '') {
                    var url = urlTpl.replace("{keyword}", ('_' + inputV));
                } else {
                    var url = urlTpl.replace("{keyword}", '');
                }
                Mbox.closeAll();
                location.href = url;
            }
        })

    }).on("close", function() {
        //Mbox.closeAll();
    }).open();
};

// 返回顶部
var toTop = function() {
    $(window).on("scroll", function() {
        if ($(window).scrollTop() > 100) {
            $(".J_to-top").removeClass("Hide");
        } else {
            $(".J_to-top").addClass("Hide");
        }
    });
}

// 动态添加二维码
var QRCodeFixed = function() {
    var $qrcodeFixedDOM;
    if($('.qrcode-fixed').length <= 0) {
        $qrcodeFixedDOM = $(
            '<a class="qrcode-fixed Hide" href="http://www.dianping.com/events/m/index.htm" onclick="' + " document.hippo.ext({action:'click'}).mv('module','list_sidecode');"+ '">' +
                '<div class="qrcode-fixed-content">' +
                    '<span class="icon-right"></span>' +
                    '<span class="icon-dp"></span>' +
                    '<div class="qrcode-img"></div>' +
                '</div>' +
            '</a>'
        );
        $qrcodeFixedDOM.appendTo($(".section.Fix"));
    }

    $(window).on("scroll", function() {
        if ($(window).scrollTop() > 100) {
            $(".qrcode-fixed").removeClass("Hide");
        } else {
            $(".qrcode-fixed").addClass("Hide");
        }
    });
}

// 满意or不满意
var feedbackResult = function(config) {
    var btnG = $('.J_good'),
        btnB = $('.J_no'),
        sucTip = $('.J_sucTip'),
        sucTipF = $('.y-first'),
        sucTipS = $('.y-second'),
        flag = true,
        box = $('.J_evaluation'),
        userAdvice = $('.J_user-advice');
    var sucTipPop = function() {
        if (flag) {
            sucTipF.removeClass('Hide');
            flag = false;
        } else {
            sucTipS.removeClass('Hide');
        }
        window.setTimeout(function() {
            sucTip.addClass("Hide");
        }, 2000);
    };
    btnG.on('click', function() {
        new Ajax({
            url: '/search.v?do=afb',
            method: 'post',
            dataType: 'text', //若为json, 若返回值为空，neuron当失败处理，为了避免此，设置dataType: 'text'
            data: {
                cid: config.cityId,
                cho: 1
            }
        }).on('success', function() {
            sucTipPop();
        }).on('error', function () {
            sucTipPop();
        }).send();
    });

    btnB.on('click', function(e) {
        e.stopPropagation();
        flag = true;
        var userAdviceBottom = $(window).height() - (box.offset().top - $(window).scrollTop()) - box.height();
        if (userAdviceBottom < 250) {
            if (userAdvice.hasClass("down")) {
                userAdvice.removeClass("down");
            }
            userAdvice.addClass("up");
        } else {
            if (userAdvice.hasClass("up")) {
                userAdvice.removeClass("up");
            }
            userAdvice.addClass("down");
        }
        userAdvice.removeClass('Hide');
    });
    var btnClose = userAdvice.find('.close'),
        textArea = userAdvice.find('textarea'),
        btnBlock = userAdvice.find('.btn'),
        btnSubmit = btnBlock.find('.save'),
        btnCancel = btnBlock.find('.del');

    textArea.on({
        'focus': function() {
            if (textArea.val() === '请输入...') {
                textArea.css('color', '#333').val('');
            } else {
                textArea.css('color', '#333');
            }
        },
        'blur': function() {
            if (textArea.val() === '') {
                textArea.css('color', '#999').val('请输入...');
            }
        }
    });
    $('body').on('click', function() { //点击隐藏userAdvice
        userAdvice.addClass("Hide");
    });
    userAdvice.on('click', function(e) { //去除userAdvice点击隐藏userAdvice
        e.stopPropagation();
    });
    btnClose.on('click', function(e) {
        e.stopPropagation();
        userAdvice.addClass("Hide");
    });
    btnCancel.on('click', function(e) {
        e.stopPropagation();
        userAdvice.addClass("Hide");
    });
    btnSubmit.on('click', function(e) {
        e.stopPropagation();
        userAdvice.addClass("Hide"); //这里有动画
        new Ajax({
            url: '/search.v?do=afb',
            method: 'post',
            dataType: 'text',
            data: {
                cid: config.cityId,
                cho: 2,
                adv: textArea.val()
            }
        }).on('success', function(rsp) {
            sucTipPop();
        }).on('error', function() {
            userAdvice.addClass("Hide");
            sucTipPop();
        }).send();
    });
};

// seo 页尾相关榜单
var expandSEOMylist = function() {
    var seoMylistExpandButton = $("#seo-mylist-expand");
    var seoMylists = $("div.seolist li");
    var show = false;

    function mylistShow(show) {
        if (show) {
            seoMylists.removeClass("Hide");
            seoMylistExpandButton.find("i").attr("class", "packup-seo");
            LXWrap($('.seolist ul'), LXBid.relativeViewBid,true, true)
        } else {
            seoMylists.addClass("Hide");
            seoMylistExpandButton.find("i").attr("class", "packdown-seo");
        }
    }

    seoMylistExpandButton.on("click", function() {
        show = !show;
        mylistShow(show);
    });
    mylistShow(false);
}

// 必胜客关键词打点
var initKeywordTrack = function() {
    var list = $(".J_shop-list .shopname"),
        trackList = list.map(function(index, item) {
            var self = $(item);
            if (self.attr('title').indexOf('必胜客') > -1) {
                return self;
            }
        });

    if (trackList.length == 0) {
        return;
    }

    require.async('./js/track/track', function(doTrack) {
        trackList.each(function(index, item) {

            var self = $(item),
                con = self.parents('li'),
                shopId = self.attr('href').substring(6);

            //对dd内所有a标签进行打点
            con.on('click', 'a', function() {
                doTrack(shopId);
            });
        })
    });
};


var addAsideQrcode = function() {
    $('.J_aside-qrcode').html(
        '<a href="http://www.dianping.com/events/m/index.htm">' +
            '<div class="qrcode-aside-left">' +
                '<p>' +
                    '<span class="tag">券</span>' +
                    '<span>专享优惠</span>' +
                '</p>' +
                '<p>' +
                    '<span class="tag discount">惠</span>' +
                    '<span>手机特价</span>' +
                '</p>' +
            '</div>' +
            '<div class="qrcode-aside-right"></div>'+
        '</a>'
    );

    //灵犀打点
    //LXWrap($('.J_aside-qrcode'), 'appguide', true);
};

var initLX = function(){
    //面包屑
    // LXWrap($('.J_bread'),'breadcrumb')
    //频道
    // LXWrap($('.J_filter_channel'),'fltratre_channel');
    //分类
    // LXWrap($('.J_filter_category'),'fltratre_cat');
    // //地点
    // LXWrap($('.J_filter_region'), 'fltratre_loc');
    // //推荐
    // LXWrap($('.J_filter_recomm'), 'fltratre_rec');

    // //二次过滤
    // LXWrap($('.J_filter_box'), 'fltratre_again');

    //商户ICON打点
    // LXWrap($('.J_promo_icon'), 'shopdiscount');

    //右侧底部广告
    // LXWrap($('.J_aside_right_ad'), 'ad')

    //搜索底部添加商户    
    //LXWrap($('.sear-result'), 'adpoi')

    $('.J_aside-qrcode').on('click', function() {
        hippo.push(["mv", {
            module: "list_sidecode",
            action:"click"
        }]);
    });
    // 面包屑
    LXWrap($('.bread a'), LXBid.breadClickBid, true, false)
    // 添加商户 点击
    LXWrap($('.sear-result #popMbox'), LXBid.addShopClickBid, true, false)
    // 满意按钮点击
    LXWrap($('.J_evaluation .y'), LXBid.agreementClickBid, true, false)
    // 不满按钮点击 
    LXWrap($('.J_evaluation .y'), LXBid.disagreementClickBid, true, false)
    // poi商户点击 分开写
    LXWrap($('#shop-all-list a'), LXBid.poiClickBid, true, false)
    //poi商户曝光
    LXWrap($('#shop-all-list ul li .pic a'), LXBid.poiViewBid, true, true)
    // 页数点击
    LXWrap($('.page a'), LXBid.pageClickBid, true, false)
    // 页数曝光
    LXWrap($('.page'), LXBid.pageViewBid, true, true)
    // 筛选 点击
    LXWrap($('.filt-classify a'), LXBid.filtrateClickBid, true, false)
    // 地图icon 点击
    LXWrap($('.shop-wrap .map'), LXBid.mapClickBid, true, false)
    // 相关榜单 点击
    LXWrap($('.J_votelist a'), LXBid.relativeClickBid, true, false);
    // 社区论坛活动_view
    LXWrap($('.aside-box:last-child a'), LXBid.pageViewBid, true, true)
    // 社区论坛活动_click
    LXWrap($('.aside-box:last-child a'), LXBid.relativeClickBid, true, false);
    // 人均排序-click_click
    LXWrap($('.per-capita a'), LXBid.averageClickBid, true, false);
    // 其他排序_click 
    LXWrap($('.slt-list:first-child a'), LXBid.otherSortClickBid, true, false);
    // 页尾相关榜单 点击
    LXWrap($('#seo-mylist-expand'), LXBid.relativeClickBid, true, false);
    // 简单排序click
    LXWrap($('.filt-service ul li:nth-child(-n+4) a'), LXBid.easySortClickBid, true, false);
    // 列表筛选_click
    LXWrap($('.filt-classify a'), LXBid.filtrateClickBid, true, false);
    // 不满按钮展开_click
    LXWrap($('.J_user-advice .close'), LXBid.fullDisagreeClickBid, true, false);
    LXWrap($('.J_user-advice .btn a'), LXBid.fullDisagreeClickBid, true, false);
    LXWrap($('.J_user-advice textarea'), LXBid.fullDisagreeClickBid, true, false);
    // 页尾导航_view
    LXWrap($('.foot-links'), LXBid.pageFootingViewBid, true, true);
    // 页尾导航_click
    LXWrap($('.moreover'), LXBid.pageFootingViewBid, true, false);
    // 广告 view
    if ($('.J_mkt-group-2').length > 0) {
        LXWrap($('.J_mkt-group-2'), LXBid.adViewBid, true, true);
    }
    // 广告 click
    LXWrap($('.J_mkt-group-2'), LXBid.adClickBid, true, false);
    // 你可能会喜欢 view
    if ($('.J_midas-3').length > 0) {
        LXWrap($('.J_midas-3'), LXBid.maybeLikeViewBid, true, true);
    }
    // 你可能会喜欢 click
    LXWrap($('.J_midas-3'), LXBid.maybeLikeClickBid, true, false);
    
    // 分类 click
    let cat_id = 10
    if(!$('.J_filter_category').children('a').hasClass('cur')){
            cat_id = 102
    }
    LXWrap($('.J_filter_category a'), LXBid.categroyClickBid, true, false, false, cat_id);
    
    // 地点 click
    let locat_id = 10
    if(!$('.J_filter_region').children('a').hasClass('cur')){
            cat_id = 102
    }
    LXWrap($('.J_filter_region a'), LXBid.locationClickBid, true, false, false, locat_id);

    // 推荐 view
    LXWrap($('.J_filter_recomm .nc-contain'), LXBid.recommendViewBid, true, true);
    // 推荐 click
    let recom_id = 10
    if(!$('.J_filter_recomm').children('a').hasClass('cur')){
            cat_id = 102
    }
    LXWrap($('.J_filter_recomm a'), LXBid.recommendClickBid, true, false, false, recom_id);
};


exports.init = function(config) {
    var hashs = sltSpotNav = document.location.hash,
        hasHash = hashs.match(/nav-tab\|\d\|\d/) || null,
        initNavId = 0;
    //搜索“河豚”关键词，在右侧出现河豚食用指南
    $(".hetunImg").on("click", function() {
        var header = window.location.protocol;
        window.location.href = header + "//s.dianping.com/topic/17096367";
        hippo.push(["mv", {
            module: "grgongshi",
            action:"click"
        }]);
    })

    addAsideQrcode();   // 添加侧边二维码

    var Nav = $(".navigation");

    if(Nav.length == 0){
        relatedList(config); // 右侧榜单
        expandSEOMylist(); // seo
        relatedTuan(); // 相关团购
        feedbackResult(config); // 满意or不满意(有意见你就提吖么么哒~)
        return ;
    }

    if (getCookie('showNav') != null) {
        initNavId = getCookie('showNav').substr(getCookie('showNav').length - 1, 1);
    } else if (hasHash) {
        initNavId = hashs.substr(hashs.length - 1, 1);
    }

    getCurDom(initNavId); // 页面初始navTabs
    switchNavTabs(hashs); // nav_tabs切换
    navPackDown(); // nav展开&收起
    navPackUp();
    filterHover(); // 排序hover
    shoplistHover(); // shoplist hover 显示写点评、收藏...
    getFirDeal(config.cityId); // 团购优惠标签
    dealPackDown(config.cityId); // 团购列表扩展&收起
    dealPackUp(config.cityId);
    setHeadFix(); // 头部搜索悬浮
    setScrollTop(); // 跳转新页面 设置滚屏高度
    perSort(); // 人均费用排序
    QRCodeFixed();//在to-top上面动态添加二维码浮框
    toTop(); // 返回顶部
    relatedTuan(); // 相关团购
    feedbackResult(config); // 满意or不满意(有意见你就提吖么么哒~)

    // 点击弹出Mbox
    $(".J_o-map").on("click", function() {
        var self = $(this);
        initMboxMap(self, config);
    });

    $(".J_o-nearby").on("click", function() {
        var self = $(this);
        initMboxNearby(self);
    });

    lazyLoad($(document.body)); // 懒加载

    // 收藏
    favorite($(".J_o-favor"), {
        shopId: config.shopId,
        shopName: config.shopName
    });

    relatedList(config); // 右侧榜单

     //底部内链		
	 var links_config ={
        rowHeight:'25px',
        SHOW_NUM: 5,
        SHOW_TEXT:'更多',
        ROLL_TEXT:'收起'
    };
    bottomLinks(links_config);

    expandSEOMylist(); // seo

    initKeywordTrack(); // 必胜客关键词打点

    initLX(); //其他FTL输出灵犀打点

    // dspAd.init(config);

}

}, {
    entries:entries,
    main:true,
    map:mix({"./js/inputfilter":_15,"./js/lazyload":_16,"./js/favorite":_17,"./js/bottom_links":_18,"./js/lx":_19,"./js/lx-bid":_20,"./js/tpl/map":_4,"./js/tpl/nearby":_5},globalMap)
});

define(_15, [_8,_21], function(require, exports, module, __filename, __dirname) {
var $ = require("jquery");
var Class = require("class");

var PRESETS = {
    "price":/^([0-9]+\.?[0-9]{0,2}|)$/,
    "price-int":/^([1-9][0-9]*|)$/
};

var InputFilter = Class({
    Implements: "events",
    initialize: function (input, regexp, options) {
        var self = this;
        input = $(input);
        if (!input.length || !regexp) return;
        if(typeof(regexp) == 'string'){
            if(!PRESETS[regexp]){
                throw "invalid preset "+regexp
            }else{
                self.regexp = PRESETS[regexp];
            }
        }else{
            self.regexp = regexp;   
        }

        self.options = $.extend({strict:true},options);

        self.input = input;
        self.value = "";
        self.checkedonce = false;

        function before_first_check(){
            self.checkedonce = true;
            self.value = input.val();
            input.off("keydown",before_first_check);
        }
        input.on("keydown",before_first_check);
        input.on("paste",function(){
            self.check();
        });
        input.on("keyup",function(){
            self.check();
        });
    },

    check: function (e) {
        var self = this;
        setTimeout(function(){
            self.ctrl_released = false;
            
            var val = self.input.val(),
                passed = self.options.filter ? (!self.regexp.test(val)) : self.regexp.test(val);

            if (passed) {
                self.value = val;
            } else {
                if(self.options.strict){
                    if(self.options.filter){
                        self.input.val(val.replace(self.regexp,""));
                    }else{
                        self.input.val(self.value);
                    }
                }
            }

            self.emit("checked", {passed: passed, val: val});
        },0);
    }
});

module.exports = InputFilter;
}, {
    entries:entries,
    map:globalMap
});

define(_16, [_8], function(require, exports, module, __filename, __dirname) {
'use strict';

var $ = require("jquery");

module.exports = function(container){
	container.find("img").each(function(index, img){
		img = $(img);
		var src = img.attr("data-src");
		if(src){
			img.attr("src", src);
		}
	});
};
}, {
    entries:entries,
    map:globalMap
});

define(_17, [_8,_9,_22,_13,_1,_2], function(require, exports, module, __filename, __dirname) {
'use strict';

var $ = require("jquery");
var JSONP = require("request").JSONP;
var authbox = require("main-authbox");
var tpl = require("tpl");
var template = {
	add: require("./tpl/favorite-add"),
	"delete": require("./tpl/favorite-delete"),
	tags: '<?js it.forEach(function(item){ ?><a>@{item}</a><?js }); ?>'
};

// 设置收藏按钮状态
function setStatus(isFavorite){
	if(isFavorite){
		//trigger.html("已收藏");
        trigger.removeClass("favorite").addClass("favorited");
	}else{
		//trigger.html("收藏");
        trigger.removeClass("favorited").addClass("favorite");
	}
}

// 操作状态提示
function actionStatus(type, message, autoClose){
	showPanel('<div class="favorite-message">' + message + '</div>', autoClose ? 1000 : -1);
}

// 检查标签是否符合规范
function checkTag(value, errorTip){
	value = value.trim();
	var tags;

	if(value){
    	tags = value.trim().split(" ");

	    if (tags.length > 5) {
	        errorTip.removeClass("Hide").html("标签不能多于5个");
	        return false;
	    } else if (tags.some(function (item) { return item.length > 10; })) {
	        errorTip.removeClass("Hide").html("标签字数需少于10");
	        return false;
	    }
	}else{
        errorTip.removeClass("Hide").html("请至少添加一个标签哦");
        return false;
	}

	errorTip.addClass("Hide");

    return true;
}

// 在收藏按钮下面展示一个框
var currentNode,
	closeHandler;

function showPanel(html, wait){
	if(currentNode){
		currentNode.close();
		currentNode = null;
	}
	if(closeHandler){
		clearTimeout(closeHandler);
		closeHandler = null;
	}

	if(!html){
		return {};
	}

	var node = $(html);
    node.appendTo(document.body);
    node.css({
    	left: triggerPos.left + triggerSize.width / 2 - node.outerWidth() / 2,
    	top: triggerPos.top + triggerSize.height + 5
    });

    if(wait !== -1){
    	closeHandler = setTimeout(function(){
    		currentNode.close();
    		closeHandler = null;
    	}, wait || 2000);
    }

    currentNode = {
    	node: node,
    	_onclose: [],
    	close: function(){
    		this.node.remove();
    		currentNode = null;
    		this._onclose.forEach(function(fn){
    			fn();
    		});
    	},
    	onClose: function(callback){
    		this._onclose.push(callback);
    	}
    };

    return currentNode;
}

// 选择标签
function selectTags(data, title){
	var panel = showPanel(tpl.render(template.add, {
	    	title: title
	    }), -1),
	    node = panel.node;

	var noClose = false;
    function close(){
    	if(noClose){
    		noClose = false;
    	}else{
	    	panel.close();
	    }
    }
    // 关闭
    node.on("click", function(){
    	noClose = true;
    });
    node.find(".J-close").on("click", close);
    $(document).on("click", close);
    panel.onClose(function(){
    	$(document).off("click", close);
    });

    // 保存标签
    node.find(".J-save").on('click',function(){
        var value = input.val();
        if (checkTag(value, node.find(".J-error"))){
            favorite('update', value);
        }
    });

    // 删除收藏
    node.find(".J-delete").on('click',function(){
        favorite("delete", "", function(){
        	var node = showPanel(tpl.render(template["delete"], {
        		shopName: shopName
        	})).node;
        	// 撤销删除
        	node.find(".J-revoke").on("click", function(){
        		favorite("add");
        	});
        });
    });


    var input = node.find(".J-input"),
    	myTags = node.find(".J-my-tags"),
    	shopTags = node.find(".J-shop-tags");

    input.val(data.selectedTags);
    myTags.html(tpl.render(template.tags, data.myTags || []));
    shopTags.html(tpl.render(template.tags, data.shopTags || []));

    // 渲染tag状态
    function renderTagStatus(container, tags){
    	tags = tags ? tags.split(" ") : [];

    	container.find("a").each(function(index, item){
    		item = $(item);

    		if(tags.indexOf(item.text()) === -1){
    			item.removeClass("selected");
    		}else{
    			item.addClass("selected");
    		}
    	});
    }

    renderTagStatus(myTags, input.val());
    renderTagStatus(shopTags, input.val());

    var selectTagHandler = function(){
    	var target = $(this),
    		currentTag = target.text(),
    		selectedTags = input.val();

    	selectedTags = selectedTags ? selectedTags.split(" ") : [];

    	var tags = [];

    	selectedTags.forEach(function(item){
    		if(item !== currentTag){
    			tags.push(item);
    		}
    	});

    	if(!target.hasClass("selected")){
    		tags.push(currentTag);
    	}

    	input.val(tags.join(" "));
    	renderTagStatus(myTags, input.val());
    	renderTagStatus(shopTags, input.val());
    };

    myTags.on("click", "a", selectTagHandler);
    shopTags.on("click", "a", selectTagHandler);
}

// 收藏操作
// action: [add | update | delete] 操作类型
// tags: 添加的标签
function favorite(action, tags, callback){
	actionStatus("success", '正在收藏，请稍候......');

    var timeout = setTimeout(function(){
        actionStatus('error', '发生未知错误，请稍候再试！', true);
    }, 3000);

    new JSONP({
        url: "/member/jsonp/" + action + "Favor",
        data: {
        	"referId": shopId,
        	"favorType": 1,
        	"favorTags": tags ? encodeURIComponent(tags.trim().split(" ").join("|")) : ""
        }
    }).on('success', function (data) {
        if(data.length && data[0]){
            data = data[0];
        }

        clearTimeout(timeout);

    	if(data){
	        switch(action){
	        	case "add":
	        		if(data.code == 200 || data.code == 300){
	        			actionStatus("success", "收藏成功", true);
	        			setStatus(true);
	        			callback && callback();
	        			return;
	        		}
	        		break;
	        	case "update":
	        		if(data.code == 200){
	        			actionStatus("success", "收藏成功", true);
	        			return;
	        		}
	        		break;
	        	case "delete":
	        		if(data.code == 200){
                        setStatus(false);
	        			callback && callback();
	        			return;
	        		}
	        		break;
	        }
		}

        actionStatus('error', "发生未知错误，请稍候再试！", true);
    }).on('error', function () {
        actionStatus('error', '发生未知错误，请稍候再试！', true);
        clearTimeout(timeout);
    }).send();
}

// 加载标签
function loadFavorTag(){
	actionStatus("success", '正在处理，请稍候....');

    var timeout = setTimeout(function(){
        actionStatus('error', '发生未知错误，请稍候再试！', true);
    }, 3000);

    new JSONP({
        url: "/member/jsonp/loadFavorTag",
        data: {
            "referId": shopId,
            "favorType": 1
        }
    }).on('success', function (data) {
        actionStatus();

        if(data.length && data[0]){
            data = data[0];
        }
        clearTimeout(timeout);
        
        if (data && data.code == 200) {
        	data = data.msg;
            if (data.favored){
                selectTags({
                	selectedTags: data.hasSelectedTags,
                	myTags: data.personTagNameList,
                	shopTags: data.shopTagNameList
                }, '你已收藏过了');
                setStatus(true);
            } else {
                favorite("add", "", function(){
                	selectTags({
	                	selectedTags: data.hasSelectedTags,
	                	myTags: data.personTagNameList,
	                	shopTags: data.shopTagNameList
	                }, '收藏成功');
                });
            }
        } else if (data.code == 100) {
            authbox('收藏商户', function(){
            	loadFavorTag();
            },"",true);
        } else {
            actionStatus('error', '发生未知错误，请稍候再试！', true);
        }
    }).on('error', function () {
        actionStatus('error', '发生未知错误，请稍候再试！', true);
        clearTimeout(timeout);
    }).send();
}

var trigger,
    triggerPos,
    triggerSize,
	shopId,
	shopName;

module.exports = function(_trigger){
	_trigger.on("click", function(){
        trigger = $(this);
        triggerPos = trigger.offset();
        triggerSize = {
            width: trigger.outerWidth(),
            height: trigger.outerHeight()
        };
        shopId = trigger.attr("data-fav-referid");
        shopName = trigger.attr("data-name");
		authbox.checkLogin(function(isLogin){
			if(isLogin){
				loadFavorTag();
			}else{
				authbox("添加收藏", function(){
					loadFavorTag();
				});
			}
		});
	});
};
}, {
    entries:entries,
    map:mix({"./tpl/favorite-add":_1,"./tpl/favorite-delete":_2},globalMap)
});

define(_18, [_8], function(require, exports, module, __filename, __dirname) {
'use strict';

var $ = require('jquery');

/**
 * bottomLinks，底部内链js
 * @param {Object} config - 配置项.
 */
var bottomLinks = function (config) {
    var countryIndex = 0,
        cityIndex = 0,
        countryState = [],
        cityState = [];

    //获取Dom节点
    var $countryChars = $('.J-country-char li'),
        $cityChars = $('.J-city-char li'),
        $countryContent = $('.J-country-content'),
        $cityContent = $('.J-city-content'),
        $moreover = $('.foot-links').find('.J-moreover'),//底部链接所有的更多
        $countryLinks = $('.J-country-link'),
        $cityLinks = $('.J-city-link'),
        $moreoverCountry = $countryLinks.find('.moreover'),
        $moreoverCity = $cityLinks.find('.moreover'),
        $cityFood = $('.J-city-food ul'),//城市推荐菜
        $moreoverCF = $('.J-city-food .moreover'),
        $cityALlFood = $('.J-city-allfood ul'),//城市美食
        $moreoverCAF = $('.J-city-allfood .moreover'),
        $cityOther = $('.J-city-Other ul'),//生活导航
        $moreoverCO = $('.J-city-Other .moreover'),
        $cityHot = $('.J-city-hot ul'),//热门城市
        $moreoverCH = $('.J-city-hot .moreover'),
        $cityCountry = $('.J-city-country ul'),//全国推荐
        $moreoverCC = $('.J-city-country .moreover'),
        $citySame = $('.J-city-same ul'),//同城推荐
        $moreoverCS = $('.J-city-same .moreover');

    var init = function (config) {

        //初始化状态
        initialState(config);

        //全国频字母切换
        $countryChars.on('mouseenter', function () {
            countryIndex = $(this).index();
            $(this).addClass('active').siblings().removeClass('active');
            $countryContent.eq(countryIndex).show().siblings().hide();
            moreShowOrHidden($($countryContent.get(countryIndex)), $moreoverCountry, config);
            changeText($moreoverCountry,  countryState[countryIndex].clickCount);
        });

        // 城市频道字母切换
        $cityChars.on('mouseenter', function () {
            cityIndex = $(this).index();
            $(this).addClass('active').siblings().removeClass('active');
            $cityContent.eq(cityIndex).show().siblings().hide();
            moreShowOrHidden($($cityContent.get(cityIndex)), $moreoverCity, config);
            changeText($moreoverCity,  cityState[cityIndex].clickCount);
        });

        // 显示更多
        $moreover.on('click', function (e) {
            var targetNode = $(e.target),
                targetPNode = $(e.target).parent(),
                contentNode = targetPNode.find('.char-content');
            if (targetPNode.attr('class').indexOf('J-country-link')> -1) {//大全
                moreShowCallBack(countryState, countryIndex, contentNode, targetNode, config);
            }
            if (targetPNode.attr('class').indexOf('J-city-link')> -1) {//排行榜
                moreShowCallBack(cityState, cityIndex, contentNode, targetNode, config);
            }
            if (targetPNode.attr('class').indexOf('J-city-food')> -1) {//城市推荐菜 
                showOrHide($cityFood,$moreoverCF,config);
            }
            if (targetPNode.attr('class').indexOf('J-city-allfood')> -1) {//城市美食
                showOrHide($cityALlFood,$moreoverCAF,config);
            }
            if (targetPNode.attr('class').indexOf('J-city-other')> -1) {//城市生活导航
                showOrHide($cityOther,$moreoverCO,config);
            }
            if (targetPNode.attr('class').indexOf('J-city-hot')> -1) {//热门城市
                showOrHide($cityHot,$moreoverCH,config);
            }
            if (targetPNode.attr('class').indexOf('J-city-country')> -1) {
                showOrHide($cityCountry,$moreoverCC,config);
            }
            if (targetPNode.attr('class').indexOf('J-city-same')> -1) {
                showOrHide($citySame,$moreoverCS,config);
            }
        });
    }

    // 初始状态
    var initialState = function (config) {
        $countryChars.eq(0).addClass('active');
        $cityChars.eq(0).addClass('active');
        $countryContent.eq(0).show().siblings().hide();
        $cityContent.eq(0).show().siblings().hide();
        countryState = initCount(countryState, $countryChars.length);
        cityState = initCount(cityState, $cityChars.length);
        moreShowOrHidden($countryContent.first(),$moreoverCountry, config);
        moreShowOrHidden($cityContent.first(), $moreoverCity, config);
        moreShowOrHidden($cityFood, $moreoverCF, config);
        moreShowOrHidden($cityALlFood, $moreoverCAF, config);
        moreShowOrHidden($cityOther, $moreoverCO, config);
        moreShowOrHidden($cityHot, $moreoverCH, config);
        moreShowOrHidden($cityCountry,$moreoverCC,config);
        moreShowOrHidden($citySame,$moreoverCS,config);
    }

    //控制 更多文字的 显示
    var  moreShowOrHidden = function ($node,$showNode,config) {
        if($showNode.length>0){
            if($node.children().length > config.SHOW_NUM){
                $showNode.css({"visibility":"visible"});
            } else {
                $showNode.css({"visibility":"hidden"});
            }
        }
    }


    // 控制展开，收起
    var charContentCallback = function (extend, $contentNode, targetNode, config) {
        if(extend){ // 展开后
            targetNode.text(config.ROLL_TEXT);
            $contentNode.css({"height":"auto"});
        }else{  // 收起后
            targetNode.text(config.SHOW_TEXT);
            $contentNode.css({"height":config.rowHeight});
        }
    }
    
    function showOrHide ($contentNode, targetNode, config){
        if(targetNode.text() === config.SHOW_TEXT){ // 展开后
            targetNode.text(config.ROLL_TEXT);
            $contentNode.css({"height":"auto"});
        }else{  // 收起后
            targetNode.text(config.SHOW_TEXT);
            $contentNode.css({"height":config.rowHeight});
        }
    }

    var moreShowCallBack = function(state, index, contentNode, targetNode, config){
        state[index].extend = !state[index].extend;
        state[index].clickCount ++;
        charContentCallback(state[index].extend, contentNode.eq(index), targetNode, config);
    }

    var initCount = function(arr,len){
        for (var i = 0; i < len; i ++){
            arr[i] = {};
            arr[i].clickCount = 0;
            arr[i].extend = false;
        }

        return arr;
    }

    var changeText= function(node, num){
        if(num%2 === 0){
            node.text(config.SHOW_TEXT);
        }else{
            node.text(config.ROLL_TEXT);
        }
    }

    return init(config);
}

module.exports = bottomLinks;

}, {
    entries:entries,
    map:globalMap
});

define(_19, [_8], function(require, exports, module, __filename, __dirname) {
/**
 * 灵犀打点封装
 * @param {*} $node 传入的节点
 * @param {*} valBid bid
 * @param {*} otherData 是否有额外的信息
 * @param {*} sendView 是否是发送曝光点
 * @param {*} nodeType 传入的节点是否是a标签，不是也可以发送点击点
 * @param {*} isFbLink 传入的节点是否需要自定义跳转事件
 * @param {*} catid 是否有catid
 */
const $ = require('jquery')
const lxWrap = ($node, valBid, otherData = false, sendView, nodeType = true, isFbLink, catid = '') => {
    if (!window.LXAnalytics) return
    // 上报基本信息
    let valLab = {
        custom: {}
    }
    try {
        let valLabFlag = {
            click_title: 'clickTitle',
            click_name: 'clickName',
            poi_id: 'shopid',
        }
        if ($node && $node.length !== 0) {
            valLab.custom.city_id = window._DP_HeaderData.cityId ? window._DP_HeaderData.cityId : 1
            valLab.custom.user_id = window._DP_HeaderData.userId ? window._DP_HeaderData.userId : null
            valLab.custom.category = window._DP_HeaderData.shopTypeChName ? window._DP_HeaderData.shopTypeChName : null
            valLab.custom.searchType = window._DP_HeaderData.searchType ? window._DP_HeaderData.searchType : null 
            if (!sendView) {
                // 点击打点
                if ($node.prop('tagName').toLowerCase() === 'a' || !nodeType) {
                    // 遍历
                    $node.on('click', function(e) {
                        // 获取打点数据custom数据
                        if (otherData) {
                            for (let key in valLabFlag) {
                                if (valLabFlag.hasOwnProperty(key)) {
                                    let data = $(this).data(valLabFlag[key])
                                    if (data) {
                                        valLab.custom[key] = data
                                    }
                                }
                            }
                        }
                        if (!catid) {
                            valLab.cat_id = catid
                        }
                        window.LXAnalytics('moduleClick', valBid, valLab)
                        // 如果需要单独跳转，则延迟300ms后跳转
                        if (isFbLink) {
                            e.preventDefault()
                            let href = $(this).attr('href')
                            setTimeout(() => {
                                location.href = href
                            }, 300)
                        }
                    })
                }
            } else {
                // 曝光打点 
                $node.each(function() {
                    if (otherData) {
                        for (let key in valLabFlag) {
                            if (valLabFlag.hasOwnProperty(key)) {
                                let data = $(this).data(valLabFlag[key])
                                if (data) {
                                    valLab.custom[key] = data
                                }
                            }
                        }
                    }
                    window.LXAnalytics('moduleView', valBid, valLab)
                })
            }
        }
    } catch (e) {
        console.log('lingxi Dot Error: ' + e)
    }
}

module.exports = lxWrap

}, {
    entries:entries,
    map:globalMap
});

define(_20, [], function(require, exports, module, __filename, __dirname) {
const lxBid = {
    addShopClickBid:'b_dvk2q6d5',// 添加商户_click ok
    agreementClickBid:'b_516e036b', // 满意按钮_click ok
    disagreementClickBid:'b_ogv14yp0',// 不满按钮_click ok
    poiClickBid:'b_9t3mxx5g',// POI商户_click ok
    poiViewBid:'b_9sb3ekwu',//POI商户_view ok
    pageClickBid:'b_j4e29wwo',// 页数_click ok
    pageViewBid:'b_s02rvt4g',// 页数_view ok
    otherSortClickBid:'b_8apau49q',// 其他排序_click ok
    averageClickBid:'b_4cnhfaih',// 人均排序-click_click ok
    recommendClickBid:'b_b8ksh2a6',// 推荐-click_click
    recommendViewBid:'b_jnt7yt2p',// 推荐_view
    categroyClickBid:'b_218v0mh0',// 分类-click_click
    locationClickBid:'b_th2howdh',// 地点_click
    pageFootingViewBid:'b_vf8q5hgl',// 页尾导航_view ok
    pageFootingClickBid:'b_wp6080ra',// 页尾导航_click ok
    filtrateClickBid:'b_f9d51yeb',// 列表筛选_click ok
    relativeViewBid:'b_nebadiuj',// 页尾相关榜单_view ok
    relativeClickBid:'b_ebt6fhv0',// 页尾相关榜单_click ok
    fullDisagreeClickBid:'b_7qcasb0m',// 不满按钮展开_click ok
    easySortClickBid:'b_bg4nvwc5',// 简单排序_click ok
    adViewBid:'b_vn8pna37',// 广告图片_view ok
    adClickBid:'b_rinxp2kl',// 广告图片_click ok
    maybeLikeViewBid:'b_lk2ppdyt',// 你可能会喜欢_view ok
    maybeLikeClickBid:'b_jfrht4s2',// 你可能会喜欢_click ok
    relativeViewBid:'b_fzueaons',// 相关榜单_view ok
    relativeClickBid:'b_vx4r7h37',// 相关榜单_click ok
    communityViewBid:'b_ylw1u6j0',// 社区论坛活动_view ok
    communityClickBid:'b_8nhguej5',// 社区论坛活动_click ok
    mapClickBid:'b_mttgul44',// 地图icon_click ok
    breadClickBid:'b_fhywff77' // 面包屑点击
}
module.exports = lxBid
}, {
    entries:entries,
    map:globalMap
});

define(_4, [], function(require, exports, module, __filename, __dirname) {
module.exports = '<div class="full-map">	<a class="close"></a>	<p class="shopname"><a href="@{it.url}">@{it.shopname}</a></p> <p class="info">		<span class="title">地址：</span>		<span>@{it.address}</span></p>	<div class="J-map-cont"></div> </div>'
}, {
    entries:entries,
    map:globalMap
});

define(_5, [], function(require, exports, module, __filename, __dirname) {
module.exports ='<div class="nearby-box msg-box">'
	+'<div class="hd">搜索附近</div>'
	+'<i class="close"></i>'
	+'<div class="con">'
		+'<p>在 <span>@{it.shopName}</span> 附近找</p>'
		+'<input type="text" value="" class="J_nearby-input">'
		+'<p class="tips">全部频道： 商户名、地址等..</p>'
		+'<div class="btn">'
			+'<a href="javascript:void(0);" class="del J_nearby-del">取消</a>'
			+'<a href="javascript:void(0);" class="save J_nearby-save">提交</a>'
		+'</div>'
	+'</div>'
+'</div>'
}, {
    entries:entries,
    map:globalMap
});

define(_1, [], function(require, exports, module, __filename, __dirname) {
module.exports = '<div class="favorite-add">	<h3 class="main-title">@{it.title}</h3>	<a class="close J-close"></a>	<h4 class="title">添加标签<small>(最多5个，空格分隔)：</small></h4>	<input class="input J-input" type="text" placeholder="请输入..." />	<p class="tags J-my-tags clearfix"></p>	<h4 class="title">常用：</h4>	<p class="tags J-shop-tags clearfix"></p>	<p class="action">		<a class="btn btn-gray J-delete">删除收藏</a>		<a class="btn J-save">保存标签</a>	</p>	<p class="error J-error Hide"></p></div>'
}, {
    entries:entries,
    map:globalMap
});

define(_2, [], function(require, exports, module, __filename, __dirname) {
module.exports = '<div class="favorite-delete">	删除成功	<a class="J-revoke">撤销删除</a></div>'
}, {
    entries:entries,
    map:globalMap
});
})();