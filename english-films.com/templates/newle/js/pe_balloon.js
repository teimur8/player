window.pe_user = {id: 0, _id: 0};
window.partner_id = 3021449;
window.PE_HOST = "https://puzzle-english.com";
window.PE_STATIC_HOME = "https://static.puzzle-english.com";
window.our_helper = true;
window.balloon_video = false;
window.balloon_phrases = false;
window.balloon_form_words = false;
typeof window.word_videos === "undefined" ? window.word_videos = {} : window.word_videos;
var audio = {
    types: ["mp3"], mode: null, ready: false, obj: window.Audio && new Audio, init: function () {
        if (this.inited)return;
        this.inited = true;
        if (this.supports_html5()) {
            this.mode = "html5";
            this.type = this.getType();
            this.setupHtml5API();
            this.ready = true
        } else if (this.supports_flash()) {
            this.mode = "flash";
            this.type = "mp3";
            this.buildFlashFallback();
            this.setupFlashAPI()
        }
    }, setupHtml5API: function () {
        this.play = function () {
            audio.obj.play()
        };
        this.pause = function () {
            audio.obj.pause()
        };
        this.stop = function () {
            if (audio.obj.readyState > 1) {
                audio.obj.pause();
                audio.obj.currentTime = 0
            }
        };
        this.paused = function () {
            return audio.obj.paused
        };
        this.ended = function () {
            return audio.obj.ended
        };
        this.src = function (src) {
            if (src && src != audio.obj.currentSrc) audio.obj.src = src; else return audio.obj.currentSrc
        };
        this.volume = function (value) {
            if (value) audio.obj.volume = value; else return audio.obj.volume
        };
        this.duration = function () {
            return audio.obj.duration
        }
    }, playSound: function (url) {
        if (!audio.ready || !url)return;
        var src = url.replace(/\.(?:mp3|ogg)(\?.*?)?$/, "." + this.type + "$1");
        audio.stop();
        audio.src(src);
        audio.play()
    }, getType: function () {
        if (this.types.indexOf("mp3") != -1 && this.obj.canPlayType("audio/mpeg")) {
            return "mp3"
        }
        return false
    }, supports_html5: function () {
        if (window.opera && opera.version() < 12.5 && opera.version().slice(3) < 5 && browser.os != "macos" && browser.flashEnabled)return false;
        return this.obj && this.obj.canPlayType && !!this.getType()
    }, supports_flash: function () {
        return browser.flashEnabled
    }, buildFlashFallback: function () {
        var tmp = document.createElement("div");
        tmp.innerHTML = '<embed id="audio_niftyplayer" name="audio_niftyplayer" width="1" height="1" allowscriptaccess="always" quality="high" type="application/x-shockwave-flash" style="position:absolute;left:-999em"></embed>';
        audio.obj = tmp.firstChild;
        audio.obj.src = "/mediaplayer/niftyplayer.swf";
        document.body.appendChild(audio.obj);
        var t = setInterval(function () {
            try {
                if (audio.obj && audio.obj.PercentLoaded && audio.obj.PercentLoaded() == 100) {
                    audio.ready = true;
                    audio.setupFlashAPI();
                    clearInterval(t)
                }
            } catch (e) {
            }
        }, 15)
    }, setupFlashAPI: function () {
        var el = audio.obj;
        this.play = function () {
            el.TCallLabel && el.TCallLabel("/", "play")
        };
        this.pause = function () {
            el.TCallLabel && el.TCallLabel("/", "pause")
        };
        this.stop = function () {
            el.TCallLabel && el.TCallLabel("/", "stop")
        };
        this.paused = function () {
            return el.GetVariable && el.GetVariable("playingState") != "playing"
        };
        this.ended = function () {
            return el.GetVariable && el.GetVariable("playingState") == "finished"
        };
        this.src = function (src) {
            if (src) {
                el.SetVariable && el.SetVariable("currentSong", src);
                el.TCallLabel && el.TCallLabel("/", "load")
            } else return el.GetVariable && el.GetVariable("currentSong")
        };
        this.volume = function (value) {
            if (value) {
                el.SetVariable && el.SetVariable("_volume", value);
                el.TCallLabel && el.TCallLabel("/", "setVolume")
            } else return el.GetVariable && +el.GetVariable("_volume")
        };
        this.duration = function () {
            return el.GetVariable && +el.GetVariable("_duration")
        }
    }, addEventListener: function (event_name, callback) {
        if (!this.ready) {
            setTimeout(function () {
                audio.addEventListener(event_name, callback)
            }, 5);
            return
        }
        if (this.mode == "html5") {
            if (window.jQuery) jQuery(this.obj).on(event_name, callback); else this.obj.addEventListener(event_name, callback, false)
        } else {
            if (!this.ready)return;
            function fire_event(event_name, callback) {
                events = event_name.split(" ");
                var l = events.length;
                while (l--) {
                    event_name = events[l];
                    if (/\./.test(events[l])) {
                        var event_rel = events[l].split(".")[1];
                        event_name = events[l].split(".")[0]
                    }
                    var flash_events = "onPlay onStop onPause onError onSongOver onBufferingComplete onBufferingStarted".split(" ");
                    var html5_events = "play stop pause error ended loadeddata loadedmetadata".split(" ");
                    var event_index = html5_events.indexOf(event_name);
                    if (event_index == -1)return;
                    var flash_event_name = flash_events[event_index];
                    var cb_name = "_evt_" + flash_event_name;
                    if (event_rel) cb_name += "_" + event_rel;
                    audio.obj[cb_name] = callback;
                    audio.obj.SetVariable(flash_event_name, "audio.obj." + cb_name + "()");
                    if (audio.obj[cb_name + "_itv"]) clearInterval(audio.obj[cb_name + "_itv"]);
                    audio.obj[cb_name + "_itv"] = setInterval("audio.obj.SetVariable('" + flash_event_name + "', 'audio.obj." + cb_name + "()');", 8)
                }
            }

            var events;
            if (typeof event_name == "object") {
                for (var ev in event_name) {
                    fire_event(ev, event_name[ev])
                }
            } else {
                fire_event(event_name, callback)
            }
        }
    }, removeEventListener: function (event_name, callback) {
        if (audio.mode == "html5") {
            if (window.jQuery) $(audio.obj).off(event_name); else audio.obj.removeEventListener(event_name, callback, false)
        } else {
            audio.addEventListener(event_name, function () {
            })
        }
    }
};
var PE_Balloon = {
    $balloon: null,
    $target: null,
    showBalloonClass: "show-balloon",
    addWordClass: ".balloon__buttons__add",
    playClass: ".play-sound:not(.play-sound_slowly)",
    playClassSlow: ".play-sound_slowly",
    rowClass: "balloon-row",
    rowWordClass: ["word"],
    rowWordText: [{target: "corner", closest: ".puzzle"}, {target: "solved", data: "word"}, {
        target: "single",
        data: "word"
    }, {target: "puzzle__icon", closest: ".puzzle__item"}],
    word: "",
    parent_word: "",
    selected_word: "",
    selected_word_id: 0,
    translation: "",
    post_type: window.media_type || "",
    post_id: 0,
    piece_index: 0,
    speakers: {},
    slow_speakers: {},
    total_videos: 0,
    WordVideo: {},
    isExpression: false,
    user_video_id: 0,
    isDictionaryPage: false,
    style: 1,
    STYLE_SMALL: 1,
    STYLE_SELECT: 3,
    STYLE_FULL: 4,
    request: null,
    init: function (options) {
        if (typeof options.balloon_video === "boolean") balloon_video = options.balloon_video;
        if (typeof options.balloon_phrases === "boolean") balloon_phrases = options.balloon_phrases;
        if (typeof options.balloon_form_words === "boolean") balloon_form_words = options.balloon_form_words;
        if (options.id_user !== undefined && !isNaN(options.id_user)) {
            partner_id = options.id_user
        }
        if (options.our_helper !== undefined && typeof options.our_helper === "boolean") {
            our_helper = options.our_helper
        }
        var that = this, $body = $("body");
        if (our_helper === true) {
            if (getCookie("puzzle") === "") {
                var usach_html = '<div class="puzzleUsach"><img src="https://puzzle-english.com/wp-content/themes/english/assets/images/cross.png" class="closeUsach"><p>1. Нажимай на слова английских субтитров</p><p>2. Смотри перевод с видеопримерами</p><p>3. Добавляй в личный словарь и тренируй их на&nbsp;<a href="https://puzzle-english.com/p/' + partner_id + '" target="_blank">Puzzle English</a></p></div>';
                if ($(".puzzleUsach").length <= 0 && $(".puzzleUsach").html() === undefined) {
                    $('div.playerBox.show_usach_banner').find('.usach_banner_container').prepend(usach_html);
                    $body.on("click", ".closeUsach", function () {
                        setCookie("puzzle", "shown", 365);
                        $(".puzzleUsach").remove()
                    })
                }
            }
        }
        if (options.rowClass) {
            this.rowClass = options.rowClass
        }
        if (options.rowWordClass) {
            this.rowWordClass = options.rowWordClass
        }
        if (options.wrap_words) {
            var $rows = $("." + this.rowClass);
            for (var i = 0; i < $rows.length; i++) {
                pe_balloon_wrapWords($rows[i])
            }
        }
        this.setShowBalloonOnClick();
        $body.on("click", this.addWordClass, function () {
            that.addWord()
        });
        $body.on("click", ".balloon__main__text", function () {
            that.setStyle(that.STYLE_FULL)
        });
        $body.on("click", ".balloon-open__phrase__footer__show-translate", function () {
            that.showBalloon(that.$target, false)
        });
        $body.on("click", ".balloon-vote__element", function (e) {
            that.pickContextTranslation($(e.target))
        });
        $body.on("click", ".balloon__buttons__cancel_style", function (e) {
            var style = that.STYLE_SMALL;
            that.setStyle(style)
        });
        $body.on("click", "#balloon .slovo-game__repeat__dictors__list__element", function () {
            var slug = $(this).data("slug");
            that.playSpeaker(slug)
        });
        $body.on("click", "#balloon " + that.playClassSlow, function () {
            if (!this.emulatedClick) that.updateSpeakersSlowPos()
        });
        $body.on("click", ".play-sound_slowly", function () {
            if ($(this).data("speakers") == "" || $(this).prev().data("speakers") == $(this).data("speakers")) {
                $(audio.obj).get(0).playbackRate = .5
            }
        });
        $body.on("click", "#balloon " + that.playClass, function () {
            if (!this.emulatedClick) that.updateSpeakersPos()
        });
        $(document).on("Sound.audio_playing", function () {
            $("#balloon").addClass("speaker-playing")
        });
        $(document).on("Sound.audio_ended", function () {
            $("#balloon").removeClass("speaker-playing")
        });
        this.WordVideo = new WordVideo;
        if (!audio.ready) audio.init()
    },
    setPostId: function (post_id) {
        var _post_id = parseInt(post_id);
        if (!isNaN(_post_id)) {
            this.post_id = _post_id
        }
    },
    setShowBalloonOnClick: function () {
        var $body = $("body"), that = this;
        $body.on("click", "." + this.rowClass, function (event) {
            if ($(event.target).parents(".mixed-puzzles-wrap").length)return;
            const $target = $(event.target)
            // const $container = $target.parents('.balloon-container')
            // $container.css('position', 'relative')
            // that.showBalloon($container.length > 0 ? $container.first() : $target)
            that.showBalloon($target)
        });
        $body.on("click", "." + this.showBalloonClass, function (event) {
            that.showBalloon($(event.currentTarget))
        })
    },
    pickContextTranslation: function ($target) {
        var $ul = $target.closest("ul"), $li = $target.closest("li"), translation = $target.text(),
            $data_pointer = null;
        if ($ul.hasClass("popular-list")) {
            $data_pointer = $li
        } else {
            $data_pointer = $ul
        }
        var part_of_speech = $data_pointer.data("part_of_speech"), article = $data_pointer.data("article"),
            word = $data_pointer.data("word");
        var action = this.$target.data("action");
        $(".balloon__main__more").html(article);
        $(".balloon__main__word").html(word);
        $(".balloon-main-translation").html(translation);
        this.setStyle(this.STYLE_SMALL);
        this.translation = translation;
        this.selected_word = word;
        this.part_of_speech = part_of_speech;
        this.selected_word_id = $ul.data("word_id");
        this.$balloon.find(".balloon__buttons__add").show();
        this.$balloon.find(".balloon__buttons__add__success").hide();
        this.saveUserContext({part_of_speech: part_of_speech, word: word, parent_word: this.word});
        var $vocab_video = this.$balloon.find(".vocab-card__video");
        $vocab_video.removeClass("is-playing").addClass("loading");
        this.WordVideo.requestVideos(this.word, this.translation, [], function (response) {
            window.word_videos = response.videos;
            PE_Balloon.WordVideo.setVideo(0, false);
            $vocab_video.removeClass("loading")
        })
    },
    setStyle: function (style) {
        this.style = style;
        this.$balloon.removeAttr("class").addClass("balloon");
        switch (style) {
            case 1:
                this.$balloon.addClass("balloon__word__translate balloon__word__translate_vertical");
                break;
            case 3:
                this.$balloon.addClass("balloon-open");
                break;
            case 4:
                this.$balloon.addClass("balloon-open balloon-full");
                break;
            default:
                this.setStyle(this.STYLE_SMALL);
                break
        }
        var $balloon_jbox = $("#balloon-jbox");
        $balloon_jbox.hide();
        this.box.setContent(this.$balloon);
        this.box.position();
        this.box.position();
        $balloon_jbox.show();
        if (window.is_mobile) {
            $balloon_jbox.css({left: "0px", top: $(window).scrollTop() + "px"})
        }
        console.log(1);
    },
    showBalloon: function ($target, check_parent_expression) {
        var that = this;
        this.setPostId(0);
        check_parent_expression = check_parent_expression !== false;
        this.$target = $target;
        if ($target.parent().parent().hasClass("balloon__content__phrase__en")) {
            if (typeof this.box !== "undefined") this.$target = this.box.target
        }
        var doRequest = false, piece_index = 0, post_id = 0, post_type = "", word = "", parent_expression = "",
            translation = "";
        if ($target.hasClass(this.showBalloonClass)) {
            word = $target.data("word");
            translation = $target.data("translation");
            piece_index = $target.data("piece_index") || piece_index;
            post_id = $target.data("post_id") || this.post_id;
            post_type = $target.data("post_type") || this.post_type;
            this.isDictionaryPage = $target.data("dictionary_page");
            doRequest = true
        }
        var hasClass = false, targetClass = "";
        for (var i = 0; i < this.rowWordClass.length; i++) {
            if ($target.hasClass(this.rowWordClass[i]) || $target.parent().hasClass(this.rowWordClass[i]) || $target.is("expr")) {
                hasClass = true;
                targetClass = this.rowWordClass[i];
                break
            }
        }
        var $closest = $target.closest("." + this.rowClass);
        if ($closest.length && hasClass && !$target.hasClass("no-balloon_js")) {
            for (var exc = 0; exc < that.rowWordText.length; exc++) {
                if (targetClass == that.rowWordText[exc].target) {
                    if (typeof that.rowWordText[exc].data !== "undefined") {
                        word = $target.data(that.rowWordText[exc].data)
                    } else if (typeof that.rowWordText[exc].closest !== "undefined") {
                        var word_element = $target.closest(that.rowWordText[exc].closest);
                        if (word_element.find(".word").length) word_element = word_element.find(".word");
                        word = word_element.text()
                    }
                }
            }
            if (word == "") word = $target.text();
            piece_index = $closest.attr("data-piece_index") || piece_index;
            post_id = $closest.attr("data-post_id") || post_id;
            post_type = $closest.attr("data-post_type") || this.post_type;
            this.isDictionaryPage = $closest.data("dictionary_page");
            doRequest = true
        }
        if (word == "") doRequest = false;
        var $dictionary_balloon = $("#dictionary_balloon");
        if ($dictionary_balloon.length !== 0) {
            $dictionary_balloon.data("word", word);
            $dictionary_balloon.data("translation", translation)
        }
        post_id = $target.parent().data("post_id") ? $target.parent().data("post_id") : post_id;
        piece_index = $target.parent().data("piece_index") ? $target.parent().data("piece_index") : piece_index;
        post_id = $target.data("post_id") ? $target.data("post_id") : post_id;
        piece_index = $target.data("piece_index") ? $target.data("piece_index") : piece_index;
        post_id = post_id || window["post_id"];
        post_type = post_type || this.post_type;
        this.setPostId(post_id);
        var $parent = $target.parent();
        var expression_form = "";
        var $expr = $parent.is("expr, .expression") ? $parent : $target.is("expr, .expression") ? $target : [];
        if (check_parent_expression && $expr.length) {
            parent_expression = $expr.attr("data-base") || $expr.text();
            if ($expr.attr("data-base")) {
                expression_form = $expr.text()
            }
        }
        var data = {
            ajax_action: "ajax_balloon_Show",
            post_id: post_id,
            piece_index: piece_index,
            translation: translation,
            word: word,
            parent_expression: parent_expression,
            expression_form: expression_form,
            url: location.href,
            external: 1,
            partner_id: partner_id,
            balloon_video: balloon_video,
            balloon_phrases: balloon_phrases,
            balloon_form_words: balloon_form_words
        };
        if (!pe_user.id) data.tmp_user_id = pe_user._id;
        var callback = function (response) {

            console.log('callback from puzzly work')
            if (typeof response !== "object" || response.length === 0) {
                that.box && that.box.destroy();
                return
            }
            that.$balloon = $(response["html"]);
            that.speakers = response["word_speakers"];
            that.slow_speakers = response["word_speakers_slow"];
            window.word_videos = response.word_videos;
            that.piece_index = that.$balloon.data("piece_index");
            that.word = that.$balloon.data("word");
            that.selected_word_id = that.$balloon.data("word_id");
            that.part_of_speech = that.$balloon.data("part_of_speech");
            that.word_part_of_speech = that.$balloon.data("word_part_of_speech") || "";
            that.parent_word = that.$balloon.data("parent_word");
            that.selected_word = that.$balloon.data("selected_word");
            that.translation = that.$balloon.data("translation");
            that.total_videos = that.$balloon.data("total_videos");
            that.isExpression = response.Word.is_expression;
            that.user_video_id = response.Word.user_video_id;
            var votes_exists = response.Word.vote_exists;
            var style = that.STYLE_SMALL;
            if (response.Word.exists && !votes_exists) {
                style = that.STYLE_SELECT
            }
            that.WordVideo.init({
                video: that.$balloon.find("#word_video").get(0),
                set_video: Object.keys(response.word_videos).length > 0,
                is_single: true
            });
            var word_videos_length = Object.keys(window.word_videos).length;
            if (typeof window.word_videos != "undefined" && word_videos_length === 0) {
                that.$balloon.find(".balloon__content").hide()
            } else if (word_videos_length === 1) {
                that.WordVideo.$nextButton.hide()
            }
            that.setStyle(style);
            if (window["is_mobile"]) {
                console.log(2);
                that.$balloon.css({width: $(window).width() + "px"});
                $("#balloon-jbox").css({left: "0px", top: $(window).scrollTop() + "px"});
                $(".jBox-pointer").hide()
            }
            var $play_button = that.$balloon.find(that.playClass);


            if(1) {

                // console.log('fix full screen popup fix  ')
                // console.dir(video.requestFullscreen);
                // console.dir(video.mozRequestFullScreen);
                // console.dir(video.webkitRequestFullscreen);

                 // console.dir(   $play_button[0]);
                 // console.dir(   $play_button);


                console.dir(   isVideoInFullscreen());

                if(!isVideoInFullscreen()) {
                    if (0) {

                        $play_button[0].emulatedClick = 1;
                        $play_button.click(); //кнопка звука ??     на фулскрине пропадает если слово без картинок
                        $play_button[0].emulatedClick = 0;

                    }
                }

                $play_button[0].emulatedClick = 1;
                $play_button.click(); //кнопка звука ??     на фулскрине пропадает если слово без картинок
                $play_button[0].emulatedClick = 0;



                console.log('fix full screen popup 2')
            }else{
                console.log('fix full screen popup')
            }

            if (that.$balloon.find(".slovo-game__repeat__dictors__list__element").length == 1 && that.part_of_speech != "expression") {
                that.$balloon.find(".slovo-game__repeat__dictors__list__wrapper").show()
            }
            if (that.isDictionaryPage) {
                that.$balloon.find(".balloon-open__header").hide()
            }
            that.request = null;
            that.$balloon.find(".balloon__content__phrase__source__icon").on("click", function (e) {
                $(this).parents(".balloon__content__phrase").toggleClass("is-source")
            });
            if (typeof response.pe_user_id !== "undefined") window.pe_user.id = response.pe_user_id
        };


        if(!isVideoInFullscreen()) {

        $("#balloon").remove();

        };;



        if (doRequest) {
            if (this.request) {
                this.request.abort();
                this.request = null
            }
            this.box && this.box.destroy();
            var $jbox_target = null;
            if (that.$target.data("target")) $jbox_target = $(that.$target.data("target")); else $jbox_target = that.$target;

            var y_position = 'top';
            if ($jbox_target.closest('.vjs-fullscreen').length) {
                y_position = 'center';
            }

            this.box = new jBox("Tooltip", {
                id: "balloon-jbox",
                target: $jbox_target,
                appendTo: $jbox_target.closest('.vjs-fullscreen').length ? $jbox_target.closest('.vjs-fullscreen') : jQuery("body"),
                offset: $jbox_target.closest('.vjs-fullscreen').length ? {x: 0, y: 0} : 0,
                theme: "TooltipBorder",
                width: "auto",
                height: "auto",
                pointTo: "target",
                adjustPosition: false,
                adjustTracker: false,
                adjustDistance: {top: 55, right: 5, bottom: 5, left: 5},
                closeOnClick: "body",
                closeOnEsc: true,
                zIndex: 500,
                position: {x: "center", y: y_position},
                outside: "y",
                content: '<img class="balloon_preloader" src="https://puzzle-english.com/wp-content/themes/english/admin/images/preloader-big.gif">',
                animation: false,
                fade: false,
                onInit: function () {
                    this.options.height = $("#balloon").height()
                },
                onClose: function () {
                    $("#balloon-jbox").hide()
                },
                onCloseComplete: function () {
                    this.destroy();
                    PE_Balloon.WordVideo.video_id = 0;
                    PE_Balloon.WordVideo.video_api = null;
                    PE_Balloon.box = null;
                    PE_Balloon.$balloon = null;
                    Sound.clearCurrentList()
                }
            });
            this.box.open();
            console.log('pre ajax');
            this.request = $.ajax({
                url: window.PE_HOST,
                 success: callback,
               // done: callback,
                data: data,
                type: "post",
                   // type: "get",
                scriptCharset: "utf-8",
                dataType: "jsonp",
                // error: function (e) {          // памяти жрет пипец
                //     console.error('Something wrong happened when requesting ' + window.PE_HOST, e)
                // }
  //               success: function (e) {
  //                          console.log('suc ajax');
  // console.log(e);
  //                             this.request=e;
  //
  //               }
            })
        }
    },
    close: function () {
        this.box && this.box.close()
    },
    addWord: function () {
        var that = this, video_post_id = 0, video_piece_index = 0;
        if (typeof word_videos[PE_Balloon.WordVideo.index] !== "undefined") {
            video_post_id = word_videos[PE_Balloon.WordVideo.index].post_id;
            video_piece_index = word_videos[PE_Balloon.WordVideo.index].piece_index
        }
        var data = {
            ajax_action: "ajax_dictionary_addWord",
            post_id: video_post_id,
            piece_index: video_piece_index,
            word: this.selected_word,
            translation: this.translation,
            part_of_speech: this.part_of_speech,
            video_id: this.WordVideo.video_id,
            post_type: this.post_type,
            is_dictionary_page: 1,
            external: 1
        };
        if (!pe_user.id) {
            data.tmp_user_id = pe_user._id;
            data.word_id = this.selected_word_id
        }
        var callback = function (response){

        console.log('callback from puzzly')

            that.$balloon.find(".balloon__buttons__add").hide();
            that.$balloon.find(".balloon__buttons__add__success").addClass("is-visible").show();
            that.$balloon.find(".delete").data("word_id", response.user_word_id);
            that.updateDictCount()
        };
        $.post(window.PE_HOST + document.location.search, data, callback, "jsonp")
    },
    playSpeaker: function (speaker) {
        var index = speaker;
        if (isNaN(speaker)) {
            index = Sound.currentList.indexOf(speaker)
        }
        if (index != -1) {
            var $items = PE_Balloon.$balloon.find(".slovo-game__repeat__dictors__list__element");
            var $currentItem = $items.filter("[data-slug=" + Sound.currentList[index] + "]");
            $items.removeClass("is-active");
            $currentItem.addClass("is-active");
            Sound.currentList = Sound.currentList.slice(index).concat(Sound.currentList.slice(0, index));
            Sound.playWord(this.selected_word.toLocaleLowerCase());
            this.updateSpeakersPos()
        }
    },
    updateSpeakersSlowPos: function () {
        if (PE_Balloon.part_of_speech == "expression" && $("#balloon .slovo-game__repeat__dictors__list__wrapper_slow .slovo-game__repeat__dictors__list__element").length == 1)return;
        $("#balloon .slovo-game__repeat__dictors__list__wrapper").hide();
        var $wrap = $("#balloon .slovo-game__repeat__dictors__list__wrapper_slow").show();
        if (!$wrap.length)return;
        var $ul = $wrap.children();
        var $currentItem = $ul.children(".is-active");
        var ww = $wrap.width();
        var uw = $ul.width();
        var iw = $currentItem.width();
        var current_item_pos = $currentItem.position().left;
        var pos = 0;
        if (current_item_pos > ww / 2) {
            pos = -(current_item_pos - ww / 2) - iw / 2
        }
        if (pos < -uw + ww) {
            pos = -uw + ww
        }
        if (pos > 0) pos = 0;
        $ul.css("left", pos)
    },
    updateSpeakersPos: function (slow) {
        if (PE_Balloon.part_of_speech == "expression" && $("#balloon .slovo-game__repeat__dictors__list__wrapper .slovo-game__repeat__dictors__list__element").length == 1)return;
        $("#balloon .slovo-game__repeat__dictors__list__wrapper_slow").hide();
        var $wrap = $("#balloon .slovo-game__repeat__dictors__list__wrapper").show();
        if (!$wrap.length)return;
        var $ul = $wrap.children();
        var $currentItem = $ul.children(".is-active");
        var ww = $wrap.width();
        var uw = $ul.width();
        var iw = $currentItem.width();
        var current_item_pos = $currentItem.position().left;
        var pos = 0;
        if (current_item_pos > ww / 2) {
            pos = -(current_item_pos - ww / 2) - iw / 2
        }
        if (pos < -uw + ww) {
            pos = -uw + ww
        }
        if (pos > 0) pos = 0;
        $ul.css("left", pos)
    },
    saveUserContext: function (options) {
        console.log('saveUserContext');
        var data = {
            ajax_action: "ajax_external_balloon_saveUserContext",
            user_id: window.pe_user.id || window.pe_user._id,
            word: this.selected_word,
            part_of_speech: this.part_of_speech,
            parent_word: this.parent_word,
            translation: this.translation,
            video_id: this.WordVideo.video_id,
            url: location.href
        };
        data = $.extend({}, data, options || {});
        var callback = function (res) {
            $(document).trigger("saveUserContext.balloon", [data, res])
        };
        $.post(window.PE_HOST, data, callback, "jsonp")
    },
    updateDictCount: function () {
        var $row = $(".pe-balloon__words").find("span:first");
        var c = parseInt($row.find("small").eq(0).text()) + 1;
        $row.find("small").eq(0).text(c);
        $row.find("small").eq(1).text(pe_plural_ru(c, ["слово", "слова", "слов"]))
    }
};
function WordVideo() {
    this.word_id = null;
    this.card = {};
    this.$box = {};
    this.$card = null;
    this.$playButton = null;
    this.$card_video = null;
    this.$saveChoice = null;
    this.$phrase_en = null;
    this.$card_phrase_en = null;
    this.$card_phrase_ru = null;
    this.$nextButton = null;
    this.$prevButton = null;
    this.initialized = false;
    this.video = null;
    this.current_word_id = 0;
    this.video_id = 0;
    this.index = 0;
    this.is_single = true;
    this.nextButton = null;
    this.prevButton = null;
    this.playButton = null;
    this.phrase_ru = null;
    this.phrase_en = null;
    this.confirmButton = null;
    this.request_object = null;
    this.options = {};
    this.init = function (_options) {
        var defaults = {
            video: null,
            is_single: true,
            set_video: false,
            $box: PE_Balloon.$balloon,
            nextButton: ".wordVideoNext",
            prevButton: ".wordVideoPrev",
            playButton: ".wordVideoPlay",
            phraseRu: ".wordVideoPhraseRu",
            phraseEn: ".wordVideoPhraseEn",
            saveButton: ".wordVideoSaveChoice",
            phrase_en: ".balloon__content__phrase__en",
            phrase_ru: ".balloon__content__phrase__ru",
            request_videos: true
        };
        this.options = $.extend({}, defaults, _options || {});
        this.$box = this.options.$box;
        this.is_single = !!this.options.is_single;
        if (this.is_single) {
            this.video = this.options.video;
            if (this.options.set_video) {
                this.video_api = this.options.video
            }
            this.$card_video = PE_Balloon.$balloon.find(".vocab-card__video");
            this.$playButton = PE_Balloon.$balloon.find(".wordVideoPlayButton");
            this.$saveChoice = PE_Balloon.$balloon.find(this.options.saveButton);
            this.$phrase_en = PE_Balloon.$balloon.find(this.options.phrase_en);
            this.$phrase_ru = PE_Balloon.$balloon.find(this.options.phrase_ru);
            this.$nextButton = PE_Balloon.$balloon.find(this.options.nextButton);
            this.$prevButton = PE_Balloon.$balloon.find(this.options.prevButton)
        }
        if (this.is_single || this.options.set_video) {
            this.$phrase_en = this.$box.find(this.options.phrase_en);
            this.$phrase_ru = this.$box.find(this.options.phrase_ru)
        }
        if (!this.initialized) {
            this.initialized = true
        }
        if (this.options.set_video) {
            this.setVideo(0, false)
        }
        if (this.options.disable_buttons) {
            this.$box && this.$box.find(this.options.prevButton).addClass(this.options.disable_buttons)
        } else {
            this.$box && this.$box.find(this.options.prevButton).hide()
        }
    };
    this.getVideoObject = function () {
        return this.video_api
    };
    this.nextVideo = function (autoplay) {
        autoplay = typeof autoplay !== "undefined";
        this.setVideo(this.index + 1, autoplay)
    };
    this.prevVideo = function (autoplay) {
        autoplay = typeof autoplay !== "undefined";
        this.setVideo(this.index - 1, autoplay)
    };
    this.setVideo = function (index, autoplay) {
        if (typeof index === "undefined") index = this.index;
        if (typeof autoplay === "undefined") autoplay = true;
        var video = this.getVideoObject();
        var $vocab_video = null;
        var video_data = window.word_videos;
        if (index + 5 >= video_data.length && video_data.length < PE_Balloon.total_videos) {
            $vocab_video = PE_Balloon.$balloon.find(".vocab-card__video");
            $vocab_video.removeClass("is-playing").addClass("loading");
            var exclude_ids = [];
            for (var i = 0; i < video_data.length; i++) {
                exclude_ids.push(video_data[i].id)
            }
            PE_Balloon.WordVideo.requestVideos(PE_Balloon.word, PE_Balloon.translation, exclude_ids, function (response) {
                window.word_videos = window.word_videos.concat(response.videos);
                if (response.videos.length > 0) {
                    PE_Balloon.WordVideo.setVideo(index, false)
                }
                $vocab_video.removeClass("loading")
            });
            return
        }
        if (typeof window.word_videos == "undefined" || typeof video_data == "undefined")return;
        if (video_data.length !== 0) {
            if (typeof video === "undefined" || video === null) {
                this.video_api = videojs(this.options.video);
                video = this.getVideoObject()
            }
        }
        if (index + 1 > video_data.length - 1) {
            if (this.options.disable_buttons) {
                this.$nextButton.addClass(this.options.disable_buttons);
                this.$prevButton.removeClass(this.options.disable_buttons)
            } else {
                this.$nextButton.hide();
                this.$prevButton.show()
            }
        } else {
            if (this.options.disable_buttons) {
                this.$nextButton.removeClass(this.options.disable_buttons)
            } else {
                this.$nextButton.show()
            }
        }
        if (index - 1 < 0) {
            if (this.options.disable_buttons) {
                this.$nextButton.removeClass(this.options.disable_buttons);
                this.$prevButton.addClass(this.options.disable_buttons)
            } else {
                this.$nextButton.show();
                this.$prevButton.hide()
            }
        } else {
            if (this.options.disable_buttons) {
                this.$prevButton.removeClass(this.options.disable_buttons)
            } else {
                this.$prevButton.show()
            }
        }
        if (this.is_single) {
            if (video_data.length <= 0) {
                PE_Balloon.$balloon.find(".vocab-card__video").hide();
                return
            } else {
                PE_Balloon.$balloon.find(".vocab-card__video").show()
            }
        }
        if (index < 0 || index > video_data.length - 1)return;
        this.index = index;
        this.video_id = parseInt(video_data[this.index].id);
        var post_id = video_data[this.index].post_id;
        var piece_index = video_data[this.index].piece_index;
        if ((this.is_single || this.options.set_video) && video_data[this.index].phrase_en) {
            this.$phrase_en.html(video_data[this.index].phrase_en).show();
            this.$phrase_ru.html(video_data[this.index].phrase_ru);
            this.$box.find(".balloon__content__phrase__source__text").html(video_data[this.index].post_title);
            this.$box.find(".balloon__content__phrase__source__text").attr("href", video_data[this.index]["post_url"]);
            var $context_notice = this.$box.find(".balloon__context__notice");
            if (video_data[this.index].context && !video_data[this.index].synonym) {
                $context_notice.hide()
            } else {
                var $items = PE_Balloon.$balloon.find(".balloon__context__notice__items");
                if (typeof video_data[this.index].context_translation != "undefined" && video_data[this.index].context_translation.length > 0) {
                    $items.show();
                    $items.find("strong").html(PE_Balloon.word);
                    $items.find("small").html(video_data[this.index].context_translation)
                } else {
                    $items.hide()
                }
                if (video_data[this.index].context && video_data[this.index].synonym) {
                    $context_notice.addClass("synonym")
                } else {
                    $context_notice.removeClass("synonym")
                }
                $context_notice.show()
            }
        }
        var src = window.PE_STATIC_HOME + "/video_pieces/mp4/" + post_id + "/" + piece_index + "_360px.mp4";
        this._pauseVideo();
        var poster = window.PE_STATIC_HOME + "/video_pieces/mp4/" + post_id + "/" + piece_index + ".jpg";
        if (this.is_single) {
            video.poster = poster
        } else {
            $("#word-video" + this.word_id).find("video").get(0).poster = poster
        }
        video.src = src;
        if (autoplay) this.play();
        this.options.request_videos = true
    };
    this.play = function () {
        var video = this.getVideoObject(), self = this;
        video.addEventListener("play", function () {
            self.$playButton.hide();
            self.$card_video.addClass("is-playing");
            video.removeEventListener("play", function () {
            })
        });
        video.addEventListener("pause", function () {
            self._pauseVideo();
            video.removeEventListener("pause", function () {
            })
        });
        video.play()
    };
    this._pauseVideo = function () {
        var video = this.getVideoObject();
        video && video.pause();
        this.$playButton && this.$playButton.show();
        this.$card_video ? this.$card_video.removeClass("is-playing") : $(".vocab-card__video").removeClass("is-playing")
    };
    this.requestVideos = function (word, translation, exclude_ids, callback) {
        var that = this;
        var data = {
            ajax_action: "ajax_cards_getWordVideos",
            word: word,
            translation: translation,
            exclude_ids: exclude_ids
        };
        var success_callback = function (_response) {
            that.request_object = null;
            callback && callback(_response)
        };
        if (this.request_object !== null) {
            this.request_object.abort()
        }
        this.request_object = $.ajax({
            url: window.PE_HOST,
            success: success_callback,
            data: data,
            type: "post",
            dataType: "jsonp",
            error: function (e) {
                console.error('Something wrong happened when requesting ' + window.PE_HOST, e)
            }
        })
    }
}
var Sound = {
    options: {},
    currentList: [],
    currentWord: "",
    currentSpeakers: "",
    $element: {},
    init: function (_options) {
        var that = this;
        var defaults = {playButton: ".play-sound", playButtonSlow: ".play-sound_slowly"};
        this.options = $.extend({}, defaults, _options || {});
        var body = $("body");
        body.on("click", this.options.playButton, function (e) {
            var $sound = $(e.currentTarget);
            that.$element = $sound;
            if ($sound.data("audio")) {
                that.playSoundUrl($sound.data("audio"))
            } else {
                var speakers_string = $sound.data("speakers");
                if (speakers_string === null)return;
                var speakers = speakers_string.length > 0 ? speakers_string.split(",") : [];
                var word = $sound.data("word");
                if (that.currentList.length === 0 || that.currentWord != word || that.currentSpeakers != speakers_string) {
                    that.currentList = speakers;
                    that.currentWord = word;
                    that.currentSpeakers = speakers_string
                }
                that.playWord(word)
            }
        });
        body.on("click", this.options.playButtonSlow, function (e) {
            var $sound = $(e.currentTarget);
            that.$element = $sound;
            if ($sound.data("audio")) {
                that.playSoundUrl($sound.data("audio"))
            } else {
                var speakers_string = $sound.data("speakers");
                if (speakers_string === "") {
                    speakers_string = $sound.prev().data("speakers")
                }
                var speakers = speakers_string.length > 0 ? speakers_string.split(",") : [];
                var word = $sound.data("word");
                if (that.currentList.length === 0 || that.currentWord != word || that.currentSpeakers != speakers_string) {
                    that.currentList = speakers;
                    that.currentWord = word;
                    that.currentSpeakers = speakers_string
                }
                that.playWord(word)
            }
        })
    },
    play: function (word, speakerSlug, path) {
        var ts = (new Date).getTime();
        path = typeof path === "undefined" || !path ? "words" : path;
        audio.playSound(window.PE_STATIC_HOME + "/" + path + "/" + speakerSlug + "/" + word + ".mp3?" + ts);
        $(document).trigger("Sound.audio_playing");
        audio.addEventListener("error", function (e) {
            audio.removeEventListener("error");
            if (e.target.error !== null) {
                $(document).trigger("Sound.audio_error")
            }
        });
        audio.addEventListener("ended", function () {
            audio.removeEventListener("ended");
            $(document).trigger("Sound.audio_ended")
        });
        if (PE_Balloon.$balloon !== null) {
            PE_Balloon.$balloon.find(".slovo-game__repeat__dictors__list__element").removeClass("is-active").filter("[data-slug=" + speakerSlug + "]").addClass("is-active")
        }
    },
    playWord: function (word) {
        if (this.currentList.length === 0 || !word)return;
        var path = this.$element.data("path");
        if (this.currentList[0] !== "vocalware_hugh_UK") word = word.replace(/\s+/, "-");
        this.play(word, this.currentList[0], path);
        this.currentList[this.currentList.length] = this.currentList[0];
        this.currentList.splice(0, 1)
    },
    playSoundUrl: function (url) {
        if (!url)return;
        audio.playSound(url);
        audio.addEventListener("ended", function () {
            audio.removeEventListener("ended")
        })
    },
    clearCurrentList: function () {
        this.currentList = []
    }
};
$(function () {
    var $body = $("body");
    $body.on("click", ".wordVideoPlay", function (e) {
        PE_Balloon.WordVideo.play()
    });
    $body.on("click", ".wordVideoPrev", function (e) {
        PE_Balloon.WordVideo.prevVideo()
    });
    $body.on("click", ".wordVideoNext", function (e) {
        PE_Balloon.WordVideo.nextVideo()
    });
    if (getCookie("pe_user_id") === "") {
        setCookie("pe_user_id", Date.now(), 365)
    }
    pe_user._id = getCookie("pe_user_id");
    Sound.init()
});
function setCookie(cname, cvalue, exdays) {
    var d = new Date;
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1e3);
    var expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + "; " + expires + "; path=/"
}
function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(";");
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == " ")c = c.substring(1);
        if (c.indexOf(name) == 0)return c.substring(name.length, c.length)
    }
    return ""
}
function pe_balloon_wrapWords(element, cls) {
    if (!element)return;
    cls = typeof cls === "undefined" ? cls = "word" : cls;
    var result_html = "", matches = [];
    for (var i = 0, l = element.childNodes.length; i < l; i++) {
        var node = element.childNodes[i];
        if (node.nodeType != 3) {
            result_html += node.outerHTML + " ";
            continue
        }
        var words = $.trim(node.nodeValue).replace(/\s+/g, " ").split(" ");
        for (var j = 0; j < words.length; j++) {
            var prepend = "";
            var word = "";
            var append = "";
            if (/^(?:a|an|the|[^a-z0-9]+)$/i.test(words[j])) {
                result_html += words[j] + " ";
                continue
            }
            if (/([a-zA-Z0-9]+)/i.test(words[j])) {
                matches = words[j].match(/^([^a-zA-Z\s']?)([a-zA-Z\-']+)([^a-zA-Z\s']?)$/);
                if (matches !== null) {
                    prepend = typeof matches[1] !== "undefined" ? matches[1] : "";
                    word = matches[2];
                    append = typeof matches[3] !== "undefined" ? matches[3] : ""
                }
            }
            if (word == "") word = words[j];
            result_html += prepend + '<span class="' + cls + '">' + word + "</span>" + append + " "
        }
    }
    result_html = $.trim(result_html).replace(/\s+/g, " ").replace(/ ([\.,!\?])/g, "$1");
    element.innerHTML = result_html
}
function pe_plural_ru(n, arr) {
    n = Math.abs(n);
    var i = n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
    return arr[i]
}


function isVideoInFullscreen() {

    return document.fullscreenElement=document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement;;;

    if (document.fullscreenElement && document.fullscreenElement.nodeName == 'VIDEO') {
        console.log('Your video is playing in fullscreen');
    }else{
        console.log('Your video hz hz');
    }
}