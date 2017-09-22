var template = require('../friendItem.hbs'),
    normalize = require('./style/normalize.css'),
    fontStyle = require('./style/fonts.css'),
    style = require('./style/main.css');

class FriendsFilter {
    constructor(list) {
        this.friendlist = list;
        this.html = template(this.friendlist);
    }

    render() {
        this.firstContainer = document.querySelector('#mainList');

        this.firstContainer.innerHTML = this.html;
    }
}

// getting the friends list

window.addEventListener('load', function() {
    const promise = new Promise((resolve, reject) => {
        VK.init({
            apiId: 6192612
        });

        VK.Auth.login((data) => {
            if (data.status === 'connected') {
                resolve();
            } else {
                reject(new Error('Авторизация не удалась'));
            }
        }, 2);
    });

    promise
        .then(() => {
            return new Promise((resolve, reject) => {
                VK.api('friends.get', {
                    'order': 'name',
                    'fields': 'photo_100',
                    'name_case': 'nom'
                }, (result) => {
                    if (result.error) {
                        reject(new Error('Не удалось получить список друзей'));
                    } else {
                        resolve(result);
                    }
                })
            });
            
        })
        .then((result) => {
            let filter = new FriendsFilter(result);
            
            filter.render();
        })
        .catch((error) => {
            console.log(error);
        })
});