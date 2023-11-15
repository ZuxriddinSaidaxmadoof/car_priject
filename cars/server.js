const http = require("http");
const DataSource = require("./lib/dataSource");
const path = require("path");
const { User } = require("./lib/userClass");
const { Car } = require("./lib/carClass");
const { UserCar } = require("./lib/userCarClass");
const { isBoolean } = require("./lib/isBoolean");

const userDatabasePath = path.join(__dirname, "database", "users.json");
const carDatabasePath = path.join(__dirname, "database", "cars.json");
const useCarDatabasePath = path.join(__dirname, "database", "user_cars.json");

const userData = new DataSource(userDatabasePath);
const carData = new DataSource(carDatabasePath);
const userCarData = new DataSource(useCarDatabasePath);

const bodyParser = (req) => {
  return new Promise((resolve, reject) => {
    try {
      let jsonData = "";
      req.on("data", (chunk) => {
        jsonData = chunk.toString();
      });

      req.on("end", () => {
        if (jsonData) {
          resolve(JSON.parse(jsonData));
        } else {
          reject(false);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
};

const server = http.createServer(async (req, res) => {
  const url = req.url.split("/");
  const method = req.method;

  try {
    if (method === "GET" && url[1] === "user" && !url[2]) {
      const users = userData.read();

      res.writeHead(200, { "Content-Type": "Application/json" });
      res.end(JSON.stringify(users));
    } else if (method === "GET" && url[1] === "user" && url[2]) {
      const users = userData.read();

      const foundUser = users.find((user) => user.id === Number(url[2]));

      if (foundUser) {
        res.writeHead(200, { "Content-Type": "Application/json" });
        res.end(JSON.stringify(foundUser));
      } else {
        res.writeHead(404, { "Content-Type": "Application/json" });
        res.end(JSON.stringify("User not found"));
      }
    } else if (method === "POST" && url[1] === "user") {
      const body = await bodyParser(req);

      if (!body.fullName || !body.login) {
        res.writeHead(400, { "Content-Type": "Application/json" });
        return res.end(JSON.stringify("fullName and login must be required"));
      }

      const users = userData.read();

      const foundUserByLogin = users.find((user) => user.login === body.login);

      if (foundUserByLogin) {
        res.writeHead(400, { "Content-Type": "Application/json" });
        return res.end(JSON.stringify("This login already exist"));
      }

      let generateId = 0;

      users.forEach((user) => {
        if (generateId < user.id) {
          generateId = user.id;
        }
      });

      const newUser = new User(generateId + 1, body.fullName, body.login);

      users.push(newUser);

      userData.write(users);

      res.writeHead(201, { "Content-Type": "Application/json" });
      res.end(JSON.stringify(newUser));
    } else if (method === "PUT" && url[1] === "user" && url[2]) {
      const body = await bodyParser(req);

      if (!body.fullName) {
        res.writeHead(400, { "Content-Type": "Application/json" });
        return res.end(JSON.stringify("fullName must be required"));
      }

      const users = userData.read();

      const foundUserIndex = users.findIndex(
        (user) => user.id === Number(url[2])
      );

      const foundUserByLogin = users.find((user) => user.login === body.login);

      if (foundUserIndex === -1) {
        res.writeHead(404, { "Content-Type": "Application/json" });
        return res.end(JSON.stringify("User not found"));
      }

      const [foundUser] = users.splice(foundUserIndex, 1);

      if (foundUserByLogin && foundUser.login !== body.login) {
        res.writeHead(400, { "Content-Type": "Application/json" });
        return res.end(JSON.stringify("This login already exist"));
      }

      foundUser.full_name = body.fullName;
      foundUser.login = body.login;

      users.push(foundUser);

      userData.write(users);

      res.writeHead(200, { "Content-Type": "Application/json" });
      return res.end(JSON.stringify(foundUser));
    } else if (method === "DELETE" && url[1] === "user" && url[2]) {
      const users = userData.read();

      const foundUserIndex = users.findIndex(
        (user) => user.id === Number(url[2])
      );

      if (foundUserIndex === -1) {
        res.writeHead(404, { "Content-Type": "Application/json" });
        return res.end(JSON.stringify("User not found"));
      }

      // const cars = carData.read();

      // const filterCars = cars.filter((car) => car.user_id !== Number(url[2]));

      // carData.write(filterCars);

      const [deletedUser] = users.splice(foundUserIndex, 1);

      userData.write(users);

      res.writeHead(200, { "Content-Type": "Application/json" });
      return res.end(JSON.stringify(deletedUser));
    } else if (method === "GET" && url[1] === "car" && !url[2]) {
      const cars = carData.read();

      res.writeHead(200, { "Content-Type": "Application/json" });
      res.end(JSON.stringify(cars));
    } else if (method === "GET" && url[1] === "car" && url[2]) {
      const cars = carData.read();

      const foundCar = cars.find((car) => car.id === Number(url[2]));

      if (!foundCar) {
        res.writeHead(404, { "Content-Type": "Application/json" });
        return res.end(JSON.stringify("Car not found"));
      }

      res.writeHead(200, { "Content-Type": "Application/json" });
      res.end(JSON.stringify(foundCar));
    } else if (method === "POST" && url[1] === "car") {
      const body = await bodyParser(req);

      if (!body.model || !body.count) {
        res.writeHead(400, { "Content-Type": "Application/json" });
        return res.end(JSON.stringify("model and count must be required"));
      }
      // const users = userData.read();

      // const foundUser = users.find((user) => user.id === body.userId);

      // if (!foundUser) {
      //   res.writeHead(404, { "Content-Type": "Application/json" });
      //   return res.end(JSON.stringify("User not found"));
      // }

      const cars = carData.read();

      let generateId = 0;

      for (let i = 0; i < cars.length; i++) {
        const car = cars[i];

        if (generateId < car.id) {
          generateId = car.id;
        }
      }

      const newCar = new Car(generateId + 1, body.model, body.count);

      cars.push(newCar);
      carData.write(cars);

      res.writeHead(201, { "Content-Type": "Application/json" });
      return res.end(JSON.stringify(newCar));
    } else if (
      method === "GET" &&
      url[1] === "user-car" &&
      url[2] === "user" &&
      url[3]
    ) {
      const userCars = userCarData.read();

      const cars = carData.read();

      const filterCars = [];

      for (let i = 0; i < cars.length; i++) {
        const car = cars[i];

        for (let l = 0; l < userCars.length; l++) {
          const userCar = userCars[l];

          if (car.id === userCar.car_id && userCar.user_id === Number(url[3])) {
            filterCars.push(car);
          }
        }
      }

      res.writeHead(200, { "Content-Type": "Application/json" });
      res.end(JSON.stringify(filterCars));
    } else if (
      method === "GET" &&
      url[1] === "user-car" &&
      url[2] === "car" &&
      url[3]
    ) {
      const userCars = userCarData.read();

      const users = userData.read();

      const filterUsers = [];

      for (let i = 0; i < users.length; i++) {
        const user = users[i];

        for (let l = 0; l < userCars.length; l++) {
          const userCar = userCars[l];

          if (
            user.id === userCar.user_id &&
            userCar.car_id === Number(url[3])
          ) {
            filterUsers.push(user);
          }
        }
      }

      res.writeHead(200, { "Content-Type": "Application/json" });
      res.end(JSON.stringify(filterUsers));
    } else if (method === "POST" && url[1] === "user-car") {
      const body = await bodyParser(req);

      if (!body.userId || !body.carId) {
        res.writeHead(400, { "Content-Type": "Application/json" });
        return res.end(JSON.stringify("userId and carId must be required"));
      }

      const users = userData.read();
      const cars = carData.read();
      const foundUser = users.find((user) => user.id === body.userId);
      const foundCar = cars.find((car) => car.id === body.carId);

      if (!foundUser) {
        res.writeHead(404, { "Content-Type": "Application/json" });
        return res.end(JSON.stringify("user not found"));
      }
      if (!foundCar) {
        res.writeHead(404, { "Content-Type": "Application/json" });
        return res.end(JSON.stringify("car not found"));
      }

      const userCars = userCarData.read();

      const foundUserCar = userCars.find(
        (userCar) =>
          userCar.user_id === body.userId && userCar.car_id === body.carId
      );

      if (foundUserCar) {
        res.writeHead(400, { "Content-Type": "Application/json" });
        return res.end(JSON.stringify("This user already had a car"));
      }

      let generateId = 0;

      for (let i = 0; i < userCars.length; i++) {
        const userCar = userCars[i];

        if (generateId < userCar.id) {
          generateId = userCar.id;
        }
      }

      const newUserCar = new UserCar(generateId + 1, body.userId, body.carId);

      userCars.push(newUserCar);
     
       for(let i of cars ){
        if(i.id == body.carId){
          const changed = i.count--;
          console.log(i);
          cars[i.id].count = changed;
          carData.write(cars)
          break;
        }
      }


      userCarData.write(userCars);

      res.writeHead(201, { "Content-Type": "Application/json" });
      return res.end(JSON.stringify(newUserCar));
    } else if (
      method === "DELETE" &&
      url[1] === "user-car" &&
      url[2] &&
      url[3]
    ) {
      const userId = Number(url[2]);
      const carId = Number(url[3]);

      const userCars = await userCarData.readAsync();

      const founUserCarIndex = userCars.findIndex(
        (userCar) => userCar.user_id === userId && userCar.car_id === carId
      );

      if (founUserCarIndex === -1) {
        res.writeHead(404, { "Content-Type": "Application/json" });
        return res.end(JSON.stringify("userCar not found"));
      }

      const [deleteUserCar] = userCars.splice(founUserCarIndex, 1);

      userCarData.write(userCars);

      res.writeHead(200, { "Content-Type": "Application/json" });
      return res.end(JSON.stringify(deleteUserCar));
    } else {
      res.writeHead(405, { "Content-Type": "Application/json" });
      res.end(JSON.stringify("Method not allowed"));
    }
  } catch (error) {
    if (isBoolean(error)) {
      res.writeHead(400, { "Content-Type": "Application/json" });
      res.end(JSON.stringify("Bady must be required"));
    } else {
      res.writeHead(500, { "Content-Type": "Application/json" });
      res.end(JSON.stringify(error.message ?? "Server error"));
    }
  }
});

const port = 7777;

server.listen(port, () => {
  console.log(`server running on port: ${port}`);
});
