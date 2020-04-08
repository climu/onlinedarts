var Game = require('./game.js')
const { v4: uuidv4 } = require('uuid');

function Room(id, name, password){
  this.name = name;
  this.sockets = [];
  this.jitsiRoom = uuidv4();
  this.password = password;
  this.game = new Game;
  this.id = id;
  this.lastActivity = Date.now();
  this.toClient = function(){
    return {
      name: this.name,
      game: this.game,
      public: this.password.length == 0,
      id: this.id,
    }
  }

  this.login = function(password, id){
    if (password == this.password){
      this.sockets.push(id);
      return true;
    } else {
      return false;
    }
  }

  this.isAuth = function(id){
    return (this.password.length == 0) || (this.sockets.includes(id))
  }
  this.cleanSockets = function(sockets){
    // sockets is the list of connected sockets (auth or not)
    // we remove all disconnected sockets from room.sockects
    this.sockets = this.sockets.filter(s => s in sockets)
  }
};

class Rooms extends Array {
  createNewRoom(name, password){
    // create a new room with the given name and password.
    if (this.length > 12){ // limit the number of rooms to 12
      return false
    }
    if (this.some(r => r.name == name)){
      // we already have a room with the same name.
      return false;
    }
    var room = new Room(this.length, name, password);
    this.push(room)
    return room;
  }

  toClient(){
    // prepare all rooms to be send to clients
    return this.map(r => r.toClient())
  }

  getRoomById(id){
    return this.find(r => r.id == id)
  }

  getRoomAndCheckAuth(roomId, socketId){
    // try to get room by its id and check if sockit is auth.
    // update room timestamp since this method will be called on every action
    // returns the room if both check pass and false otherwise
    var room = this.getRoomById(roomId)
    if ((room != undefined) && (room.isAuth(socketId))){
      // update timestamp
      room.lastActivity = Date.now();
      return room
    } else {
      return false
    }
  }

  cleanInactives(){
    // Remove all inactive rooms
    // number of milliseconds for a room to be considered inactive : 2 hour
    const inactivityLimit = 1000 * 60 * 60 * 2
    var rooms = this.filter(r =>  Date.now() - r.lastActivity < inactivityLimit)
    return rooms
  }
}



module.exports = Rooms;
