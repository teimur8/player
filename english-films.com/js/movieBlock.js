

$(function () {



    var MovieBlockRules={
        'element':$('#movieBlock'),
        'show': function () {
            MovieBlockRules.element.removeClass('hidden');
        },
        'hide': function () {
            MovieBlockRules.element.addClass('hidden');
        },
        'run':function () {
            if(getCookie('showMovieBlock') ){
                      MovieBlockRules.element.remove();
            }else{
                // show
               // MovieBlockRules.element.removeClass('hidden');
                if($("li[data-target='pl_cf']").hasClass('active')){
                     MovieBlockRules.element.removeClass('hidden');
                }
            }
            // console.log('RUNN')
        }
    };
    
    // начать повторы с интервалом 2 сек
    var timerId = setInterval(function() {
        MovieBlockRules.run();
    }, 2000);

    // через 30 сек остановить повторы
    setTimeout(function() {
        clearInterval(timerId);
    }, 120000);

   $('.closeUsach').click(function() {
       MovieBlockRules.element.addClass('hidden');
       setCookie('showMovieBlock',Math.random(),1);
       MovieBlockRules.element.remove();
    });

})

