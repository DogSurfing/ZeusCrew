var Q = require('q');
var Journey = require('./journeyModel.js');
var User = require('../users/userModel.js');
var crypto = require('crypto');
var findJourney = Q.nbind(Journey.findOne, Journey);
var createJourney = Q.nbind(Journey.create, Journey);
var deleteJourney = Q.nbind(Journey.update, User);
var findUserRoute = Q.nbind(User.findOne, User);


module.exports = {
  shareJourney: function(req, res, next) {
    var hash = req.body.hash;
    var start = req.body.startPoint;
    var end = req.body.endPoint;
    var wayPoints = req.body.wayPoints;
    findJourney({hash: hash}).then(function(result) {
      if (!result) {
        console.log('hello');
        Journey.create({
          startPoint: start,
          endPoint: end,
          wayPoints: wayPoints,
          hash: hash
        }, function(err, data) {
          if (err) {
            res.send(err);
          } else {
            res.send(data);
          }
        });
      } else {
        res.send('hello');
      }
    });

  },
  saveJourney: function (req, res, next) {
    // req.body has start, end and waypoints
    var createSha = function (points) {
      var shasum = crypto.createHash('sha1');
      shasum.update(points);
      return shasum.digest('hex').slice(0, 5);
    };
    var username = req.body.username;
    var start = req.body.start;
    var end = req.body.end;
    var waypoints = [];

    for (var i = 0; i < req.body.waypoints.length; i++) {
      waypoints[req.body.waypoints[i].position] = [req.body.waypoints[i].name, req.body.waypoints[i].location, req.body.waypoints[i].geometry.lat, req.body.waypoints[i].geometry.lng];
    }
    var waypointsCopy = [].concat.apply([], waypoints);
    waypoints = waypointsCopy;
    findUserRoute({username: username}).then(function(profile) {
      var routeObj = {
        startPoint: start,
        endPoint: end,
        wayPoints: waypoints
      };
      var hash = createSha(routeObj.wayPoints.length.toString() + routeObj.startPoint + routeObj.endPoint);
      routeObj.hash = hash;
      var found = false;
      profile.userRoute.forEach(function(route) {
        if (route.hash === routeObj.hash) {
          found = true;
        }
      });
      if (!found) {
        profile.userRoute.push(routeObj);
        profile.save();
      }
    });
    
  },
  getUserRoute: function(req, res, next) {
    var username = req.params.username;
    findUserRoute({username: username})
    .then(function(profile) {
      res.status(200).send(profile.userRoute);
    })
    .catch(function(err) {
      next(err);
    });
  },
  // getAll is not used atm
  getShareJourney: function(req, res, next) {
    console.log('inside getshareJourney');
    Journey.find().then(function(data) {
      res.status(200).send(data);
    })
    .catch(function(err) {
      res.send(err);
    });
  },
  getAll: function (req, res, next) {
    var username = req.params.username;
    findUserRoute({username: username})
    .then(function(data) {
      res.status(200).send(data.userRoute);
    })
    .catch(function(error) {
      next(error);
    });
  },
  deleteOne: function (req, res, next) {
    var hash = req.body.data.hash;
    var username = req.body.data.username;
    deleteJourney(
      {username: username},
      {$pull: {'userRoute': {'hash': hash}}})
      .then(function (result) {
        res.status(200).send(result);
      });
  }
};
