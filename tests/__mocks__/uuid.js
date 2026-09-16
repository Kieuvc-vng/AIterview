// Mock uuid for Jest
let counter = 0;

const v4 = () => {
  counter += 1;
  return `mock-uuid-${counter}`;
};

module.exports = {
  v4
};
