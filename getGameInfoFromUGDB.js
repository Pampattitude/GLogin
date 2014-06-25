(function() {
    // Modules
    var jsdomLib =              require('jsdom');
    var requestLib =            require('request');
    var querystringLib =        require("querystring");
    // Constants

    var gracefulExit = function(err, data) {
        if (err) {
            console.log('{}');
            console.error(err);
            return process.exit(1);
        }

        console.log(JSON.stringify(data, 2, 2));
        return process.exit(0);
    };

    var trim = function(str) {
        return str.replace(/(\t|\n|\r)+/g, '')
            .replace(/[ ]{2,}/g, ' ')
            .replace(/^ /, '')
            .replace(/ $/, '');
    };

    if (3 > process.argv.length)
        return gracefulExit(new Error('Not enough arguments'));
    
    var gameName = process.argv[2];
    var pageUri = 'http://ultimategamedb.com/Game/Game?' + querystringLib.stringify({id: gameName});
    var reqOptions = {
        uri: pageUri,
        method: 'get',
    };

    return requestLib.get(reqOptions, function(err, res, body, warn) {
        if (err)
            return gracefulExit(err);
        else if (200 != res.statusCode)
            return gracefulExit(new Error('Got status code ' + res.statusCode + ' for page ' + pageUri))

        return jsdomLib.env({
            html: body,
            scripts: ["http://code.jquery.com/jquery.js"],
            done: function(err, window) {
                if (err)
                    return gracefulExit(err);

                var $ = window.jQuery;

                if (!$)
                    return gracefulExit(new Error('Could not get jQuery for page ' + pageUri));

                try {
                    var game = {};
                    game.title = trim($('article.game:first header .text > h1').clone().children().remove().end().text());
                    game.platforms = $('article.game:first header .platforms a').map(function() { return trim($(this).text()); }).get();
                    game.releaseDate = trim($('article.game:first header .release_date span').text());
                    game.genre = trim($('article.game:first header .genre').text()).split(',');

                    window.close();
                }
                catch (err) {
                    window.close();
                    return gracefulExit(err);
                }

                if (!game.title || !game.title.length ||
                    !game.platforms || !game.platforms.length ||
                    !game.releaseDate || !game.releaseDate.length ||
                    !game.genre || !game.genre.length)
                    return gracefulExit(new Error('Could not get all fields for page ' + pageUri));

                return gracefulExit(null, game);
            }
        });
    });
})();
