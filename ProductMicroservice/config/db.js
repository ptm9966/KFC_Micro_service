const mongoose = require("mongoose");
mongoose.set('strictQuery', true);
const connect = async ()=>{
    try {
        const connection = mongoose.connect(process.env.DB_URL)
        await connection
        console.log("Products DB Connection secure")
    } catch (error) {
        console.log(`Products DB Connection Error ${error}`);
        process.exit(1)
    }
};

module.exports = connect