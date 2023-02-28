const validator = require('validator')
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer")

const validationOfForm=({name,email,username,phonenumber,password})=>{
return new Promise((resolve,reject)=>{
    if(!name||!email||!username||!phonenumber||!password){
        reject("please check all the fields")
    }
    if(typeof email!== 'string')
    reject("invalid email")
    if(typeof username!=='string')
    reject("invalid name")
    if(typeof password !== 'string')
    reject("invalid password")
    if(!validator.isEmail(email))
    reject("invalid email")
    if(username.length<2||username.length>25)
    reject("username should be greater than 2 and less than 25 characters")
    if(name.length<4||name.length>25)
    reject('name should be greater than 2 and less than 25 characters')
    if(password.length<4)
    reject(" password should be greater than 4 characters")
   if(phonenumber.length!==10)
   reject("Enter Valid 10 digit Phone number")
    resolve()
})
}
const jwtSign = (email) => {
    const JWT_TOKEN = jwt.sign({ email: email }, "backendnodejs", {
      expiresIn: "15d",
    });
    return JWT_TOKEN;
  };

  const sendVerificationEmail = (email, verificationToken) =>{
    console.log(email, verificationToken);
    // mzblkmpcpfuftxdk
    let mailer = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        service: "Gmail",
        auth: {
          user: "srinivasmuchu14@gmail.com",
          pass: "mzblkmpcpfuftxdk",
        },
      });
    
      let sender = "node js";
      let mailOptions = {
        from: sender,
        to: email,
        subject: "Email Verification to login profile",
        html: `Press <a href=http://localhost:7000/verifyEmail/${verificationToken}> Here </a> to verify your account.`,
      };
    
      mailer.sendMail(mailOptions, function (err, response) {
        if (err) throw err;
        else console.log("Mail has been sent successfully");
      });
}
module.exports={validationOfForm, jwtSign, sendVerificationEmail}



//mzblkmpcpfuftxdk