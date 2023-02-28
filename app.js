const express = require('express') //importing express
const clc = require("cli-color");//cli color import
const { validationOfForm, jwtSign, sendVerificationEmail } = require('./utils/ValidationPage');//validation page connecting
const mongoose = require("mongoose");//mongodb importing
const userSchema = require('./userSchema');//created useschema and imported
const bcrypt=require('bcrypt')
const validator = require('validator')
const {isAuth}=require("./middleware/Auth")
const session = require("express-session");
const mongoDbSession = require("connect-mongodb-session")(session);
const jwt = require("jsonwebtoken")
const path = require("path")
const Router = require('router')
const app = express()
const router = Router()
const PORT = process.env.PORT || 7000//there will be same servers the port hels to in creating server or we can use our server
const saltRound=10
app.set('view engine', 'ejs');//setting ejs to file
app.set('views', path.join(__dirname, 'views'));
mongoose.set("strictQuery", true);//copy from the terminal after connecting mongodb
const MONGO_URL = `mongodb+srv://srinivasmuchu14:khO4JposgRjtqcC2@cluster0.jqqyttu.mongodb.net/my-first-nodejs-app`//url from mongodb atlas
//connecting mongodb
mongoose.connect(MONGO_URL).then((res) => {
    console.log(clc.green("connection to mongodb done"));
}).catch(err => {
    console.log(clc.red(err))
})
//middlewares
app.use(express.json())//it will store the data
app.use(express.urlencoded({ extended: true }))
const store = new mongoDbSession({
    uri: MONGO_URL,
    collection: "sessions",
  });
  
  app.use(
    session({
      secret: "This is your server ",
      resave: false,
      saveUninitialized: false,
      store: store,
    })
  );

//routes for the website
app.get('/', (req, res) => {
    return res.send("this is my server")
});
app.get('/registration', (req, res) => {
    res.render("register")
});
app.get('/login', (req, res) => {
    res.render("login")
});
app.get('/profile', (req, res) => {

    res.render("profile")
});
//creating post request for register page
app.post("/registration", async (req, res)=>{
    console.log(req.body); 
    const {name,username,email,password,phonenumber } = req.body;
    try{
        await validationOfForm({name,username,email,password,phonenumber});
    }
    catch(err){
        return res.send({
            status:400,
            message:err,
        })
    }

    // Hashing the Password
    const hashedPassword = await bcrypt.hash(password,7);
    // console.log(hashedPassword);

    // Instering the data into the Db
    let user = new userSchema({
        name: name,
        username: username,
        email:email,
        phonenumber:phonenumber,
        password: hashedPassword,
        emailAuthenticated: false,
        });
        // console.log(user);
        
        let userExists;
        try{
            userExists = await userSchema.findOne({ email })
        }
        catch(err){
            return res.send({
                status:400,
                message:"Internal Server Error. Please try again",
                error:err
            })
        }
        
        if(userExists){
            return res.send({
                status:400,
                message:"User Already Exists"
            })
        }
        
        // generating the token
        const verificationToken = jwtSign(email)
        try{
            const userDB = await user.save(); //Create a operations in DataBase. CRUD Operations
            // console.log(userDB);
        
            // send verification Email to user
        sendVerificationEmail(email, verificationToken)

            // res.redirect("/login");
            return res.send({
                status: 200,
                message:
                  "Verification has been sent to your mail Id. Please verify before login",
                data: {
                  _id: userDB._id,
                  username: userDB.username,
                  email: userDB.email,
                },
              });
    }
    catch(err){
        return res.send({
            status:400,
            message:"Internal Server Error, Please try again",
            error:err
            });
        }
    })
    
    app.get("/verifyEmail/:id", (req, res) => {
        const token = req.params.id;
        console.log(req.params);
        jwt.verify(token, "backendnodejs", async (err, verifiedJwt) => {
          if (err) res.send(err);
      
          console.log(verifiedJwt);
      
          const userDb = await userSchema.findOneAndUpdate(
            { email: verifiedJwt.email },
            { emailAuthenticated: true }
          );
          console.log(userDb);
          if (userDb) {
            return res.status(200).redirect("/login");
          } else {
            return res.send({
              status: 400,
              message: "Invalid Session link",
            });
          }
        });
        return res.status(200);
      });

    app.post('/login', async(req, res)=>{
    // console.log(req.body);
    const {loginId, password} = req.body;
    if (
      typeof loginId != "string" ||
      typeof password != "string" ||
      !loginId ||
      !password
    ) {
      return res.send({
        status: 400,
        message: "Invalid Data",
      });
    }
    let userDB;
    try{
        if(validator.isEmail(loginId)){
            userDB = await userSchema.findOne({ email: loginId})
        }
        else{
            userDB = await userSchema.findOne({ username: loginId})
        }
        // console.log(userDB);

        if(!userDB){
            return res.send({
                status:400,
                message:"User Not Found, Please Register First.",
                error:err
            });
        }

        
        // check for email authnetication
        if (userDB.emailAuthenticated === false) {
            return res.send({
              status: 400,
              message: "Please verifiy your mailid",
            });
          }

        const isMatch = await bcrypt.compare(password, userDB.password);
        if(!isMatch){
            return res.send({
                status:400,
                message:"Invalid Password",
                data:req.body
            });
        }

        // Final Return
        req.session.isAuth = true;
        req.session.user = {
            username: userDB.username,
            email: userDB.email,
            userId: userDB._id
        };


       res.redirect("/profile");
    // return res.send({
    //     status:200,
    //     message:"Login successfully"
    // })
    } 
    catch(err){
        return res.send({
            status:400,
            message:"Internal Server Error, Please login again",
            error:err
        })
    }
    })
    app.post("/logout", isAuth, (req,res)=>{
        req.session.destroy((err)=>{
            if(err) throw err;
    
            res.redirect("/login");
        })
    }); 
    let user = []
    app.get("/profile", isAuth, async (req, res)=>{
    user = await userSchema.findOne({username : req.session.user.username}) ;
    console.log(user)
    return res.render("profile",{user : user});
})
//to show data in console that is terminal console
app.listen(PORT, () => {
    console.log(clc.yellow("app is running"));
    console.log(clc.blue.underline(`http://localhost:${PORT}`));
})





// password khO4JposgRjtqcC2