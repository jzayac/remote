const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const socketAdapter = require('./clients/clients')(io)


// cookie identifi maybe more useful
//io.sockets.clients().connected[value].handshake
//
const socketNameWordilst = [
  'Nordic',
  'Galaxy',
  'Yearning',
  'Zeal',
  'Utopia',
  'Abolish',
  'Atomic',
  'Atlatis',
  'Galactica',
];

// clientId: {name, wordListId, clientId, room: {clientid: []clientid, masted: bool}}
let socketClients = {}

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  socketAdapter.connect(socket.id)
  console.log(socket.id)
  console.log('a user connected');
  console.log(socketAdapter.getClients())

  socket.on('disconnect', function(){
    console.log('user disconnected');
    

    io.emit('msg', "disconnected user")
  });

  socket.on('clients', () => {
    const tits = socketAdapter.getClients()
    console.log(tits)
    console.log(tits[0].group)
  })

  socket.on('room.info', () => {
    console.log(socket.rooms);

    // io.sockets.clients(nick.room); // all users from roo
    // console.log(io.sockets.clients())
    // console.log(io.sockets.clients().Namespace)
    // console.log(Object.keys(io.sockets.sockets))
    // console.log(Object.keys(io.sockets.clients()))

    // console.log(Object.keys(io.sockets.clients().connected))

    // const clients = Object.keys(io.sockets.sockets);

    // console.log(Object.keys(io.sockets.clients()))

    // clients.forEach((value) => {
    //   console.log('=====================')
    //   console.log( io.sockets.clients().connected[value].handshake)
    //   // console.log(io.sockets.clients()[value])
    //   console.log(value)
    // })

    // console.log(Object.keys(io.sockets.clients().connected))

    const connectedClientsId = Object.keys(io.sockets.clients().connected);
    const currentClientId = socket.id;
    const clients = []
     connectedClientsId.forEach(value => {
      if (value != currentClientId) {
        clients.push(value)
      }
    })
    console.log('=============>>>>>>>>>>>>>>>>>>')
      console.log(connectedClientsId)
    console.log(clients)
    // console.log(socket.id)
  });

  // clientId, room
  socket.on('join.client.to.group', slaveId => {
    socketAdapter.join(socket.id, slaveId)
    const tits = socketAdapter.getClients()
    console.log(tits)
    console.log(tits[0].group)
    // io.sockets[data.clientId].join(data.room);
    // socket.emit('slave.join.room', );
  });

  socket.on('leave.group', () => {
    socketAdapter(socket.id)
  })

  // socket.on('pair.and')

  socket.on('send.msg.to.client', data => {
    console.log('kokoootina')
    console.log(data)
    socket.broadcast.to(data.clientId).emit('msg', 'for your eyes only');
  });


  socket.emit('msg', "hello from server")
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});

