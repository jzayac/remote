var expect = require('chai').expect;
var clientModule = require('../clients');
// https://labs.chie.do/testing-a-node-js-rest-api-with-mocha-and-chai/

describe('clients model', function() {
  let client;
  // room name as key and array of clientsId
  let ioRoomMock = {}

  let ioMock = {};
  let joinRoom = {};

  let connected;

  beforeEach(() => {
    // console.log('BEFORE EACH')
    connected = [];
    joinRoom = {};
    // const arrayFake = [];
    // arrayFake.push = function(data) {

    //   connected.push(data);
    //   super.push(data);
    // }
    // const arrayFake = {
    //   push: {

    //   }

    // }
    ioRoomMock = {};
    ioMock = {
      sockets: {
        clients: (room) => {
          // ioMock.sockets[room] = {
            // join: function() {}
          // }
          return ioRoomMock[room]
        }
      }
    }

    client = clientModule(ioMock, connected)

  });

  // var todos = [];
  // beforeEach(function (done) {
  //   Todo.find({}, function(err,el) {
  //     if (!err) {
  //       todos = el;
  //       done();
  //     }
  //   })
  // });

  it('is deffined', () => {
    expect(client).to.exist
    expect(client.connect).to.exist
    expect(client.join).to.exist
    expect(client.disconnected).to.exist
  });

  it('connect', function() {
    client.connect('12345');
    expect(connected.length).to.equal(1)
    expect(connected[0].clientId).to.be.eql('12345')
    expect(connected[0].group).to.be.eql(null)
  });

  it('join group', function() {
    client.connect('client');
    client.connect('slave');
    expect(connected.length).to.equal(2)
    expect(connected[0].clientId).to.be.eql('client')
    expect(connected[1].clientId).to.be.eql('slave')
    expect(connected[0].group).to.be.eql(null)
    expect(connected[1].group).to.be.eql(null)
    const expectTrue = client.join('client', 'slave')
    expect(expectTrue).to.be.true
    expect(connected[0].slave).to.be.false
    expect(connected[1].slave).to.be.true
    expect(connected[0].group).to.exist
    expect(connected[0].group).to.be.eql(connected[1].group)
    expect(connected[0].group.slavesId).to.be.eql(['slave']);
    expect(connected[0].group.clientsId).to.be.eql(['client']);

    // expect(connected[1].group).to.be.eql(null)
  });


  describe('join cases', function() {

    it('join client to existing group', function() {
      client.connect('client');
      client.connect('slave');
      client.connect('client2');
      expect(connected.length).to.equal(3);
      expect(connected[0].clientId).to.be.eql('client');
      expect(connected[1].clientId).to.be.eql('slave');
      expect(connected[2].clientId).to.be.eql('client2');
      expect(connected[0].group).to.be.eql(null);
      expect(connected[1].group).to.be.eql(null);
      expect(connected[2].group).to.be.eql(null);
      let expectTrue = client.join('client', 'slave');
      expect(expectTrue).to.be.true;
      expectTrue = client.join('client2', 'slave');
      expect(expectTrue).to.be.true;
      expect(connected[0].slave).to.be.false;
      expect(connected[1].slave).to.be.true;
      expect(connected[2].slave).to.be.false;
      expect(connected[0].group).to.exist;
      expect(connected[0].group).to.be.eql(connected[1].group);
      expect(connected[2].group).to.be.eql(connected[1].group);
      expect(connected[0].group.slavesId).to.be.eql(['slave']);
      expect(connected[0].group.clientsId).to.be.eql(['client', 'client2']);
      // expect(connected[1].group).to.be.eql(null)
    });

    it('join slave to existing group', function() {
      client.connect('client');
      client.connect('slave');
      client.connect('slave2');
      expect(connected.length).to.equal(3);
      expect(connected[0].clientId).to.be.eql('client');
      expect(connected[1].clientId).to.be.eql('slave');
      expect(connected[2].clientId).to.be.eql('slave2');
      expect(connected[0].group).to.be.eql(null);
      expect(connected[1].group).to.be.eql(null);
      expect(connected[2].group).to.be.eql(null);
      let expectTrue = client.join('client', 'slave');
      expect(expectTrue).to.be.true;
      expectTrue = client.join('client', 'slave2');
      expect(expectTrue).to.be.true;
      expect(connected[0].slave).to.be.false;
      expect(connected[1].slave).to.be.true;
      expect(connected[2].slave).to.be.true;
      expect(connected[0].group).to.exist;
      expect(connected[0].group).to.be.eql(connected[1].group);
      expect(connected[0].group.slavesId).to.be.eql(['slave', 'slave2']);
      expect(connected[2].group).to.be.eql(connected[1].group);
    });
  });

  it('disconnected', () => {
    client.connect('client');
    expect(connected.length).to.equal(1)
    client.disconnected('client')
    expect(connected.length).to.equal(0);
  })

  it('disconnected multiple clients', () => {
    client.connect('client');
    client.connect('client2');
    client.connect('client3');
    client.connect('client4');
    expect(connected.length).to.equal(4)
    client.disconnected('client3')
    expect(connected.length).to.equal(3);
    client.disconnected('client')
    expect(connected.length).to.equal(2);
    expect(connected[0].clientId).to.equal('client2');
    expect(connected[1].clientId).to.equal('client4');
  })

  it('disconnected from existing group', () => {
    client.connect('client');
    client.connect('slave');
    expect(connected.length).to.equal(2)
    const expectTrue = client.join('client', 'slave');
    expect(expectTrue).to.be.true;
    expect(connected[0].group).to.be.eql(connected[1].group);

    client.disconnected('client')
    // expect(expectTrue).to.be.true;

    expect(connected.length).to.equal(1)
    expect(connected[0].group).to.be.eql(null);
    expect(connected[0].slave).to.be.false;
    // expect(connected.length).to.equal(0);
  });

  it('disconnected multiple from existing group', () => {
    client.connect('client');
    client.connect('client2');
    client.connect('client3');
    client.connect('slave');
    expect(connected.length).to.equal(4)
    let expectTrue = client.join('client', 'slave');
    expectTrue = client.join('client2', 'slave');
    expectTrue = client.join('client3', 'slave');
    // expect(expectTrue).to.be.true;
    // expect(connected[0].group).to.be.eql(connected[1].group);

    client.disconnected('client')
    // expect(expectTrue).to.be.true;

    expect(connected.length).to.equal(3)
    expect(connected[0].group).to.be.eql(connected[1].group);
    expect(connected[0].group.clientsId.length).to.be.eql(2);
    expect(connected[0].group.clientsId).to.be.eql(['client2', 'client3']);
    expect(connected[0].group.slavesId).to.be.eql(['slave']);

    client.disconnected('slave')
    expect(connected.length).to.equal(2)

    expect(connected[0].group).to.be.eql(null);
  });

});
