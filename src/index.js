var template = require('../friendItem.hbs'),
    normalize = require('./style/normalize.css'),
    fontStyle = require('./style/fonts.css'),
    style = require('./style/main.css');

class FriendsFilter {
    constructor() {
        this.mainContainer = document.getElementById('mainList');
        this.secondContainer = document.getElementById('secondList'),
        this.mainInput = document.getElementById('mainInput'),
        this.secondInput = document.getElementById('secondInput');
    }

    init() {
        this.addListeners();
        this.dragAndDropInit();

        window.addEventListener('load', () => {
            if (localStorage.mainList) {
                this.renderFromLocal();
            } else {
                this.getFriendList();
            }
        }) 
    }

    render(list) {
        this.mainContainer.innerHTML = template(list);
    }

    renderFromLocal() {
        let mainContent = JSON.parse(localStorage.mainList),
            secondContent = JSON.parse(localStorage.secondList);

        this.mainContainer.innerHTML = template(mainContent);
        this.secondContainer.innerHTML = template(secondContent);
    }

    csvExport() {
        let csvContent = 'data:text/csv;charset=utf-8,\uFEFF',
            mainContent = document.querySelectorAll('#mainList .friend'),
            secondContent = document.querySelectorAll('#secondList .friend');

        function generateCSV(content, header) {
            let arr = [];
            
            for (var i = 0; i < content.length; i++) {
                if (getComputedStyle(content[i]).display === 'flex') {
                    arr.push(content[i].innerText.trim());
                } 
            }

            arr.unshift(header + '\n');

            return csvContent + arr.join('\n');
        }

        function downloadCSV(content, fileName) {
            let encodedUri = encodeURI(content),
                link = document.createElement('a'),
                footer = document.getElementById('footer');

            link.setAttribute('href', encodedUri);
            link.setAttribute('download', fileName);
            link.style.display = 'none';
            footer.appendChild(link);
            
            link.click();
        }

        downloadCSV(generateCSV([...mainContent], 'Ваши друзья'), 'mainFrinedList.csv');
        downloadCSV(generateCSV([...secondContent], 'Друзья в списке'), 'secondFriendList.csv');
    }

    fiterList(location) {
        let inputValue,
            list;

        if (location === 'main') {
            inputValue = this.mainInput.value,
            list = this.mainContainer.querySelectorAll('.friend');
        } else if (location === 'second') {
            inputValue = this.secondInput.value,
            list = this.secondContainer.querySelectorAll('.friend');
        } else {
            console.log('Ошибка фильтрации, передайте верный location');
        }

        for (let i = 0; i < list.length; i++) {
            if (!this.isMatching(list[i].innerText, inputValue) && inputValue !== '') {
                list[i].style.display = 'none';
            } else {
                list[i].style.display = 'flex';
            }
        }
    }

    isMatching(full, chunk) {
        if (full.toLowerCase().indexOf(chunk.toLowerCase()) !== -1) {
            return true;
        } else {
            return false;
        }
    }

    addListeners() {
        let mainWrap = document.getElementById('mainWrap'),
            closeWindow = document.getElementById('closeWindow'),
            saveButton = document.getElementById('saveButton'),
            exportButton = document.getElementById('exportButton'),
            refreshButton = document.getElementById('refreshButton'),
            mainHead = document.getElementById('mainHead');

        function makeDataArray(nodeList) {
            let result = {
                response: []
            };

            for (let i = 0; i < nodeList.length; i++) {
                result.response[i] = {};
                let fullName = nodeList[i].innerText.trim().split(' ');

                result.response[i].first_name = fullName[0];
                result.response[i].last_name = fullName[1];
                result.response[i].photo_100 = nodeList[i].querySelector('.friend__foto').getAttribute('src');
            }

            return result;
        }

        // add and close buttons
        mainWrap.addEventListener('click', (e) => {
            if (!e.target.classList.contains('friend__icon')) {
                return;
            }

            if (e.target.closest('ul').getAttribute('id') === 'mainList') {
                let friend = e.target.closest('.friend');

                friend.remove();
                this.secondContainer.appendChild(friend);
                this.fiterList('second');
            } else if (e.target.closest('ul').getAttribute('id') === 'secondList') {
                let friend = e.target.closest('.friend');

                friend.remove();
                this.mainContainer.appendChild(friend);
                this.fiterList('main');
            }
            
        });

        // close window button
        closeWindow.addEventListener('click', () => {
            window.close();
        });

        // save button
        saveButton.addEventListener('click', () => {
            let mainContent = makeDataArray(document.querySelectorAll('#mainList .friend')),
                secondContent = makeDataArray(document.querySelectorAll('#secondList .friend'));

            localStorage.mainList = JSON.stringify(mainContent);
            localStorage.secondList = JSON.stringify(secondContent);
            confirm('Сохранено!')
        })

        // refresh button
        refreshButton.addEventListener('click', () => {
            localStorage.clear();
            this.mainInput.value = '';
            this.secondInput.value = '';
            this.mainContainer.innerHTML = '';
            this.secondContainer.innerHTML = '';
            this.getFriendList();
        })

        // export button
        exportButton.addEventListener('click', () => {
            this.csvExport();
        })

        // inputs
        mainHead.addEventListener('keyup', (e) => {
            if (e.keyCode === 16) {
                return;
            }
            if (e.target.getAttribute('id') === 'mainInput') {
                this.fiterList('main');
            } else if (e.target.getAttribute('id') === 'secondInput') {
                this.fiterList('second');
            }
        })
    }

    getFriendList() {
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
                filter.render(result);
            })
            .catch((error) => {
                console.log('Произошла ошибка ' + error.message);
            })
    }

    dragAndDropInit() {
        let container = document.getElementById('mainWrap'),
            element = null;

        container.addEventListener('dragstart', (e) => {
            let dt = event.dataTransfer;

            element = e.target;
            dt.setData('text/html', e.target.innerHTML);
            event.dataTransfer.effectAllowed = 'move';
        });

        container.addEventListener('dragover', (e) => {
            if (e.target.classList.contains('main__section') || 
                e.target.closest('.friend')) {
                e.preventDefault();
            }
        })

        container.addEventListener('drop', (e) => {
            if (e.target.classList.contains('main__section')) {
                e.target.querySelector('.main__list').appendChild(element);
            } else if (e.target.closest('.friend')) {
                e.target.closest('.main__list').insertBefore(element, e.target.closest('.friend').nextElementSibling);
            }

            if (e.target.closest('.main__container_left')) {
                this.fiterList('main');
            } else if (e.target.closest('.main__container_right')) {
                this.fiterList('second');
            }
        })
    }
}

let filter = new FriendsFilter();

filter.init();