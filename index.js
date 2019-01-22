/*var jsonServer = require('json-server');
var server = jsonServer.create();
var router = jsonServer.router('db.json');
var middlewares = jsonServer.defaults();
var port = Number(process.env.PORT || 3000);
server.use(middlewares);
server.use(router);
server.listen(port, function () {
    console.log('JSON Server is running')
});*/

//const basicAuth = require('express-basic-auth')
const bodyParser = require('body-parser')

const jsonServer = require('json-server');
/*const server = jsonServer.create()
const router = jsonServer.router('/var/local/db.json')
const db = router.db
const middlewares = jsonServer.defaults()*/
/*const express = require('express');
const server = express().set('json spaces', 2);*/
const filePath = "/var/local/db.json";
//const filePath = "/usr/local/data/db.json";
const low = require('lowdb');
const FileAsync = require('lowdb/adapters/FileAsync');
const adapter = new FileAsync(filePath);
const server = jsonServer.create();
router = jsonServer.router(filePath);
var db;
const middlewares = jsonServer.defaults();

const port = Number(process.env.PORT || 3000)

var huntingObj;
var fs = require('fs'),
    http = require('http'),
    https = require('https');

var options = {
    key: fs.readFileSync('/etc/letsencrypt/live/service.edening.net/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/service.edening.net/fullchain.pem'),
};

server.use(middlewares)
server.use(bodyParser.json())
/*server.use(basicAuth({
    users: { 'gff': 'gffsecret' }
})*/
low(adapter)
  .then(dbAsync => {
    db = dbAsync;
    });

server.use((req, res, next) => { // custom authorization here

    if (req.method == "GET") {
        next() // continue to JSON Server router
    } else if(req.method == "PATCH" && req.body.like) {

        huntingObj = db.get('huntings')
            .find({ id: req.body.like });

        if(huntingObj) {
            db.get('huntings')
                .find({ id: req.body.like })
                .assign({likes: {number: huntingObj.get('likes.number') + 1}})
                .write().then(hunting => {
                    res.status(200).json({
                        id: hunting.get('id'),
                        category: hunting.get('category'),
                        likes: {number: hunting.get('likes.number')}
                    });
                });

            /*res.status(200).json({
                id: huntingObj.get('id'),
                category: huntingObj.get('category'),
                likes: {number: huntingObj.get('likes.number')}
            });*/
        } else {
            res.sendStatus(400)
        }
  } else {
    res.sendStatus(401)
  }
})
server.use(router);
/*server.listen(port, () => {
        console.log('JSON Server is running')
})*/

https.createServer(options, server).listen(port, function(){
  console.log("JSON Server listening on port: " + port);
});