const Userdb = require('../models/user')
const passport = require('passport');
const multer = require('multer');
const {singleUpload,singleFileUpload} = require('../middlewares/filesMiddleware');
const { uuid } = require('uuidv4');
const jwt =require('jsonwebtoken');
const csv = require('csv-parser')
const fs = require('fs')
const msToTime = require('../middlewares/timeMiddleware')


// // staff registration controller
exports.register = async (req, res, next) => {
    try {

      //create the user instance
      user = new Userdb(req.body)
      const password = req.body.password
      //save the user to the DB
      await Userdb.register(user, password, function (error, user) {
        if (error) return res.json({ success: false, error }) 
        const newUser = {
          _id: user._id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          image: user.image,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          __v: user.__v
        }
        res.json({ success: true, newUser })
      })
    } catch (error) {
      res.json({ success: false, error })
    }
  }

  // reset password
  exports.changePassword = async (req, res, next) => {
    const {username} = req.query

    if(username){
      Userdb.findOne({ username },(err, user) => {
        // Check if error connecting
        if (err) {
          res.json({ success: false, message: err }); // Return error
        } else {
          // Check if user was found in database
          if (!user) {
            res.json({ success: false, message: 'Userdb not found' }); // Return error, user was not found in db
          } else {
            user.changePassword(req.body.oldpassword, req.body.newpassword, function(err) {
               if(err) {
                        if(err.name === 'IncorrectPasswordError'){
                             res.json({ success: false, message: 'Incorrect password' }); // Return error
                        }else {
                            res.json({ success: false, message: 'Something went wrong!! Please try again after sometimes.' });
                        }
              } else {
                res.json({ success: true, message: 'Your password has been changed successfully' });
               }
             })
          }
        }
      });
    }
    
  }

  // staff login controller
exports.login = (req, res, next) => {
  console.log(req.body)

  let payLoad = {}
  // perform authentication
  passport.authenticate('userdb', (error, user, info) => {
    console.log(error)
    if (error) return res.json({ success: false, error })
    if (!user){
      return res.json({
        success: false,
        message: 'email or password is incorrect'
      })
    }

      
    //login the user  
    req.login(user, (error) => {
      if (error){
        res.json({ success: false, message: 'something went wrong pls try again' })
      }else {
        req.session.user = user
        payLoad.id = user.username
        
        const token = jwt.sign(payLoad, 'myVerySecret');

        const newUser = {
          _id: user._id,
          token,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          otherName: user.otherName,
          phone: user.phone,
          image: user.image,
          vehicle: user.vehicle,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          __v: user.__v
        }
        
        res.json({ success: true, message: 'user login successful', newUser})
      }
    })
  })(req, res, next)
}


// find single user
exports.singleUser = async (req,res, next) => {
  const {username} = req.query

  const result = await Userdb.findOne({username});
  result
   ? res.json({success: true, message: result,})
   : res.json({success: false, message: result,})
}

exports.allUsers = async (req,res, next) => {

  const result = await Userdb.find();
  result
   ? res.json({success: true, message: result,})
   : res.json({success: false, message: result,})
}


// set profile pic
exports.setProfilePic = async (req,res, next) => {
  singleUpload(req, res, async function(err) {
    if (err instanceof multer.MulterError) {
    return res.json(err.message);
    }
    else if (err) {
      return res.json(err);
    }
    else if (!req.file) {
      return res.json({"image": req.file, "msg":'Please select an image to upload'});
    }
    if(req.file){

      if(req.query.hasOwnProperty('username') && Object.keys(req.query).length == 1){
        const result = await Userdb.findOne({username: req.query.username},{_id: 0,image: 1})

        try {
          fs.unlinkSync(result.image)
          //file removed
        } catch(err) {
          console.error(err)
        }
          console.log(result)
        await Userdb.findOneAndUpdate({username: req.query.username},{$set: {image: req.file.path}})
        const editedStaff = await Userdb.findOne({username: req.query.username})
        
        res.json({success: true,
          message: editedStaff,
                     },
          
      );
      }
       
    }
    });

        
  
}

// delete or remove user
exports.removeUser = async (req,res,next) => {
  const {username} = req.query;
  await Userdb.findOneAndDelete({username: username})
  res.json({success: true, message: `user with the id ${username} has been removed`})
}

// edit user
exports.editUser = async (req,res,next) => {
  const {username} = req.query;
  await Userdb.findOneAndUpdate({username: username}, req.body)
  res.json({success: true, message: `user with the username ${username} has been edited`})
}

// add a vehicle
exports.addVehicle = async (req,res,next) => {
  const {username,vehicle} = req.body
  vehicle.vehicleId = uuid()
  vehicle.location = null
  vehicle.locationTime = null

  vehicle.createdAt = new Date() 
 

  // console.log(clientActions.createdAt)

  const user = await Userdb.findOneAndUpdate({username},{$push:{"vehicle": vehicle}})
  console.log(vehicle)
  res.json({success: true, message: "user vehicle saved successfully", user});
  
}

// recieve location from tracker
exports.locationFromTracker = async (req,res,next) => {
  const {vehicleId,location} = req.body

  const user = await Userdb.findOneAndUpdate({"vehicle.vehicleId": vehicleId},
  {$set:{"vehicle.$.location": location}})

  // console.log(clientActions)
  res.json({success: true, message: "location recieved"});
}

// delete a vehicle
exports.removeVehicle = async (req,res,next) => {
  const {username, vehicleId} = req.body

  await Userdb.findOneAndUpdate(
    { username }, 
    { $pull: { vehicle: { vehicleId } } }
    // Multi
);

res.json({success: true, message: "vehicle removed"});

}