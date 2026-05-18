dotenv.config();
const app = require('./app');
const connectTDB= require('./config/database');

connectTDB();

app.listen(3000,()=>{
    console.log("Server is running on port 3000");
})