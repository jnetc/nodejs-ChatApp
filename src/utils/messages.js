const generateMessage = (username = 'Admin', message) => {
  return {
    username,
    message,
    createdAt: new Date().getTime(),
  };
};
const generateLocationMessage = (url, username) => {
  return {
    username,
    url,
    createdAt: new Date().getTime(),
  };
};
module.exports = {
  generateMessage,
  generateLocationMessage,
};
