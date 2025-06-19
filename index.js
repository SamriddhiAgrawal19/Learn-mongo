const express = require('express');
const jwt = require('jsonwebtoken');
const  bcrypt = require('bcrypt');
const secret = 'your_jwt_secret';
const { UserModel, TodoModel } = require("./db");
const {z} = require('zod');
const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://acsamriddhi05:CmHhombjMS8n3wmc@cluster0.btfogcu.mongodb.net/todoapp")
  .then(() => console.log('MongoDB connected'));
const app = express();
app.use(express.json());
app.post('/signup', async (req, res) => {
// Validation schema
const userSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(20).regex(/[A-Z]/, 'Password must contain at least one uppercase letter').regex(/[0-9]/, 'Password must contain at least one number').regex(/[@$!%*?&]/, 'Password must contain at least one special character').regex(/[a-z]/, 'Password must contain at least one lowercase letter'),

    name: z.string().min(5).max(50)
});
try{
   const parsedData = userSchema.safeParse(req.body);
   if (!parsedData.success) {
       return res.status(400).send({ message: 'Invalid user data', errors: parsedData.error.errors });
   }
    const email = parsedData.data.email;
    const password = parsedData.data.password;
    const name = parsedData.data.name;
    const hashedPassword = await bcrypt.hash(password, 10);
    await UserModel.create({
        email : email,
        password: hashedPassword,
        name: name
    });
    res.status(201).send({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).send({ message: 'Error creating user', error: error.message });
    }



});
app.post('/signin', async (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    const user = await UserModel.findOne({
        email : email
    })
    
    const passwordMatch = bcrypt.compare(password, user.password);
    if (user && passwordMatch) {
        const token = jwt.sign({
            id: user._id.toString()
        }, secret);

        res.json({
            token
        })
    } else {
        res.status(403).json({
            message: "Incorrect creds"
        })
    }
});
app.post('/todo', auth, async (req, res) => {
    const title = req.body.title;
    const userId = req.userid;
    await TodoModel.create({
        userId: userId,
        title: title,
        done: false
    });
    res.json({ message: 'Todo created successfully' });

});
app.get('/todos', auth, async (req, res) => {
    const userId = req.userid;
    const todos = await TodoModel.find({ userId: userId });
    res.status(200).send(todos);
});
function auth(req , res , next){
    const token = req.headers.authorization;
    const  user = jwt.verify(token, secret);
    if(user){
        req.userid = user.id;
        next();
    }

    else{
        res.status(401).send({ message: 'Unauthorized' });
    }

}
app.listen(3000, () => {
    console.log('Server is running on "http://localhost:3000"');
});
