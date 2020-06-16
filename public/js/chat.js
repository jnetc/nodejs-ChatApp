const socket = io();
const $form = document.getElementById('message-form');
const $inputMessage = $form.querySelector('input');
const $sendMessageBtn = $form.querySelector('button');
const $geolocationBtn = document.getElementById('geolocation');
const $messages = document.getElementById('messages');

// ШАБЛОНЫ
const messageTemplate = document.getElementById('message-template').innerHTML;
const urlTemplate = document.getElementById('location-message-template')
  .innerHTML;
const sidebar = document.getElementById('sidebat-template').innerHTML;

// АДРЕСНЫЕ ЗАПРОСЫ СТРОКИ
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

// АВТОСКРОС ЧАТА
const autoscroll = () => {
  // Получить элемент последнего сообщения
  const $newMessage = $messages.lastElementChild;

  // Высота последнего сообщения
  const newMessageStyles = getComputedStyle($newMessage);
  const newMessageMargin = parseInt(newMessageStyles.marginBottom);
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

  // Видимая высота
  const visibleHeight = $messages.offsetHeight;

  // Общая высота сообщений
  const containerHeight = $messages.scrollHeight;

  // Как далеко скролить?
  const scrollOffset = $messages.scrollTop + visibleHeight;

  if (containerHeight - newMessageHeight <= scrollOffset) {
    $messages.scrollTop = $messages.scrollHeight;
  }
};

// ПОДКЛЮЧЕНИЕ СОКЕТА
socket.on('message', ({ message, username, createdAt }) => {
  const html = Mustache.render(messageTemplate, {
    message,
    username,
    createdAt: moment(createdAt).format('k:mm'),
  });
  // Устанавливаем в DOM
  $messages.insertAdjacentHTML('beforeend', html);

  // Автоскрол когда получаем новое сообщение в чате
  autoscroll();
});

// ФОРМА ОТПРАВКИ СООБЩЕНИЙ
$form.addEventListener('submit', e => {
  e.preventDefault();
  // Отключаем кнопку, чтоб не было повторного нажатия
  $sendMessageBtn.setAttribute('disabled', 'disabled');
  // Проверка поля ввода
  if ($inputMessage.value == '') {
    $sendMessageBtn.removeAttribute('disabled');
    return console.log('Field is empty!');
  }
  // На стороне клиента создаем событие
  // Название события, тело сообщения, функцию вызова
  socket.emit('sendMessage', $inputMessage.value, msg => {
    // Включаем кнопку, чистим поле ввода и оставляем фокус на поле
    $sendMessageBtn.removeAttribute('disabled');
    $inputMessage.value = '';
    $inputMessage.focus();
    // Проверка на цензуру
    if (msg) {
      return console.log(msg);
    }
    console.log('Message was sended...');
  });
});

// КОМНАТЫ отрисовка боковой панели пользователей (SIDEBAR)
socket.on('roomData', ({ room, users }) => {
  const html = Mustache.render(sidebar, {
    room,
    users,
  });
  // Устанавливаем в DOM
  document.getElementById('sidebar').innerHTML = html;
});

// URL
socket.on('locationMessage', ({ url, username, createdAt }) => {
  const html = Mustache.render(urlTemplate, {
    url,
    username,
    createdAt: moment(createdAt).format('k:mm'),
  });
  // Устанавливаем в DOM
  $messages.insertAdjacentHTML('beforeend', html);

  // Автоскрол когда получаем ссылку в чате
  autoscroll();
});

// ОТПРАВКА ГЕОДАННЫХ
$geolocationBtn.addEventListener('click', function () {
  // Проверка поддержки браузером
  if (!navigator.geolocation) {
    return new Error('Geolocation is not supported by your browser');
  }
  // Отключаем нажатие кнопки и заменяем текст
  this.setAttribute('disabled', 'disabled');
  this.textContent = 'Loading';
  // Получаем геоданные
  navigator.geolocation.getCurrentPosition(pos => {
    const { latitude, longitude } = pos.coords;
    // Создаем событие
    socket.emit('sendLocation', { latitude, longitude }, () => {
      console.log('Location shared!');
      // Включаем кнопку и возвращаем начальное название кнопки
      this.removeAttribute('disabled');
      this.textContent = 'Send location';
    });
  });
});

// КОМНАТЫ ЧАТОВ
// Создаем подключение / пользователь и комната
socket.emit('join', { username, room }, error => {
  if (error) {
    alert(error);
    location.href = '/';
  }
});
