const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const port = process.env.PORT || 3000

app.set('view engine', 'ejs')


const Twit = require('twit')
const T = new Twit({
  consumer_key: 'CU3v9OQA7iKTpvygJNQgLWOqK',
  consumer_secret: 'By7e9Eq4TGLZ86L1oZSIQ9KAyndlfshOKuLvirsjWu02PHQQE8',
  access_token: '1040423191418687488-RDO5S8FXUoVdpazB6cr5Z7V1WOgNok',
  access_token_secret: '7aFTbBAX7Mlg1ObIOaDQujTO7O7WmM1dUqvlUEe0wxB1q',
  timeout_ms: 60*1000
})

const streams = {}

const createStream = term => {
  const stream = T.stream('statuses/filter', { track: term })
  // const stream = T.stream('statuses/filter', { track: '#apple', language: 'en' })
  // stream.on('connected', req => console.log(req))
  stream.on('tweet', tweet => {
    io.to(term).emit('tweet', {
      username: tweet.user.name,
      text: tweet.text,
      term
    })
  })
  streams[term] = stream
}

const checkStreams = () => {
  const terms = Object.keys(streams)
  terms
    .filter(t => (!(t in io.sockets.adapter.rooms)))
    .map( t => {
      streams[t].stop()
      delete streams[t]
    })
}

io.on('connection', socket => {

  socket.on('startStream', term => {
    if(!(term in streams)){
      createStream(term)
    }
    socket.join(term)
  })

  socket.on('disconnect', reason => {
    checkStreams()
    console.log(streams)
  })
})

/*

const stream = T.stream('statuses/filter', { track: '#apple' })
// const stream = T.stream('statuses/filter', { track: '#apple', language: 'en' })
// stream.on('connected', req => console.log(req))
stream.on('tweet', tweet => {
  console.log(tweet.user.name, tweet.text)
  io.emit('tweet', {
    username: tweet.user.name,
    text: tweet.text
  })
})

*/

app.get('/', (req,res) => res.render('home'))

http.listen(port, err => {
  if(err){
    console.log(err)
  }else{
    console.log('server running...')
  }
})