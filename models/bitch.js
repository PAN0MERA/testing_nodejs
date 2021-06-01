const mongoose = require("mongoose");


const Schema = mongoose.Schema;

const bitchSchema = new Schema({
  name:{
    type: String,
  },
  second_name:{
    type: String,
  },
  meta:{
    type:String,
  },
  photo:{
    type:String,
  },
  owner:{
    // id хозяина
    type: Schema.Types.ObjectId,
    ref: "User",
  }
});

module.exports = mongoose.model("Bitch", bitchSchema);
