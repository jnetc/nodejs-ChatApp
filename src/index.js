const express = require('express');
const path = require('path');
const Filter = require('bad-words');

// Import Utils
const {
  generateMessage,
  generateLocationMessage,
} = require('./utils/messages');

const {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
} = require('./utils/users');

// Init app
const app = express();
// Init http server
const server = require('http').createServer(app);
// Init Web Socket server
const io = require('socket.io')(server);

// Init Public folder
app.use(express.static(path.join(__dirname, '../public')));

// Подключение сокета
io.on('connection', socket => {
  // Отправка сообщения всем в чате
  // Создаём событие и сообщение
  //// socket.emit('message', generateMessage('Welcome!'));

  // Оправка всем пользователям сообщение, кроме текущего
  //// socket.broadcast.emit('message', generateMessage('New user is joined...'));

  // Получаем данные с клиента о пользователе
  // и комнате к которой он подключается
  socket.on('join', ({ username, room }, callback) => {
    // Добавляем пользователя и сохраняем в "UTILS"
    // Socket имеет уникальный свой ИД при подключении пользователя
    // error, user = Функция возвращает 2 объекта по этому декострукция
    const { error, user } = addUser({ id: socket.id, username, room });
    // const { room, username}

    if (error) {
      return callback(error);
    }

    // Подключаем комнату
    socket.join(user.room);
    // Добавление 'to' дает принадлежность к текущей комнате чата
    socket.emit('message', generateMessage(undefined, 'Welcome!'));
    socket.broadcast
      .to(user.room)
      .emit('message', generateMessage(user.username, 'has joined!'));

    // Создаем новое событие для получения пользователей в комнате чата
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room),
    });

    callback();
  });

  // Получение сообщения от пользователя на сервер
  // Второй аргумент может иметь сообщение и функцию вызова
  socket.on('sendMessage', (message, callback) => {
    const { room, username } = getUser(socket.id);
    // Фильтруем сообщение
    const filter = new Filter();
    if (filter.isProfane(message)) {
      return callback('Message has incorrect');
    }
    // Ссыламся на emit событие 'message'
    // Отправка полученого сообщение от пользователя всем в чате
    io.to(room).emit('message', generateMessage(username, message));
    // Возвращаем ответ, что сообщение доставлено
    callback('Message delivered!');
  });

  // Получаем геоданные
  socket.on('sendLocation', (coords, callback) => {
    const { room, username } = getUser(socket.id);
    const url = `https://google.com/maps?q=${coords.latitude},${coords.longitude}`;
    io.to(room).emit('locationMessage', generateLocationMessage(url, username));

    callback();
  });

  // Отключение пользователя
  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      // Отправка сообщения для всех в чате об уходе пользователя
      io.to(user.room).emit(
        'message',
        generateMessage(undefined, `${user.username} has left!`)
      );
        // Получаем список чата без пользователя
      io.to(user.room).emit('roomData', {
        room: user.room,
        users: getUsersInRoom(user.room)
      });
    }
    
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(' Server running... '));
