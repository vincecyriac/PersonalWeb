$(function () {
    var data = [
        {
            action: 'type',
            strings: ["sudo -s"],
            output: '<br><br><span class="gray">50001 server Error<br>&nbsp;<br>Sorry, Something went wrong<br>&nbsp;</span><br>',
            postDelay: 1000
        },
        {
            action: 'type',
            strings: ["echo 'These are not the error codes you're looking for'", "echo 'Please either report this error to an administrator or return back and forget you were here...'"],
            output: '<br><br><span class="gray">Please either report this error to an administrator or return back and forget you were here...<br></span><br>',
            postDelay: 1000
        },

    ];
    runScripts(data, 0);
});

function runScripts(data, pos) {
    var prompt = $('.prompt'),
        script = data[pos];
    if (script.clear === true) {
        $('.history').html('');
    }
    switch (script.action) {
        case 'type':
            // cleanup for next execution
            prompt.removeData();
            $('.typed-cursor').text('');
            prompt.typed({
                strings: script.strings,
                typeSpeed: 90,
                callback: function () {
                    var history = $('.history').html();
                    history = history ? [history] : [];
                    history.push('<span class="green"> guest@vincecyriac.dev$ </span> ' + prompt.text());
                    if (script.output) {
                        history.push(script.output);
                        prompt.html('');
                        $('.history').html(history.join(''));
                    }
                    // scroll to bottom of screen
                    $('section.terminal').scrollTop($('section.terminal').height());
                    // Run next script
                    pos++;
                    if (pos < data.length) {
                        setTimeout(function () {
                            runScripts(data, pos);
                        }, script.postDelay || 1000);
                    }
                }
            });
            break;
        case 'view':

            break;
    }
}