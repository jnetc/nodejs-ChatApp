const users = [];

// ДОБАВЛЯЕМ пользователя
const addUser = ({ id, username, room }) => {
  username = username.trim();
  room = room.trim();

  // Проверяем данные
  if (!username || !room) {
    return {
      error: 'Username and room required!',
    };
  }

  // Проверка существования пользователя
  const existingUser = users.find(user => {
    return user.room.match(room) && user.username.match(username);
  });

  // Проверка пользователя
  if (existingUser) {
    return {
      error: 'Username is in use!',
    };
  }

  // Создаем пользователя
  const user = { id, username, room };
  users.push(user);
  return { user };
};

// УДАЛЯЕМ пользователя
const removeUser = id => {
  const idx = users.findIndex(user => user.id === id);

  if (idx !== -1) {
    return users.splice(idx, 1)[0];
  }
};

// ПОЛУЧИТЬ пользователя
const getUser = id => {
  return users.find(user => user.id === id);
};

// ПОЛУЧИТЬ пользователей в комнате
const getUsersInRoom = room => {
  return users.filter(user => user.room === room);
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom
};
