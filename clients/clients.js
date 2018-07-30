const clientsData = [];

const connected = {
  roonName: 'player',
  // maybe is not necessary to have array of clients if i can get it from socket.room
  slaveId: 1,
};

function Group(groupName, clientId, slaveId) {
  this.groupName = groupName;
  this.slavesId = [];
  this.slavesId.push(slaveId);
  this.clientsId = [];
  this.clientsId.push(clientId);
}

function Client(clientId) {
  this.clientId = clientId;
  this.name = 'random '+clientId;
  this.allowedToPair = true;
  this.group = null;
  this.slave = false;
}

Client.prototype.isInGrop = function() {
  return !!this.group;
}

Client.prototype.joinGroup = function(roomName, slaveClient) {
  if (this.isInGrop) {
    console.error('user aleardy in group')
  }

  this.group = new Group(roomName, slaveId)
}

module.exports = function(io, clients) {
  // clients = clients || clientsData;
  // io = io || {}
  // const clients = []
  clients = clients || []


  function findClientByClientId(clientId) {
    const id = getIdByClientId(clientId);
    return id !== -1 ? clients[id] : null;
  }

  // get key from connected by clientId
  function getIdByClientId(clientId) {
    let id = -1
    clients.forEach((client, key) => {
      if (clientId == client.clientId) {
        id = key;
      }
    });
    return id;
  }

  function getClients() {
    return clients;
  }

  function connect(socketId) {
    clients.push(new Client(socketId))
    // TODO: just only for TEST
    if (process.env.NODE_ENV === 'TEST' || true) {
      io.sockets[socketId] = {
        join: () => {},
        leave: () => {}
      }
    }
    // clients.push({
    //   clientId: socketId,
    //   name: 'hotentot',
    //   allowedToPair: true,
    //   connected: null,
    //   slave: true
    // });
  }

  function createNewGroup(groupName) {
    return new Group(groupName, clientId, slaveId)
  }

  function join(clientId, slaveId) {
    const clientDetails = findClientByClientId(clientId);
    if (!clientDetails) {
      console.error('not existing client')
      return false;
    }

    const slaveDetails = findClientByClientId(slaveId);
    if (!slaveDetails) {
      console.error('not existing slave')
      return false;
    }

    // if client have already defined room and is not slave then join slave to this group
    if (clientDetails.group && !slaveDetails.group) {
      const group = clientDetails.group;
      group.slavesId.push(slaveId)
      slaveDetails.slave = true;
      slaveDetails.group = group;

      io.sockets[slaveId].join(group.groupName);
      return true;
    }

    // if slave have already defined room and is already slave join client to this group
    if (!clientDetails.group && slaveDetails.group) {
      const group = slaveDetails.group;
      group.clientsId.push(clientId)
      clientDetails.group = group;

      io.sockets[clientId].join(group.groupName);
      return true;
    }

    // if both don't have room.. create it and join them to same group
    if (!clientDetails.group && !slaveDetails.group) {
      // TODO generate more readable group name
      const group = new Group('group.'+ clientId, clientId, slaveId)
      clientDetails.group = group;
      slaveDetails.group = group;

      slaveDetails.slave = true;

      io.sockets[clientId].join(group.groupName);
      io.sockets[slaveId].join(group.groupName);
      // TODO: inform clients master/slave 
      return true;
    }

    // othervise return false
    console.error('nothing from them')
    return false
  }

  function leave(socketId) {
    // index = getIdByClientId(socketId)
      // TODO: finalize
    index = getIdByClientId(socketId)
    // no need to leave disconnected user with socket io
    // according to this
    // https://stackoverflow.com/questions/42198973/does-it-need-to-socket-leave-a-room-on-disconnect-in-nodejs/42199119
    if (index === -1) {
      console.error('NOT FOUND KEY FOR USER')
      return
    }
    if (clients[index].isInGrop()) {
      const clientObj = clients[index];
      const group = clientObj.group;
      const isSlave = clientObj.slave;
      let key = isSlave ? 'slavesId' : 'clientsId';
      const idx = group[key].indexOf(clientObj.clientId);

      group[key].splice(idx, 1);

      if (group[key].length === 0) {
        let key = !isSlave ? 'slavesId' : 'clientsId';
        group[key].forEach(clientId => {
          // TODO:leave group
          io.sockets[clientId].leave(group.groupName);

          // there is no delet by reference?
          const t = findClientByClientId(clientId)
          t.group = null;

          // also remove slave if they are not in room
          if (key === 'slavesId') {
            t.slave = false
          }
        });
      }
    }
  }

  function disconnected(socketId) {
    index = getIdByClientId(socketId)
    // no need to leave disconnected user with socket io
    // according to this
    // https://stackoverflow.com/questions/42198973/does-it-need-to-socket-leave-a-room-on-disconnect-in-nodejs/42199119
    if (index === -1) {
      console.error('NOT FOUND KEY FOR USER')
      return
    }
    leave(socketId)
    // if (clients[index].isInGrop()) {
    //   const clientObj = clients[index];
    //   const group = clientObj.group;
    //   const isSlave = clientObj.slave;
    //   let key = isSlave ? 'slavesId' : 'clientsId';
    //   const idx = group[key].indexOf(clientObj.clientId);

    //   group[key].splice(idx, 1);

    //   if (group[key].length === 0) {
    //     let key = !isSlave ? 'slavesId' : 'clientsId';
    //     group[key].forEach(clientId => {
    //       // TODO:leave group
    //       io.sockets[clientId].leave(group.groupName);

    //       // there is no delet by reference?
    //       const t = findClientByClientId(clientId)
    //       t.group = null;

    //       // also remove slave if they are not in room
    //       if (key === 'slavesId') {
    //         t.slave = false
    //       }
    //     });
    //   }

    // }

    clients.splice(index, 1);
    return
  }

  return {
    connect: connect,
    join: join,
    getClients: getClients,
    disconnected: disconnected,
  }

}
