var template = require('../index.hbs'),
    normalize = require('./style/normalize.css'),
    fontStyle = require('./style/fonts.css'),
    style = require('./style/main.css'),
    html = template({
        firstName: 'Вася',
        lastName: 'Пупкин'
    });

// let ul = document.querySelector('.ul');

// ul.innerHTML = html;